//! Rewind — rolling screen recording, OCR, on-disk index.
//!
//! Replaces Rewind/{VideoChunkEncoder,RewindOCRService,RewindStorage,RewindIndexer}.swift.
//! Windows mapping:
//!   - encode:  Media Foundation H.264 sink writer (was AVAssetWriter)
//!   - ocr:     Windows.Media.Ocr (was Vision framework)
//!   - storage: portable — same chunked layout + SQLite index, no OS APIs
//!
//! storage/index are cross-platform; encode/ocr are `#[cfg(windows)]` and CI-verified.

use crate::{Error, Result};

/// Encodes a sequence of [`crate::screen::ScreenFrame`]s into an H.264 chunk.
pub struct VideoChunkEncoder;

impl VideoChunkEncoder {
    pub fn new() -> Self {
        Self
    }

    pub fn finish_chunk(&self, _path: &str) -> Result<()> {
        #[cfg(windows)]
        {
            // TODO(windows-ci): Media Foundation IMFSinkWriter, H.264 NV12.
            Err(Error::Screen("MF encoder not yet implemented".into()))
        }
        #[cfg(not(windows))]
        {
            Err(Error::Unsupported)
        }
    }
}

impl Default for VideoChunkEncoder {
    fn default() -> Self {
        Self::new()
    }
}

/// Extracts text from a captured frame for the searchable Rewind index.
pub struct OcrService;

impl OcrService {
    pub fn new() -> Self {
        Self
    }

    pub fn recognize(&self, _frame: &crate::screen::ScreenFrame) -> Result<String> {
        #[cfg(windows)]
        {
            // TODO(windows-ci): OcrEngine::TryCreateFromUserProfileLanguages.
            Err(Error::Screen("Windows.Media.Ocr not yet implemented".into()))
        }
        #[cfg(not(windows))]
        {
            Err(Error::Unsupported)
        }
    }
}

impl Default for OcrService {
    fn default() -> Self {
        Self::new()
    }
}
