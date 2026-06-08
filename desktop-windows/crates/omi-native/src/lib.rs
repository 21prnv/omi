//! omi-native — Windows-native OS integrations for the Omi desktop app.
//!
//! This crate replaces the macOS Swift layer (`desktop/Desktop/Sources/*Service.swift`).
//! Everything the Rust backend (`omi-core`) already does is reused unchanged; this crate
//! only owns the OS-level capabilities that were AppKit / AVFoundation / ScreenCaptureKit:
//!
//!   audio/        ← AudioCaptureService.swift, SystemAudioCaptureService.swift, AudioMixer.swift
//!   screen/       ← ScreenCaptureService.swift, ProactiveAssistants/WindowMonitor.swift
//!   rewind/       ← Rewind/{VideoChunkEncoder,RewindOCRService,RewindStorage,RewindIndexer}.swift
//!   transcription ← LocalTranscriptionService.swift
//!   platform/     ← windows-rs glue (WASAPI, WGC, Media Foundation, OCR)
//!
//! Design rule: cross-platform abstractions (traits + types) and the cpal mic path
//! compile on every OS so they can be verified on the macOS dev box. Genuinely
//! Windows-only code lives behind `#[cfg(windows)]` with a non-Windows stub that
//! returns `Error::Unsupported`, so the crate always builds everywhere.

pub mod audio;
pub mod screen;
pub mod rewind;
pub mod transcription;
pub mod platform;

use thiserror::Error;

/// A 16-bit PCM audio frame plus its format, the unit every capture source emits
/// and the transcription pipeline consumes (mirrors the Swift `AudioFrame`).
#[derive(Clone)]
pub struct AudioFrame {
    pub samples: Vec<i16>,
    pub sample_rate: u32,
    pub channels: u16,
}

#[derive(Debug, Error)]
pub enum Error {
    #[error("operation not supported on this platform")]
    Unsupported,
    #[error("no audio device available")]
    NoDevice,
    #[error("audio backend error: {0}")]
    Audio(String),
    #[error("screen capture error: {0}")]
    Screen(String),
    #[error("os error: {0}")]
    Os(String),
}

pub type Result<T> = std::result::Result<T, Error>;
