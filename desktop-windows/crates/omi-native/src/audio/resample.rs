//! Audio preparation for cloud STT: downmix to mono + resample to a target rate.
//!
//! The Omi `/v4/web/listen` endpoint wants mono 16 kHz PCM16. Capture devices
//! deliver arbitrary rates (often 44.1/48 kHz) and channel counts, so each frame
//! is downmixed and resampled before it is sent. Pure DSP — no OS APIs — so it is
//! fully unit-tested on the dev box.

use crate::AudioFrame;

/// Average interleaved channels down to a single mono track (f32, i16-ranged).
pub fn downmix_mono(frame: &AudioFrame) -> Vec<f32> {
    let ch = frame.channels.max(1) as usize;
    if ch == 1 {
        return frame.samples.iter().map(|&s| s as f32).collect();
    }
    frame
        .samples
        .chunks(ch)
        .map(|c| c.iter().map(|&s| s as f32).sum::<f32>() / ch as f32)
        .collect()
}

/// Stateful linear resampler. Carries fractional phase + unconsumed samples
/// across calls so back-to-back capture buffers resample without clicks at the
/// seams.
pub struct Resampler {
    step: f64, // input samples advanced per output sample (in_rate / out_rate)
    pos: f64,  // fractional read position within `pending`
    pending: Vec<f32>,
}

impl Resampler {
    pub fn new(in_rate: u32, out_rate: u32) -> Self {
        Self {
            step: in_rate as f64 / out_rate as f64,
            pos: 0.0,
            pending: Vec::new(),
        }
    }

    /// Feed mono samples; returns resampled i16 mono samples produced so far.
    pub fn process(&mut self, mono: &[f32]) -> Vec<i16> {
        self.pending.extend_from_slice(mono);
        let mut out = Vec::new();

        // Emit while we have a sample on each side of `pos` to interpolate.
        while self.pos + 1.0 < self.pending.len() as f64 {
            let i = self.pos.floor() as usize;
            let frac = (self.pos - i as f64) as f32;
            let s = self.pending[i] + (self.pending[i + 1] - self.pending[i]) * frac;
            out.push(s.round().clamp(i16::MIN as f32, i16::MAX as f32) as i16);
            self.pos += self.step;
        }

        // Drop the integer part we've consumed; keep the remainder. When
        // decimating, `pos` can advance past the buffer end, so clamp the drain
        // and subtract exactly what we removed (subtracting the unclamped value
        // would desync `pos` from `pending` by a sample).
        let drained = (self.pos.floor() as usize).min(self.pending.len());
        if drained > 0 {
            self.pending.drain(..drained);
            self.pos -= drained as f64;
        }
        out
    }
}

/// Convert i16 mono samples to little-endian PCM16 bytes (what the cloud expects).
pub fn to_pcm16_le(samples: &[i16]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(samples.len() * 2);
    for &s in samples {
        bytes.extend_from_slice(&s.to_le_bytes());
    }
    bytes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn downmix_averages_stereo() {
        let f = AudioFrame { samples: vec![100, 200, 0, 0], sample_rate: 48000, channels: 2 };
        assert_eq!(downmix_mono(&f), vec![150.0, 0.0]);
    }

    #[test]
    fn resample_48k_to_16k_thirds_the_samples() {
        // 48k -> 16k is a 3:1 decimation; ~300 in → ~100 out (±1 for phase).
        let mut r = Resampler::new(48000, 16000);
        let input: Vec<f32> = (0..300).map(|i| (i % 50) as f32).collect();
        let out = r.process(&input);
        assert!((out.len() as i32 - 100).abs() <= 1, "got {}", out.len());
    }

    #[test]
    fn resample_is_continuous_across_chunks() {
        // Splitting the input must not change the output count vs one big call.
        let mut whole = Resampler::new(44100, 16000);
        let mut split = Resampler::new(44100, 16000);
        let input: Vec<f32> = (0..441).map(|i| i as f32).collect();
        let a = whole.process(&input);
        let mut b = split.process(&input[..200]);
        b.extend(split.process(&input[200..]));
        assert_eq!(a.len(), b.len());
    }
}
