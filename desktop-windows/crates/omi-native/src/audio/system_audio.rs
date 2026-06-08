//! System-audio (loopback) capture — the highest-value Windows-specific piece.
//!
//! Replaces SystemAudioCaptureService.swift. On macOS this used a virtual audio
//! device / ScreenCaptureKit audio; on Windows the native equivalent is WASAPI
//! loopback on the default render endpoint (AUDCLNT_STREAMFLAGS_LOOPBACK).
//!
//! The crate must build on the macOS dev box, so the real implementation is
//! `#[cfg(windows)]` and a stub returns `Error::Unsupported` elsewhere.

use super::AudioSource;
use crate::{AudioFrame, Result};
use crossbeam_channel::Receiver;

pub struct SystemAudioCapture {
    #[cfg(windows)]
    inner: imp::Inner,
}

impl Default for SystemAudioCapture {
    fn default() -> Self {
        Self::new()
    }
}

impl SystemAudioCapture {
    pub fn new() -> Self {
        Self {
            #[cfg(windows)]
            inner: imp::Inner::new(),
        }
    }
}

impl AudioSource for SystemAudioCapture {
    fn start(&mut self) -> Result<Receiver<AudioFrame>> {
        #[cfg(windows)]
        {
            self.inner.start()
        }
        #[cfg(not(windows))]
        {
            Err(crate::Error::Unsupported)
        }
    }

    fn stop(&mut self) {
        #[cfg(windows)]
        self.inner.stop();
    }
}

// ── Windows WASAPI loopback ──────────────────────────────────────────────────
// NOTE: This block compiles only on Windows and is verified by the windows-latest
// CI job (see .github/workflows/windows.yml), NOT on the macOS dev machine.
#[cfg(windows)]
mod imp {
    use crate::{AudioFrame, Error, Result};
    use crossbeam_channel::{bounded, Receiver, Sender};
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Arc;
    use windows::Win32::Media::Audio::{
        eConsole, eRender, IAudioCaptureClient, IAudioClient, IMMDeviceEnumerator,
        MMDeviceEnumerator, AUDCLNT_BUFFERFLAGS_SILENT, AUDCLNT_SHAREMODE_SHARED,
        AUDCLNT_STREAMFLAGS_LOOPBACK,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED,
    };

    pub struct Inner {
        running: Arc<AtomicBool>,
    }

    impl Inner {
        pub fn new() -> Self {
            Self { running: Arc::new(AtomicBool::new(false)) }
        }

        /// Open the default render endpoint in loopback mode and stream frames
        /// off a dedicated thread. The capture loop converts the device's native
        /// float mix format to i16 PCM before sending.
        pub fn start(&mut self) -> Result<Receiver<AudioFrame>> {
            let (tx, rx): (Sender<AudioFrame>, Receiver<AudioFrame>) = bounded(64);
            let running = self.running.clone();
            running.store(true, Ordering::SeqCst);

            std::thread::spawn(move || {
                if let Err(e) = capture_loop(tx, running) {
                    tracing::error!("WASAPI loopback failed: {e}");
                }
            });
            Ok(rx)
        }

        pub fn stop(&mut self) {
            self.running.store(false, Ordering::SeqCst);
        }
    }

    fn capture_loop(tx: Sender<AudioFrame>, running: Arc<AtomicBool>) -> Result<()> {
        unsafe {
            CoInitializeEx(None, COINIT_MULTITHREADED).ok().map_err(os)?;

            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).map_err(os)?;
            // Loopback captures what is *played* to the default render device.
            let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole).map_err(os)?;
            let client: IAudioClient = device.Activate(CLSCTX_ALL, None).map_err(os)?;

            let mix_format = client.GetMixFormat().map_err(os)?;
            let sample_rate = (*mix_format).nSamplesPerSec;
            let channels = (*mix_format).nChannels;

            client
                .Initialize(
                    AUDCLNT_SHAREMODE_SHARED,
                    AUDCLNT_STREAMFLAGS_LOOPBACK,
                    0,
                    0,
                    mix_format,
                    None,
                )
                .map_err(os)?;

            let capture: IAudioCaptureClient = client.GetService().map_err(os)?;
            client.Start().map_err(os)?;

            while running.load(Ordering::SeqCst) {
                let mut packet_len = capture.GetNextPacketSize().map_err(os)?;
                while packet_len != 0 {
                    let mut data_ptr = std::ptr::null_mut();
                    let mut num_frames = 0u32;
                    let mut flags = 0u32;
                    capture
                        .GetBuffer(&mut data_ptr, &mut num_frames, &mut flags, None, None)
                        .map_err(os)?;

                    let silent = flags & AUDCLNT_BUFFERFLAGS_SILENT.0 as u32 != 0;
                    if !silent && num_frames > 0 {
                        let float_count = num_frames as usize * channels as usize;
                        let floats = std::slice::from_raw_parts(data_ptr as *const f32, float_count);
                        let samples =
                            floats.iter().map(|&s| (s * i16::MAX as f32) as i16).collect();
                        let _ = tx.try_send(AudioFrame { samples, sample_rate, channels });
                    }

                    capture.ReleaseBuffer(num_frames).map_err(os)?;
                    packet_len = capture.GetNextPacketSize().map_err(os)?;
                }
                std::thread::sleep(std::time::Duration::from_millis(5));
            }

            client.Stop().map_err(os)?;
        }
        Ok(())
    }

    fn os(e: windows::core::Error) -> Error {
        Error::Audio(format!("WASAPI: {e}"))
    }
}
