//! Shared app state — replaces AppState.swift.
//!
//! Holds the live native-capture handles and the cloud stream. App data
//! (conversations, memories, chat) lives in the Omi cloud and is fetched by the
//! React UI directly — none of it is cached here.

use crate::cloud::StreamHandle;
use omi_native::audio::{MicCapture, SystemAudioCapture};
use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub capture: Mutex<CaptureHandles>,
}

#[derive(Default)]
pub struct CaptureHandles {
    pub mic: Option<MicCapture>,
    pub system: Option<SystemAudioCapture>,
    /// Live WebSocket stream to the Omi cloud; dropping it tears the stream down.
    pub stream: Option<StreamHandle>,
}
