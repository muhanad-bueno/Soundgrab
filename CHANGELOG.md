# Changelog

All notable changes to Soundgrab are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — headings are `Added`, `Changed`, `Fixed`, `Removed`.
Versions follow [Semantic Versioning](https://semver.org).

---

## [Unreleased]

---

## [0.2.0] — 2026-07-09

### Added
- Update checker: on launch, fetches `latest.json` from GitHub Releases and shows a dismissable banner when a newer version is available; clicking it opens the release page in the browser
- Info modal (ⓘ button in header): shows app overview, attributions (cassette tape icon CC BY 3.0, yt-dlp Unlicense, ffmpeg LGPL, Tauri MIT/Apache)
- Portable build support: NSIS target added alongside MSI; at runtime, presence of a `_portable` marker file next to the exe redirects all data paths (ffmpeg cache, settings store) to the exe directory instead of `%APPDATA%`

### Fixed
- SoundCloud playlist tracks showing "Unknown" as title instead of the actual track name

### Changed
- License switched from MIT to The Unlicense (public domain)
- README rewritten: Unlicense badge, Attributions section, cleaner layout
- `index.html` title updated from "Tauri + React + Typescript" to "Soundgrab"; removed stale Vite favicon reference
- Removed `public/` scaffold folder (held only unused Vite/Tauri SVG placeholders)

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
