//! Screen capture + foreground-window monitoring.
//!
//! Replaces ScreenCaptureService.swift and ProactiveAssistants/WindowMonitor.swift.
//! Windows path: Windows.Graphics.Capture (WGC) for frames, Win32 GetForegroundWindow
//! / EnumWindows for the active-window stream that drives proactive assistants.
//!
//! Stubbed here; the real `#[cfg(windows)]` impl is verified by the Windows CI job.

use crate::{Error, Result};

/// One captured desktop frame (BGRA), handed to Rewind for encoding/OCR.
pub struct ScreenFrame {
    pub width: u32,
    pub height: u32,
    pub bgra: Vec<u8>,
}

/// Identifies the current foreground app/window for proactive assistants.
#[derive(Clone, Debug)]
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
            // TODO(windows-ci): GraphicsCaptureItem + Direct3D11CaptureFramePool.
            Err(Error::Screen("WGC capture not yet implemented".into()))
        }
        #[cfg(not(windows))]
        {
            Err(Error::Unsupported)
        }
    }

    /// Current foreground window (drives WindowMonitor-style assistant triggers).
    pub fn foreground_window(&self) -> Result<ForegroundWindow> {
        #[cfg(windows)]
        {
            Err(Error::Screen("GetForegroundWindow not yet implemented".into()))
        }
        #[cfg(not(windows))]
        {
            Err(Error::Unsupported)
        }
    }
}

impl Default for ScreenCapture {
    fn default() -> Self {
        Self::new()
    }
}
