use crate::ytdlp::{self, UrlKind};
use std::path::PathBuf;
use tauri::{Emitter, Manager};

fn ffmpeg_path(app: &tauri::AppHandle) -> Result<String, String> {
    // Check app data dir first (download-on-first-run cache)
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let cached = data_dir.join("ffmpeg.exe");
    if cached.exists() {
        return Ok(cached.to_string_lossy().into_owned());
    }
    // Dev fallback: check binaries/ next to the exe
    let dev_path: PathBuf = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join("binaries").join("ffmpeg.exe")))
        .unwrap_or_default();
    if dev_path.exists() {
        return Ok(dev_path.to_string_lossy().into_owned());
    }
    Err("ffmpeg not found. Please let the app finish setting up first.".into())
}

#[tauri::command]
pub async fn fetch_metadata(app: tauri::AppHandle, url: String) -> Result<UrlKind, String> {
    ytdlp::detect_and_fetch(&app, &url).await
}

#[tauri::command]
pub async fn start_download(
    app: tauri::AppHandle,
    url: String,
    format: String,
    output_dir: String,
    event_id: String,
) -> Result<(), String> {
    let ffmpeg = ffmpeg_path(&app)?;
    ytdlp::download_track(&app, &url, &format, &output_dir, &ffmpeg, &event_id).await
}

#[tauri::command]
pub async fn check_ffmpeg(app: tauri::AppHandle) -> bool {
    ffmpeg_path(&app).is_ok()
}

#[tauri::command]
pub async fn setup_ffmpeg(app: tauri::AppHandle) -> Result<(), String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;

    let dest = data_dir.join("ffmpeg.exe");
    if dest.exists() {
        return Ok(());
    }

    // gyan.dev LGPL essentials build (small, ~10MB zip, extract ffmpeg.exe)
    // ponytail: direct exe download from a trusted mirror avoids zip extraction in Rust
    let url = "https://github.com/GyanD/codexffmpeg/releases/download/7.1.1/ffmpeg-7.1.1-essentials_build.zip";
    let _ = app.emit("setup-progress", serde_json::json!({ "status": "downloading" }));

    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("Failed to download ffmpeg: {e}"))?;
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read ffmpeg download: {e}"))?;

    // Extract ffmpeg.exe from the zip
    let cursor = std::io::Cursor::new(bytes);
    let mut zip = zip::ZipArchive::new(cursor).map_err(|e| format!("Bad zip: {e}"))?;
    for i in 0..zip.len() {
        let mut file = zip.by_index(i).map_err(|e| e.to_string())?;
        if file.name().ends_with("ffmpeg.exe") {
            let mut out = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut out).map_err(|e| e.to_string())?;
            let _ = app.emit("setup-progress", serde_json::json!({ "status": "done" }));
            return Ok(());
        }
    }

    Err("ffmpeg.exe not found inside the downloaded archive.".into())
}
