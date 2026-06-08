//! Microphone capture via cpal.
//!
//! Replaces AudioCaptureService.swift. cpal is cross-platform (CoreAudio on the
//! macOS dev box, WASAPI on Windows), so this path is fully verifiable locally —
//! only the *loopback* side (system_audio.rs) is Windows-specific.
//!
//! cpal's `Stream` is `!Send` on every platform, so it cannot live in Tauri's
//! shared (Send + Sync) state. We instead own the stream on a dedicated thread
//! and keep only a `Send` stop-signal in the handle — the standard cpal pattern.

use super::AudioSource;
use crate::{AudioFrame, Error, Result};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use crossbeam_channel::{bounded, Receiver, Sender};

pub struct MicCapture {
    /// Dropping/sending stops the capture thread (which then drops the stream).
    stop_tx: Option<Sender<()>>,
}

impl Default for MicCapture {
    fn default() -> Self {
        Self::new()
    }
}

impl MicCapture {
    pub fn new() -> Self {
        Self { stop_tx: None }
    }
}

impl AudioSource for MicCapture {
    fn start(&mut self) -> Result<Receiver<AudioFrame>> {
        let (frame_tx, frame_rx) = bounded::<AudioFrame>(64);
        let (stop_tx, stop_rx) = bounded::<()>(1);
        // The stream build can fail; report the result back before we block.
        let (init_tx, init_rx) = bounded::<Result<()>>(1);

        std::thread::Builder::new()
            .name("omi-mic-capture".into())
            .spawn(move || match build_stream(frame_tx) {
                Ok(stream) => {
                    if stream.play().is_err() {
                        let _ = init_tx.send(Err(Error::Audio("failed to start stream".into())));
                        return;
                    }
                    let _ = init_tx.send(Ok(()));
                    // Keep the (!Send) stream alive on this thread until stop.
                    let _ = stop_rx.recv();
                    drop(stream);
                }
                Err(e) => {
                    let _ = init_tx.send(Err(e));
                }
            })
            .map_err(|e| Error::Audio(e.to_string()))?;

        // Propagate any device/format error from the capture thread.
        init_rx
            .recv()
            .map_err(|e| Error::Audio(e.to_string()))??;

        self.stop_tx = Some(stop_tx);
        Ok(frame_rx)
    }

    fn stop(&mut self) {
        if let Some(tx) = self.stop_tx.take() {
            let _ = tx.send(());
        }
    }
}

/// Build a cpal input stream that emits i16 PCM frames. Runs on the capture thread.
fn build_stream(frame_tx: Sender<AudioFrame>) -> Result<cpal::Stream> {
    let host = cpal::default_host();
    let device = host.default_input_device().ok_or(Error::NoDevice)?;
    let config = device
        .default_input_config()
        .map_err(|e| Error::Audio(e.to_string()))?;

    let sample_rate = config.sample_rate().0;
    let channels = config.channels();
    let sample_format = config.sample_format();
    let stream_config: cpal::StreamConfig = config.into();
    let err_fn = |e| tracing::error!("mic stream error: {e}");

    let stream = match sample_format {
        cpal::SampleFormat::F32 => device.build_input_stream(
            &stream_config,
            move |data: &[f32], _| {
                let samples = data.iter().map(|&s| (s * i16::MAX as f32) as i16).collect();
                let _ = frame_tx.try_send(AudioFrame { samples, sample_rate, channels });
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::I16 => device.build_input_stream(
            &stream_config,
            move |data: &[i16], _| {
                let _ = frame_tx.try_send(AudioFrame {
                    samples: data.to_vec(),
                    sample_rate,
                    channels,
                });
            },
            err_fn,
            None,
        ),
        other => return Err(Error::Audio(format!("unsupported sample format: {other:?}"))),
    }
    .map_err(|e| Error::Audio(e.to_string()))?;

    Ok(stream)
}
