//! Settings commands.
//!
//! Exposes the Omi cloud API base URL to the UI. Defaults to production
//! (api.omi.me) and can be overridden via OMI_API_BASE_URL for dev/staging,
//! mirroring how the macOS app pointed at different backends.

#[tauri::command]
pub fn get_api_base_url() -> String {
    std::env::var("OMI_API_BASE_URL").unwrap_or_else(|_| "https://api.omi.me".to_string())
}

/// Open a URL in the system default browser (for app store links, OAuth, exports).
#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    open::that(url).map_err(|e| e.to_string())
}