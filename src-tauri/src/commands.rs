use crate::ytdlp::{self, DownloadOptions, UrlKind};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};
use tokio::sync::Semaphore;

// Swappable semaphore — replaced live by set_concurrency
pub struct DlSem(pub Mutex<Arc<Semaphore>>);

impl DlSem {
    pub fn new(cap: usize) -> Self {
        DlSem(Mutex::new(Arc::new(Semaphore::new(cap))))
    }
    fn get(&self) -> Arc<Semaphore> {
        self.0.lock().unwrap().clone()
    }
}

fn ffmpeg_path(app: &tauri::AppHandle) -> Result<String, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let cached = data_dir.join("ffmpeg.exe");
    if cached.exists() {
        return Ok(cached.to_string_lossy().into_owned());
    }
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
pub async fn set_concurrency(
    app: tauri::AppHandle,
    cap: usize,
) -> Result<(), String> {
    let state = app.state::<DlSem>();
    let new_sem = Arc::new(Semaphore::new(cap.max(1).min(8)));
    *state.0.lock().map_err(|e| e.to_string())? = new_sem;
    Ok(())
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
    opts: DownloadOptions,
) -> Result<(), String> {
    let ffmpeg = ffmpeg_path(&app)?;
    let sem = app.state::<DlSem>().get();
    let _permit = sem.acquire_owned().await.map_err(|e| e.to_string())?;
    ytdlp::download_track(&app, &url, &format, &output_dir, &ffmpeg, &event_id, &opts).await
}

#[tauri::command]
pub async fn update_ytdlp(app: tauri::AppHandle) {
    ytdlp::update_ytdlp(&app).await;
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

    let url = "https://github.com/GyanD/codexffmpeg/releases/download/7.1.1/ffmpeg-7.1.1-essentials_build.zip";
    const EXPECTED_SHA256: &str =
        "04861d3339c5ebe38b56c19a15cf2c0cc97f5de4fa8910e4d47e5e6404e4a2d4";

    let _ = app.emit("setup-progress", serde_json::json!({ "status": "downloading" }));

    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("Failed to download ffmpeg: {e}"))?;
    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read ffmpeg download: {e}"))?;

    let actual = hex::encode(Sha256::digest(&bytes));
    if actual != EXPECTED_SHA256 {
        return Err(format!(
            "ffmpeg download integrity check failed (got {actual}). Aborting."
        ));
    }

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
