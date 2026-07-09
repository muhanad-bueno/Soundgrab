# Changelog

All notable changes to Soundgrab are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — headings are `Added`, `Changed`, `Fixed`, `Removed`.
Versions follow [Semantic Versioning](https://semver.org).

---

## [Unreleased]

---

## [0.1.0] — 2026-07-09

### Added
- Paste a YouTube, SoundCloud, or TikTok URL — single track or full playlist
- Format picker: MP3, FLAC, Opus, M4A, WAV
- Folder picker with persistent default save location
- Per-track download progress with waveform-fill animation (GRAB IT button)
- Automatic ID3 tags + cover art embedding via yt-dlp
- Concurrent downloads (default 3, configurable 1–8)
- Concurrent fragment fetching per track (default 4, configurable 1–8) for faster YouTube downloads
- Opus remux fast-path on YouTube — zero transcoding, near-instant
- Dark mode toggle, persisted across restarts
- Settings panel (gear icon): all preferences in one place, survive app restart
- ffmpeg downloaded on first launch from gyan.dev LGPL build, cached in app data dir
- yt-dlp auto-updates to latest stable on each launch (background, silent)
- Platform-specific error messages: private/unavailable/age-restricted/SoundCloud Go+/TikTok geo-block
- SoundCloud playlist reverse-order fix (`--no-playlist-reverse`)
- TikTok fragment cap (1) to avoid rate-limit errors
- Filename sanitization for Windows-illegal characters
