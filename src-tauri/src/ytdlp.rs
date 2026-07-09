use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrackMeta {
    pub id: String,
    pub title: String,
    pub uploader: String,
    pub duration: Option<u32>,
    pub thumbnail: Option<String>,
    pub url: Option<String>,
    pub webpage_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type", content = "data")]
pub enum UrlKind {
    Single(TrackMeta),
    Playlist(Vec<TrackMeta>),
    Invalid,
}

fn map_error(stderr: &str) -> String {
    if stderr.contains("Private video") || stderr.contains("This video is private") {
        "This track is private. Try a different link.".into()
    } else if stderr.contains("This video is unavailable") || stderr.contains("Video unavailable") {
        "This track is unavailable or was removed.".into()
    } else if stderr.contains("Sign in to confirm your age") || stderr.contains("age-restricted") {
        "This track is age-restricted and can't be downloaded.".into()
    } else if stderr.contains("This video does not exist") || stderr.contains("404") {
        "This link doesn't point to a valid track.".into()
    } else {
        "Couldn't download this — the link may be invalid or the content unavailable.".into()
    }
}

fn parse_track(json: &str) -> Option<TrackMeta> {
    let v: serde_json::Value = serde_json::from_str(json).ok()?;
    Some(TrackMeta {
        id: v["id"].as_str().unwrap_or("").to_string(),
        title: v["title"].as_str().unwrap_or("Unknown").to_string(),
        uploader: v["uploader"]
            .as_str()
            .or_else(|| v["channel"].as_str())
            .or_else(|| v["artist"].as_str())
            .unwrap_or("Unknown")
            .to_string(),
        duration: v["duration"].as_f64().map(|d| d as u32),
        thumbnail: v["thumbnail"].as_str().map(|s| s.to_string()),
        url: v["url"].as_str().map(|s| s.to_string()),
        webpage_url: v["webpage_url"]
            .as_str()
            .or_else(|| v["original_url"].as_str())
            .map(|s| s.to_string()),
    })
}

fn validate_url(url: &str) -> Result<(), String> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err("Only http:// and https:// URLs are supported.".into());
    }
    Ok(())
}

pub async fn detect_and_fetch(app: &tauri::AppHandle, url: &str) -> Result<UrlKind, String> {
    validate_url(url)?;
    let output = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| e.to_string())?
        .args(["--flat-playlist", "--dump-json", "--no-warnings", "--", url])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(map_error(&stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let tracks: Vec<TrackMeta> = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(parse_track)
        .collect();

    match tracks.len() {
        0 => Ok(UrlKind::Invalid),
        1 => Ok(UrlKind::Single(tracks.into_iter().next().unwrap())),
        _ => Ok(UrlKind::Playlist(tracks)),
    }
}

pub async fn download_track(
    app: &tauri::AppHandle,
    url: &str,
    format: &str,
    output_dir: &str,
    ffmpeg_path: &str,
    event_id: &str,
) -> Result<(), String> {
    validate_url(url)?;
    let progress_re = Regex::new(r"\[download\]\s+(\d+\.?\d*)%").unwrap();

    let mut args = vec![
        "-x".to_string(),
        "--audio-format".to_string(),
        format.to_string(),
        "--embed-metadata".to_string(),
        "--embed-thumbnail".to_string(),
        "--ffmpeg-location".to_string(),
        ffmpeg_path.to_string(),
        "-o".to_string(),
        format!("{}/%(title)s.%(ext)s", output_dir),
        "--newline".to_string(),
    ];

    if format == "mp3" {
        args.push("--audio-quality".to_string());
        args.push("320K".to_string());
    }

    args.push("--".to_string());
    args.push(url.to_string());

    let (mut rx, _child) = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| e.to_string())?
        .args(&args)
        .spawn()
        .map_err(|e| e.to_string())?;

    while let Some(event) = rx.recv().await {
        match event {
            tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                let text = String::from_utf8_lossy(&line);
                if let Some(cap) = progress_re.captures(&text) {
                    let percent: f64 = cap[1].parse().unwrap_or(0.0);
                    let _ = app.emit(
                        "download-progress",
                        serde_json::json!({ "id": event_id, "percent": percent }),
                    );
                }
            }
            tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                let text = String::from_utf8_lossy(&line);
                // surface fatal errors only
                if text.contains("ERROR") {
                    let _ = app.emit(
                        "download-error",
                        serde_json::json!({ "id": event_id, "message": map_error(&text) }),
                    );
                }
            }
            tauri_plugin_shell::process::CommandEvent::Error(e) => {
                return Err(e);
            }
            tauri_plugin_shell::process::CommandEvent::Terminated(status) => {
                if status.code != Some(0) {
                    return Err(
                        "Download process exited with an error. The content may be unavailable."
                            .into(),
                    );
                }
                break;
            }
            _ => {}
        }
    }

    let _ = app.emit(
        "download-progress",
        serde_json::json!({ "id": event_id, "percent": 100.0 }),
    );

    Ok(())
}
