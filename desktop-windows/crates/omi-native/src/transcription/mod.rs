//! On-device transcription — replaces LocalTranscriptionService.swift.
//!
//! The macOS app used a local whisper model for offline/private transcription.
//! The portable choice on Windows is whisper.cpp via FFI (whisper-rs), which
//! compiles cross-platform — so this can be brought up on the dev box and only
//! GPU acceleration (DirectML/Vulkan) is Windows-tuned later.
//!
//! Left as an interface stub now; wired once the audio path lands end-to-end.

use crate::{AudioFrame, Result};

pub struct LocalTranscriber;

impl LocalTranscriber {
    pub fn new(_model_path: &str) -> Result<Self> {
        Ok(Self)
    }

    /// Transcribe a buffered window of mono 16kHz audio.
    pub fn transcribe(&self, _frames: &[AudioFrame]) -> Result<String> {
        // TODO: whisper-rs full(). Cloud STT via omi-core is the default path;
        // this is the offline fallback the Swift app offered.
        Ok(String::new())
    }
}
