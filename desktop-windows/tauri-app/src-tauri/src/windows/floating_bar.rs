//! Floating control bar — replaces FloatingControlBar/* and PushToTalkManager.swift.
//!
//! A frameless, always-on-top, transparent WebView window toggled by a global
//! hotkey (default Ctrl+Shift+Space). The window itself is declared in
//! tauri.conf.json (label "floating_bar"); this just wires the shortcut to
//! show/hide it, the way the Swift PushToTalkManager bound a global hotkey.

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn register_shortcut(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let toggle = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

    app.global_shortcut().on_shortcut(toggle, move |app, _shortcut, event| {
        if event.state() != ShortcutState::Pressed {
            return;
        }
        if let Some(bar) = app.get_webview_window("floating_bar") {
            match bar.is_visible() {
                Ok(true) => {
                    let _ = bar.hide();
                }
                _ => {
                    let _ = bar.show();
                    let _ = bar.set_focus();
                }
            }
        }
    })?;
    Ok(())
}
