# Soundgrab

Download audio from YouTube, SoundCloud, and TikTok — pick a format, pick a folder, done.

**Windows only · Tauri v2 · MIT licensed · free to use, fork, and modify**

---

## What it does

- Paste a URL (single track or playlist)
- Pick a format: MP3, FLAC, Opus, M4A, WAV
- Pick an output folder
- Click **GRAB IT** — progress tracks per-track with a waveform fill animation
- Audio is tagged automatically (title, artist, cover art)

Supports YouTube, SoundCloud, and TikTok. Playlists up to a few hundred tracks work fine — downloads run 3 at a time by default.

---

## Download

Go to [Releases](https://github.com/muhanad-bueno/Soundgrab/releases) and grab the latest `.msi`.

Run it, Windows may show a SmartScreen prompt since the installer isn't signed — click **More info → Run anyway**. On first launch the app downloads ffmpeg (~80 MB) once and caches it; subsequent launches are instant.

**Requirements:** Windows 10/11 x64, WebView2 (pre-installed on Win10 20H2+ and all Win11)

---

## Settings

Click the gear icon in the top-right:

| Setting | Default | What it does |
|---|---|---|
| Concurrent downloads | 3 | How many tracks download in parallel (1–8) |
| Concurrent fragments | 4 | Parallel fragment fetching per track, speeds up YouTube (1–8) |
| Embed thumbnail | On | Embeds cover art in the audio file |
| Embed metadata | On | Embeds title/artist/album tags |
| Default save folder | — | Pre-fills the folder picker on launch |
| Dark mode | Off | Toggles dark palette, persisted across restarts |

---

## Build from source

**Prerequisites:** Rust (stable), Node.js 18+, the [Tauri v2 prerequisites](https://tauri.app/start/prerequisites/) for Windows

```sh
git clone https://github.com/muhanad-bueno/Soundgrab
cd Soundgrab
npm install
```

Drop `yt-dlp.exe` into `src-tauri/binaries/` and rename it `yt-dlp-x86_64-pc-windows-msvc.exe` (Tauri sidecar naming convention). Download from [yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases).

ffmpeg is not needed at build time — the app downloads it on first launch.

```sh
npm run tauri dev     # dev build with hot reload
npm run tauri build   # release .msi → src-tauri/target/release/bundle/msi/
```

---

## Tech stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Desktop shell | Tauri v2 |
| Audio engine | yt-dlp (sidecar) + ffmpeg (downloaded on first run) |
| Fonts | Space Grotesk · Inter (Google Fonts) |

---

## Versioning

Releases follow [Semantic Versioning](https://semver.org). See [CHANGELOG.md](CHANGELOG.md) for what changed in each version. To cut a release:

1. Update the version in `package.json` and `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json`
2. Add an entry to `CHANGELOG.md` under a new `## [x.y.z]` heading
3. Commit: `git commit -m "chore: release vx.y.z"`
4. Tag: `git tag vx.y.z && git push && git push --tags`
5. Build locally with `npm run tauri build`
6. Create a GitHub Release from the tag, attach the `.msi`

---

## License

MIT — see [LICENSE](LICENSE).
