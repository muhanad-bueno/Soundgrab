mod commands;
mod ytdlp;

use commands::DlSem;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(DlSem::new(3))
        .invoke_handler(tauri::generate_handler![
            commands::fetch_metadata,
            commands::start_download,
            commands::check_ffmpeg,
            commands::setup_ffmpeg,
            commands::update_ytdlp,
            commands::set_concurrency,
            commands::check_for_update,
            commands::get_store_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
