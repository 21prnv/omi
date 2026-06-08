//! Mic + system-audio mixer — replaces AudioMixer.swift.
//!
//! Combines the microphone with the system-audio (loopback) capture into a
//! single mono 16 kHz i16 stream for cloud STT. The two sources run on
//! independent device clocks, so rather than try to lock them, the output is
//! **clocked by the mic**: every mic sample is emitted, with the aligned system
//! sample mixed in (saturating add) when one is available. The system backlog is
//! bounded so a faster system clock can't accumulate unbounded latency/drift.
//!
//! Pure DSP — no OS APIs — so it is unit-tested on the dev box, and the mic-only
//! path (system absent, e.g. on macOS) is a clean passthrough.

use super::resample::{downmix_mono, Resampler};
use crate::AudioFrame;
use std::collections::VecDeque;

const TARGET_RATE: u32 = 16000;
/// Cap the system buffer at ~2s so loopback drift can't grow latency forever.
const MAX_SYSTEM_BACKLOG: usize = TARGET_RATE as usize * 2;

pub struct StreamMixer {
    mic_rs: Option<Resampler>,
    sys_rs: Option<Resampler>,
    mic_buf: VecDeque<i16>,
    sys_buf: VecDeque<i16>,
    has_system: bool,
}

impl StreamMixer {
    /// `has_system` is false when only the mic is captured (mixer is a passthrough).
    pub fn new(has_system: bool) -> Self {
        Self {
            mic_rs: None,
            sys_rs: None,
            mic_buf: VecDeque::new(),
            sys_buf: VecDeque::new(),
            has_system,
        }
    }

    /// Resamplers are created lazily on the first frame, since the device sample
    /// rate isn't known until then.
    pub fn push_mic(&mut self, frame: &AudioFrame) {
        let rs = self
            .mic_rs
            .get_or_insert_with(|| Resampler::new(frame.sample_rate, TARGET_RATE));
        self.mic_buf.extend(rs.process(&downmix_mono(frame)));
    }

    pub fn push_system(&mut self, frame: &AudioFrame) {
        if !self.has_system {
            return;
        }
        let rs = self
            .sys_rs
            .get_or_insert_with(|| Resampler::new(frame.sample_rate, TARGET_RATE));
        self.sys_buf.extend(rs.process(&downmix_mono(frame)));
        while self.sys_buf.len() > MAX_SYSTEM_BACKLOG {
            self.sys_buf.pop_front();
        }
    }

    /// Emit all currently buffered mic samples, mixing in aligned system samples
    /// (saturating) where present. Mic-only when no system source.
    pub fn drain(&mut self) -> Vec<i16> {
        let mut out = Vec::with_capacity(self.mic_buf.len());
        while let Some(m) = self.mic_buf.pop_front() {
            let sample = match self.sys_buf.pop_front() {
                Some(s) => (m as i32 + s as i32).clamp(i16::MIN as i32, i16::MAX as i32) as i16,
                None => m,
            };
            out.push(sample);
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame(samples: Vec<i16>, rate: u32, ch: u16) -> AudioFrame {
        AudioFrame { samples, sample_rate: rate, channels: ch }
    }

    // The mixer resamples each source before mixing, so expectations are computed
    // through the SAME resampler (16k->16k still carries the trailing sample).
    fn rs16(samples: &[i16]) -> Vec<i16> {
        let mut r = Resampler::new(16000, 16000);
        r.process(&samples.iter().map(|&s| s as f32).collect::<Vec<f32>>())
    }
    fn sat(a: i16, b: i16) -> i16 {
        (a as i32 + b as i32).clamp(i16::MIN as i32, i16::MAX as i32) as i16
    }

    #[test]
    fn mic_only_is_passthrough() {
        let mut m = StreamMixer::new(false);
        let mic = [10, 20, 30, 40, 50];
        m.push_mic(&frame(mic.to_vec(), 16000, 1));
        m.push_system(&frame(vec![100, 100], 16000, 1)); // ignored: has_system=false
        assert_eq!(m.drain(), rs16(&mic));
    }

    #[test]
    fn mixes_aligned_samples() {
        let mut m = StreamMixer::new(true);
        let mic = [10, 20, 30, 40, 50];
        let sys = [1, 2, 3, 4, 5];
        m.push_mic(&frame(mic.to_vec(), 16000, 1));
        m.push_system(&frame(sys.to_vec(), 16000, 1));
        let (em, es) = (rs16(&mic), rs16(&sys));
        let expected: Vec<i16> = em.iter().zip(&es).map(|(&a, &b)| sat(a, b)).collect();
        assert_eq!(m.drain(), expected);
    }

    #[test]
    fn saturates_on_overflow() {
        let mut m = StreamMixer::new(true);
        let mic = [30000, -30000, 30000];
        let sys = [30000, -30000, 30000];
        m.push_mic(&frame(mic.to_vec(), 16000, 1));
        m.push_system(&frame(sys.to_vec(), 16000, 1));
        let out = m.drain();
        assert!(out.contains(&i16::MAX) && out.contains(&i16::MIN));
    }

    #[test]
    fn mic_clocked_when_system_lags() {
        // More mic than system: leading samples mix, the rest pass through alone.
        let mut m = StreamMixer::new(true);
        let mic = [10, 20, 30, 40, 50, 60];
        let sys = [5, 5, 5];
        m.push_mic(&frame(mic.to_vec(), 16000, 1));
        m.push_system(&frame(sys.to_vec(), 16000, 1));
        let (em, es) = (rs16(&mic), rs16(&sys));
        let expected: Vec<i16> = em
            .iter()
            .enumerate()
            .map(|(i, &a)| if i < es.len() { sat(a, es[i]) } else { a })
            .collect();
        assert_eq!(m.drain(), expected);
    }

    #[test]
    fn system_backlog_is_bounded() {
        let mut m = StreamMixer::new(true);
        m.push_system(&frame(vec![1i16; MAX_SYSTEM_BACKLOG + 5000], 16000, 1));
        assert!(m.sys_buf.len() <= MAX_SYSTEM_BACKLOG);
    }
}
