// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;

/// A simple command the frontend can invoke to confirm it is running natively
/// (used by the platform bridge to distinguish desktop from web).
#[tauri::command]
fn platform_info() -> serde_json::Value {
    serde_json::json!({
        "desktop": true,
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "version": env!("CARGO_PKG_VERSION"),
    })
}

fn main() {
    tauri::Builder::default()
        // The global-shortcut plugin lets the frontend register OS-level
        // hotkeys that fire even when the window is unfocused. Registration and
        // callbacks are driven from TypeScript (see src/platform/globalHotkeys.ts).
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![platform_info])
        .setup(|app| {
            // Emit a ready event so the UI can enable desktop-only affordances.
            let _ = app.handle().emit("desktop-ready", ());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Soundboard desktop app");
}
