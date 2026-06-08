//! Audio capture — mic + system (loopback) — and mixing.
//!
//! Replaces: AudioCaptureService.swift, SystemAudioCaptureService.swift, AudioMixer.swift.

mod mic;
mod system_audio;
pub mod resample;
pub mod vad_gate;

pub use mic::MicCapture;
pub use resample::{downmix_mono, to_pcm16_le, Resampler};
pub use system_audio::SystemAudioCapture;

use crate::{AudioFrame, Result};
use crossbeam_channel::Receiver;

/// Names of available input (microphone) devices, for a device picker UI.
pub fn input_device_names() -> Vec<String> {
    use cpal::traits::{DeviceTrait, HostTrait};
    let host = cpal::default_host();
    match host.input_devices() {
        Ok(devices) => devices.filter_map(|d| d.name().ok()).collect(),
        Err(_) => Vec::new(),
    }
}

/// A live audio source that streams [`AudioFrame`]s until dropped.
///
/// Both the microphone (cpal, cross-platform) and the system-audio loopback
/// (WASAPI, Windows-only) implement this, so the mixer and transcription
/// pipeline are written once against the trait.
pub trait AudioSource: Send {
    /// Begin capture and return a receiver of decoded PCM frames.
    fn start(&mut self) -> Result<Receiver<AudioFrame>>;
    /// Stop capture and release the device.
    fn stop(&mut self);
}
