//! Settings commands.
//!
//! Exposes the Omi cloud API base URL to the UI. Defaults to production
//! (api.omi.me) and can be overridden via OMI_API_BASE_URL for dev/staging,
//! mirroring how the macOS app pointed at different backends.

#[tauri::command]
pub fn get_api_base_url() -> String {
    std::env::var("OMI_API_BASE_URL").unwrap_or_else(|_| "https://api.omi.me".to_string())
}