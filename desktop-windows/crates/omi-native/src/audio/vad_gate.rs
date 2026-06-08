//! Voice-activity gate — replaces VADGateService.swift.
//!
//! Pure-Rust (webrtc-vad), fully cross-platform and verifiable on the dev box.
//! Gates frames so only speech is forwarded to transcription, matching the Swift
//! behaviour of suppressing silence before it hits the STT pipeline.

use crate::AudioFrame;
use webrtc_vad::{SampleRate, Vad, VadMode};

pub struct VadGate {
    vad: Vad,
}

impl VadGate {
    /// `aggressiveness` 0..=3 maps to webrtc VAD modes (Quality..VeryAggressive),
    /// same knob the Swift gate exposed.
    pub fn new(sample_rate: u32, aggressiveness: u8) -> Self {
        let sr = match sample_rate {
            8000 => SampleRate::Rate8kHz,
            16000 => SampleRate::Rate16kHz,
            32000 => SampleRate::Rate32kHz,
            _ => SampleRate::Rate48kHz,
        };
        let mode = match aggressiveness {
            0 => VadMode::Quality,
            1 => VadMode::LowBitrate,
            2 => VadMode::Aggressive,
            _ => VadMode::VeryAggressive,
        };
        Self { vad: Vad::new_with_rate_and_mode(sr, mode) }
    }

    /// Returns true when the frame contains voice. webrtc-vad needs mono i16 in
    /// 10/20/30ms windows; callers downmix and chunk before calling.
    pub fn is_voice(&mut self, frame: &AudioFrame) -> bool {
        self.vad.is_voice_segment(&frame.samples).unwrap_or(false)
    }
}
