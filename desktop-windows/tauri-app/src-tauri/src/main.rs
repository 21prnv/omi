// Omi desktop for Windows — Tauri shell (thin client).
//
// Replaces OmiApp.swift (app entry / lifecycle). There is NO local backend: the
// web UI calls the existing Omi cloud APIs (api.omi.me) directly. This process
// only owns:
//   1. Native OS integrations via `omi-native` (WASAPI audio, WGC screen, rewind).
//   2. The tray, global-shortcut floating bar, and notifications.
//   3. Hosting the React UI in WebView2 and bridging it through `commands`.
#![cfg_attr(all(not(debug_assertions), windows), windows_subsystem = "windows")]

mod cloud;
mod commands;
mod oauth;
mod state;
mod windows;

use state::AppState;

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "omi_desktop_windows=info".into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(AppState::default())
        .setup(|app| {
            windows::tray::setup(app)?;
            windows::floating_bar::register_shortcut(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::audio::start_capture,
            commands::audio::stop_capture,
            commands::audio::list_input_devices,
            commands::settings::get_api_base_url,
            oauth::google_oauth_listen,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Omi desktop");
}
