//! Audio commands — bridge omi-native capture to the Omi cloud.
//!
//! Mirrors the controls AudioCaptureService/SystemAudioCaptureService exposed to
//! the Swift UI (start/stop, device list). The captured frame stream is resampled
//! and pushed to api.omi.me by `crate::cloud`; transcript segments come back as
//! the `omi://transcript` Tauri event — they are never returned over invoke().

use crate::cloud;
use crate::state::AppState;
use omi_native::audio::{AudioSource, MicCapture, SystemAudioCapture};
use tauri::{AppHandle, State};

/// Start microphone capture and stream it to the Omi cloud.
///
/// `token` is the caller's Firebase ID token (from the JS auth store); it
/// authenticates the WebSocket. `system_audio` additionally opens WASAPI loopback
/// (Windows only) — its frames are not yet mixed into the stream (see TODO).
#[tauri::command]
pub fn start_capture(
    app: AppHandle,
    state: State<AppState>,
    token: String,
    system_audio: bool,
    language: Option<String>,
) -> Result<(), String> {
    let mut handles = state.capture.lock().map_err(|e| e.to_string())?;
    if handles.stream.is_some() {
        return Ok(()); // already recording
    }

    let mut mic = MicCapture::new();
    let mic_rx = mic.start().map_err(|e| e.to_string())?;
    handles.mic = Some(mic);

    // Optionally capture system audio (WASAPI loopback) and mix it into the stream.
    let mut sys_rx = None;
    if system_audio {
        // On non-Windows this returns Unsupported; surface it but keep mic going.
        let mut sys = SystemAudioCapture::new();
        match sys.start() {
            Ok(rx) => {
                sys_rx = Some(rx);
                handles.system = Some(sys);
            }
            Err(e) => tracing::warn!("system audio unavailable: {e}"),
        }
    }

    let language = language.unwrap_or_else(|| "en".to_string());
    handles.stream = Some(cloud::start(app, mic_rx, sys_rx, token, language));
    Ok(())
}

#[tauri::command]
pub fn stop_capture(state: State<AppState>) -> Result<(), String> {
    let mut handles = state.capture.lock().map_err(|e| e.to_string())?;
    // Drop the stream first so the WS closes, then stop the devices.
    handles.stream.take();
    if let Some(mut mic) = handles.mic.take() {
        mic.stop();
    }
    if let Some(mut sys) = handles.system.take() {
        sys.stop();
    }
    Ok(())
}

#[tauri::command]
pub fn list_input_devices() -> Vec<String> {
    omi_native::audio::input_device_names()
}
