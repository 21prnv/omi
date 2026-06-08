//! Screen capture + foreground-window monitoring.
//!
//! Replaces ScreenCaptureService.swift and ProactiveAssistants/WindowMonitor.swift.
//! - `foreground_window()` (Win32 GetForegroundWindow) drives proactive-assistant
//!   triggers — which app/window the user is looking at.
//! - `capture_frame()` grabs the primary display via GDI BitBlt (one-shot, BGRA).
//!   Continuous recording for Rewind will use Windows.Graphics.Capture instead.
//!
//! Windows impls are `#[cfg(windows)]` and cross-checked against the windows-msvc
//! target from the macOS dev box; non-Windows returns `Error::Unsupported`.

use crate::Result;

/// One captured desktop frame (BGRA), handed to Rewind for encoding/OCR.
pub struct ScreenFrame {
    pub width: u32,
    pub height: u32,
    pub bgra: Vec<u8>,
}

/// Identifies the current foreground app/window for proactive assistants.
#[derive(Clone, Debug, Default)]
pub struct ForegroundWindow {
    pub app_name: String,
    pub title: String,
}

pub struct ScreenCapture;

impl ScreenCapture {
    pub fn new() -> Self {
        Self
    }

    /// Grab a single frame of the primary display.
    pub fn capture_frame(&self) -> Result<ScreenFrame> {
        #[cfg(windows)]
        {
            imp::capture_primary()
        }
        #[cfg(not(windows))]
        {
            Err(crate::Error::Unsupported)
        }
    }

    /// Current foreground window (drives WindowMonitor-style assistant triggers).
    pub fn foreground_window(&self) -> Result<ForegroundWindow> {
        #[cfg(windows)]
        {
            imp::foreground_window()
        }
        #[cfg(not(windows))]
        {
            Err(crate::Error::Unsupported)
        }
    }
}

impl Default for ScreenCapture {
    fn default() -> Self {
        Self::new()
    }
}

// ── Windows implementations (cross-checked for windows-msvc) ─────────────────
#[cfg(windows)]
mod imp {
    use super::{ForegroundWindow, ScreenFrame};
    use crate::{Error, Result};
    use windows::core::PWSTR;
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::Graphics::Gdi::{
        BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC,
        GetDIBits, ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
        HGDIOBJ, SRCCOPY,
    };
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
        PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetSystemMetrics, GetWindowTextLengthW, GetWindowTextW,
        GetWindowThreadProcessId, SM_CXSCREEN, SM_CYSCREEN,
    };

    pub fn capture_primary() -> Result<ScreenFrame> {
        unsafe {
            let width = GetSystemMetrics(SM_CXSCREEN);
            let height = GetSystemMetrics(SM_CYSCREEN);
            if width <= 0 || height <= 0 {
                return Err(Error::Screen("invalid screen metrics".into()));
            }

            let screen_dc = GetDC(None);
            let mem_dc = CreateCompatibleDC(screen_dc);
            let bitmap = CreateCompatibleBitmap(screen_dc, width, height);
            let old = SelectObject(mem_dc, HGDIOBJ(bitmap.0));

            let blit = BitBlt(mem_dc, 0, 0, width, height, screen_dc, 0, 0, SRCCOPY);

            // Top-down 32-bit BGRA via negative biHeight.
            let mut bmi = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: width,
                    biHeight: -height,
                    biPlanes: 1,
                    biBitCount: 32,
                    biCompression: BI_RGB.0,
                    ..Default::default()
                },
                ..Default::default()
            };
            let mut buf = vec![0u8; (width as usize) * (height as usize) * 4];
            let scanlines = if blit.is_ok() {
                GetDIBits(
                    mem_dc,
                    bitmap,
                    0,
                    height as u32,
                    Some(buf.as_mut_ptr() as *mut std::ffi::c_void),
                    &mut bmi,
                    DIB_RGB_COLORS,
                )
            } else {
                0
            };

            // Cleanup GDI objects regardless of outcome.
            SelectObject(mem_dc, old);
            let _ = DeleteObject(HGDIOBJ(bitmap.0));
            let _ = DeleteDC(mem_dc);
            ReleaseDC(None, screen_dc);

            if blit.is_err() || scanlines == 0 {
                return Err(Error::Screen("BitBlt/GetDIBits failed".into()));
            }
            // GDI leaves the 4th byte undefined; force opaque alpha.
            for px in buf.chunks_exact_mut(4) {
                px[3] = 255;
            }
            Ok(ScreenFrame { width: width as u32, height: height as u32, bgra: buf })
        }
    }

    pub fn foreground_window() -> Result<ForegroundWindow> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.0.is_null() {
                return Err(Error::Screen("no foreground window".into()));
            }
            let len = GetWindowTextLengthW(hwnd);
            let mut buf = vec![0u16; len as usize + 1];
            let n = GetWindowTextW(hwnd, &mut buf);
            let title = String::from_utf16_lossy(&buf[..n as usize]);

            let mut pid = 0u32;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            let app_name = process_name(pid).unwrap_or_default();

            Ok(ForegroundWindow { app_name, title })
        }
    }

    /// Best-effort executable basename for a pid (e.g. "chrome.exe").
    fn process_name(pid: u32) -> Option<String> {
        unsafe {
            let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
            let mut buf = vec![0u16; 260];
            let mut size = buf.len() as u32;
            let res = QueryFullProcessImageNameW(
                handle,
                PROCESS_NAME_WIN32,
                PWSTR(buf.as_mut_ptr()),
                &mut size,
            );
            let _ = CloseHandle(handle);
            res.ok()?;
            let path = String::from_utf16_lossy(&buf[..size as usize]);
            Some(path.rsplit('\\').next().unwrap_or(&path).to_string())
        }
    }
}
