//! Tauri commands — the JS ↔ Rust bridge (the boundary the SwiftUI views used to
//! call directly). Each submodule mirrors a slice of the old Swift services.
//! Note: there is no `sidecar` module — the UI talks to the Omi cloud directly.

pub mod audio;
pub mod settings;
