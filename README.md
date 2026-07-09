<div align="center">

<img src="src-tauri/icons/logo.svg" width="80" alt="Soundgrab logo" />

# Soundgrab

**Paste a URL. Pick a format. Grab it.**

[![License: MIT](https://img.shields.io/badge/license-MIT-red.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://github.com/muhanad-bueno/Soundgrab/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-orange.svg)](https://tauri.app)
[![Release](https://img.shields.io/github/v/release/muhanad-bueno/Soundgrab)](https://github.com/muhanad-bueno/Soundgrab/releases)

</div>

---

Download audio from YouTube, SoundCloud, and TikTok as MP3, FLAC, Opus, M4A, or WAV — with auto-tagging, cover art, and a playlist queue. No accounts, no cloud, no telemetry.

## Download

Grab the latest `.msi` from [**Releases**](https://github.com/muhanad-bueno/Soundgrab/releases).

> Windows may show a SmartScreen warning (unsigned installer) — click **More info → Run anyway**.  
> On first launch the app downloads ffmpeg once (~80 MB) and caches it. All subsequent launches are instant.

**Requirements:** Windows 10/11 x64 · WebView2 (pre-installed on Win10 20H2+ and all Win11)

---

## Features

- Paste any YouTube, SoundCloud, or TikTok URL — single track or full playlist
- Format picker: **MP3 · FLAC · Opus · M4A · WAV**
- Auto-embeds ID3 tags + cover art
- Per-track progress with waveform animation
- Concurrent downloads (default 3) and parallel fragment fetching (default 4) for speed
- Opus remux fast-path on YouTube — zero transcoding, near-instant
- Settings panel: all preferences persist across restarts
- Dark mode

---

## Settings

| Setting | Default | What it does |
|---|---|---|
| Concurrent downloads | 3 | Parallel tracks (1–8) |
| Concurrent fragments | 4 | Parallel fragment fetch per track (1–8) |
| Embed thumbnail | On | Cover art in the audio file |
| Embed metadata | On | Title / artist / album tags |
| Default save folder | — | Pre-fills the folder picker on launch |
| Dark mode | Off | Persisted across restarts |

---

## Build from source

**Prerequisites:** Rust (stable) · Node.js 18+ · [Tauri v2 prerequisites](https://tauri.app/start/prerequisites/)

```sh
git clone https://github.com/muhanad-bueno/Soundgrab
cd Soundgrab
npm install
```

Drop `yt-dlp.exe` into `src-tauri/binaries/` renamed as `yt-dlp-x86_64-pc-windows-msvc.exe` (Tauri sidecar naming). Get it from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases). ffmpeg is not needed at build time — the app fetches it on first launch.

```sh
npm run tauri dev      # dev build with hot reload
npm run tauri build    # release .msi → src-tauri/target/release/bundle/msi/
```

---

## Tech stack

| | |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Desktop shell | Tauri v2 |
| Audio engine | yt-dlp (sidecar) + ffmpeg (fetched on first run) |
| Fonts | Space Grotesk · Inter |

---

## Versioning

See [CHANGELOG.md](CHANGELOG.md) for what changed in each version. Releases follow [Semantic Versioning](https://semver.org).

---

## License

MIT — free to use, fork, and do anything with. See [LICENSE](LICENSE).
