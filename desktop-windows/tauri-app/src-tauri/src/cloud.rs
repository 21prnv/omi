//! Cloud audio streaming — pushes captured audio to the existing Omi backend and
//! relays transcript segments back to the UI.
//!
//! Protocol (verified against backend/routers/transcribe.py):
//!   URL:   wss://api.omi.me/v4/web/listen?codec=pcm16&sample_rate=16000&channels=1&language=<lang>
//!   auth:  first message {"type":"auth","token":"<firebase id token>"}
//!          server replies {"type":"auth_response","success":true}
//!   send:  raw little-endian mono PCM16 as binary frames
//!   recv:  JSON array of TranscriptSegment (live transcript), or {"type":...} events
//!
//! Captured frames are resampled to mono 16 kHz here so audio never crosses the
//! JS bridge. Transcript segments are emitted as the Tauri event `omi://transcript`.

use crossbeam_channel::Receiver;
use futures_util::{SinkExt, StreamExt};
use omi_native::audio::{to_pcm16_le, StreamMixer};
use omi_native::AudioFrame;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;

const TARGET_SAMPLE_RATE: u32 = 16000;
pub const TRANSCRIPT_EVENT: &str = "omi://transcript";
pub const STATUS_EVENT: &str = "omi://stream-status";

/// Handle to a running stream; dropping or calling `stop()` tears it down.
pub struct StreamHandle {
    stop: Arc<AtomicBool>,
}

impl StreamHandle {
    pub fn stop(&self) {
        self.stop.store(true, Ordering::SeqCst);
    }
}

impl Drop for StreamHandle {
    fn drop(&mut self) {
        self.stop();
    }
}

/// Start streaming captured audio to the Omi cloud. `mic_rx` is required; when
/// `sys_rx` is present (Windows WASAPI loopback) it is mixed in. Returns
/// immediately; the WebSocket runs on the Tauri async runtime and the
/// resample+mix on a dedicated thread.
pub fn start(
    app: AppHandle,
    mic_rx: Receiver<AudioFrame>,
    sys_rx: Option<Receiver<AudioFrame>>,
    token: String,
    language: String,
) -> StreamHandle {
    let stop = Arc::new(AtomicBool::new(false));

    // Mixer thread: mic (+ optional system) frames → mono 16k PCM16 → async channel.
    let (byte_tx, byte_rx) = mpsc::unbounded_channel::<Vec<u8>>();
    {
        let stop = stop.clone();
        std::thread::Builder::new()
            .name("omi-mixer".into())
            .spawn(move || {
                let mut mixer = StreamMixer::new(sys_rx.is_some());
                while !stop.load(Ordering::SeqCst) {
                    // Mic clocks the stream: block briefly for the next mic frame.
                    match mic_rx.recv_timeout(std::time::Duration::from_millis(100)) {
                        Ok(f) => mixer.push_mic(&f),
                        Err(crossbeam_channel::RecvTimeoutError::Timeout) => {}
                        Err(_) => break, // mic stopped → source dropped
                    }
                    // Drain whatever system audio is available without blocking.
                    if let Some(rx) = &sys_rx {
                        while let Ok(f) = rx.try_recv() {
                            mixer.push_system(&f);
                        }
                    }
                    let mixed = mixer.drain();
                    if !mixed.is_empty() && byte_tx.send(to_pcm16_le(&mixed)).is_err() {
                        break; // WS task gone
                    }
                }
            })
            .expect("spawn mixer thread");
    }

    // WebSocket task.
    {
        let stop = stop.clone();
        tauri::async_runtime::spawn(async move {
            if let Err(e) = run_ws(app.clone(), byte_rx, token, language, stop).await {
                tracing::error!("cloud stream ended: {e}");
                let _ = app.emit(STATUS_EVENT, format!("error: {e}"));
            }
        });
    }

    StreamHandle { stop }
}

fn ws_url(language: &str) -> String {
    let base = std::env::var("OMI_API_BASE_URL").unwrap_or_else(|_| "https://api.omi.me".into());
    let ws_base = base.replacen("https://", "wss://", 1).replacen("http://", "ws://", 1);
    format!(
        "{ws_base}/v4/web/listen?codec=pcm16&sample_rate={TARGET_SAMPLE_RATE}&channels=1&language={language}"
    )
}

async fn run_ws(
    app: AppHandle,
    mut byte_rx: mpsc::UnboundedReceiver<Vec<u8>>,
    token: String,
    language: String,
    stop: Arc<AtomicBool>,
) -> Result<(), String> {
    let (ws, _) = tokio_tungstenite::connect_async(ws_url(&language))
        .await
        .map_err(|e| format!("connect: {e}"))?;
    let (mut write, mut read) = ws.split();

    // First-message auth handshake.
    let auth = serde_json::json!({ "type": "auth", "token": token }).to_string();
    write.send(Message::Text(auth)).await.map_err(|e| e.to_string())?;
    match read.next().await {
        Some(Ok(Message::Text(t))) => {
            let v: serde_json::Value = serde_json::from_str(&t).map_err(|e| e.to_string())?;
            if v.get("success") != Some(&serde_json::Value::Bool(true)) {
                return Err("auth rejected".into());
            }
        }
        other => return Err(format!("unexpected auth reply: {other:?}")),
    }
    let _ = app.emit(STATUS_EVENT, "connected");

    // Pump audio out and transcripts in until stop or socket close.
    loop {
        if stop.load(Ordering::SeqCst) {
            break;
        }
        tokio::select! {
            chunk = byte_rx.recv() => match chunk {
                Some(bytes) => write.send(Message::Binary(bytes)).await.map_err(|e| e.to_string())?,
                None => break, // resampler thread ended
            },
            incoming = read.next() => match incoming {
                Some(Ok(Message::Text(t))) => emit_transcript(&app, &t),
                Some(Ok(Message::Close(_))) | None => break,
                Some(Ok(_)) => {} // ping/pong/binary — ignore
                Some(Err(e)) => return Err(format!("read: {e}")),
            }
        }
    }

    let _ = write.send(Message::Close(None)).await;
    let _ = app.emit(STATUS_EVENT, "disconnected");
    Ok(())
}

/// Forward a server message to the UI. Transcript payloads are JSON arrays of
/// segments; typed `{"type":...}` events are passed through untouched.
fn emit_transcript(app: &AppHandle, text: &str) {
    match serde_json::from_str::<serde_json::Value>(text) {
        Ok(v) if v.is_array() => {
            let _ = app.emit(TRANSCRIPT_EVENT, v);
        }
        Ok(v) => {
            let _ = app.emit(STATUS_EVENT, v);
        }
        Err(_) => {} // "ping" and other non-JSON keepalives
    }
}
