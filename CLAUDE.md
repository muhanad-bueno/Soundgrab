# Soundgrab — Project Instructions

## What this is
Tauri v2 + React + TypeScript desktop app (Windows). Downloads audio from YouTube/SoundCloud via yt-dlp sidecar. Single view, no routing, no database.

## Tech stack
- Frontend: React + TypeScript + Tailwind CSS
- Desktop shell: Tauri v2
- Audio engine: yt-dlp + ffmpeg (sidecars)
- Build: `npm run tauri dev` (dev), `npm run tauri build` (produces .msi)

## Key commands
```
npm run tauri dev        # dev server + native window
npm run tauri build      # release .msi in src-tauri/target/release/bundle/msi/
cargo test               # run Rust unit tests (from src-tauri/)
```

## Architecture
```
src/                     # React frontend
  components/            # UI components (one file per component)
  hooks/                 # useDownloadEvents.ts etc.
  styles/tokens.css      # CSS custom properties (design system)
  App.tsx                # root state machine: idle->resolving->previewing->downloading->done|error
  main.tsx
src-tauri/
  binaries/              # yt-dlp.exe, ffmpeg.exe — NOT in git (too large / fetched on first run)
  src/
    main.rs              # Tauri entry, registers commands
    commands.rs          # #[tauri::command] wrappers
    ytdlp.rs             # yt-dlp process wrapper, TrackMeta, UrlKind
    events.rs            # Tauri event helpers
  Cargo.toml
  tauri.conf.json
```

## ffmpeg strategy
ffmpeg is NOT bundled. On first launch, the app downloads the LGPL Windows build from a known URL and caches it in Tauri's app data dir. yt-dlp.exe IS bundled as a Tauri sidecar.

## Design system (do not deviate)
- Palette: --paper #F7F5F0 | --ink #1A1A1A | --grab-red #FF4B2B | --signal-blue #0057FF | --line #DDD8CC | --success #2E9E5B
- Fonts: Space Grotesk (display/titles), Inter (body) — both from Google Fonts
- Two accents only: red = primary action, blue = in-progress/info. No gradients, no third color.
- Signature element: GRAB IT button morphs into waveform-fill animation on click (40 bars, fill left-to-right with --grab-red as % progresses)
- No sidebar, no routing — single view only
- Dark mode: opt-in toggle in settings, persisted; dark palette defined in Phase 4.5

## Build phases (track progress here)
- [x] Phase 0 — Scaffolding (Tauri + React + Tailwind + tokens.css)
- [x] Phase 1 — Core download engine (Rust: ytdlp.rs, commands.rs)
- [x] Phase 2 — Format & quality verification (manual test matrix, done after Phase 3 UI exists)

- [x] Phase 3 — Frontend UI (all components + App.tsx state machine)
- [x] Phase 4 — Concurrency & queueing (semaphore cap=3, filename sanitization)
- [x] Phase 4.3 — Download speed & quality optimisations
    - Concurrent fragments: pass `--concurrent-fragments 4` to every yt-dlp invocation (YouTube splits streams into fragments; this downloads them in parallel within a single track). Expose as a setting in Phase 4.5 (range 1–8, default 4).
    - URL-extract mode: during metadata resolution yt-dlp already fetches the direct stream URL. For single tracks, pass that URL directly to ffmpeg (`ffmpeg -i <stream_url> -vn -acodec ...`) instead of re-invoking yt-dlp for the download step. yt-dlp becomes a pure URL extractor; ffmpeg owns the download+transcode in one process. Cuts yt-dlp process overhead and removes the double-network-hit. Playlist tracks already have `url` in TrackMeta — use it. Fall back to full yt-dlp download if the direct URL is absent (SoundCloud, age-gated, etc.).
    - Opus fast-path: if the user selects opus/ogg AND the source is YouTube, the audio stream is already opus — yt-dlp can remux with `--audio-format opus --no-post-overwrites` with zero transcoding. Add opus to FormatSelector. In ytdlp.rs, detect YouTube URLs and skip the `-x` re-encode flag when format is opus (use `--remux-video` instead). Show a "lossless remux, instant" label in the UI when this path is taken.
    - Embed toggles (both on by default, user can disable in Phase 4.5 settings):
        - `embed_thumbnail: bool` — when false, omit `--embed-thumbnail` (saves one ffmpeg pass per track; meaningful on slow machines)
        - `embed_metadata: bool` — when false, omit `--embed-metadata`
        - Pass both bools through the `start_download` command signature; Phase 4.5 wires them to the settings store
    - Batch mode for playlists: instead of one yt-dlp process per track (current), write track URLs to a temp file and pass `--batch-file` to a single yt-dlp process. Single process startup, yt-dlp manages its own internal queue. Only applies when all tracks share the same format/options. Fall back to per-track if settings differ per track or if direct-URL mode is active. DEFERRED: conflicts with per-track progress events; add only if batch-level progress reporting is implemented.
    - yt-dlp auto-update: on app startup (after ffmpeg check), run `yt-dlp --update-to stable` in the background. Non-blocking, silent. Newer yt-dlp = fewer breakages, often faster extraction. DONE.
    - SoundCloud optimisations: SoundCloud streams are HLS (m3u8 segments). `--concurrent-fragments` helps here too. No remux fast-path (SC encodes in mp3/opus depending on track). Add `--no-playlist-reverse` for SC playlists (they paginate in reverse by default). SC Go+ tracks are gated — map the "requires premium" stderr string in map_error.
    - TikTok optimisations: TikTok audio is AAC in an mp4 container. Fastest path: format=m4a, `--remux-video m4a` (same idea as opus YouTube — skip transcode). For mp3 output add `--audio-quality 0`. TikTok rate-limits aggressively — keep concurrent_fragments at 1 for TikTok URLs (detected by `tiktok.com` in URL). Add "TikTok" to is_platform helpers alongside is_youtube. Add TikTok-specific error string: "Could not find media" → "This TikTok may be private or removed."
    - Done when: a single YouTube track downloads measurably faster than before (target: opus remux near-instant, mp3 noticeably quicker due to fragment parallelism); all embed toggles respected; SoundCloud and TikTok error messages are specific.
- [x] Phase 4.5 — Settings & persistence
    - Settings gear icon opens a modal panel (no routing — overlay on the single view)
    - Concurrent downloads slider: 1–8, default 3 (updates the Rust semaphore cap live via a `set_concurrency` command)
    - Concurrent fragments slider: 1–8, default 4 (passed as `--concurrent-fragments N` per Phase 4.3)
    - Embed thumbnail toggle: on by default (Phase 4.3 behaviour)
    - Embed metadata toggle: on by default (Phase 4.3 behaviour)
    - Default save folder: persisted via `tauri-plugin-store` (JSON file in app data dir); pre-fills FolderPicker on launch
    - Dark mode toggle: flips a `data-theme="dark"` attribute on `<html>`; dark palette added to tokens.css (--paper-dark #141414 | --ink-dark #F0EDE8 | --line-dark #2A2A2A); preference persisted in same store
    - All settings persisted in a single `settings.json` via tauri-plugin-store; loaded on startup before first render
    - Done when: settings survive app restart, dark mode looks correct, all sliders/toggles take effect on next download
- [x] Phase 5 — Packaging (.msi, icons, clean-machine test)
- [ ] Phase 6 — Open source readiness (README, LICENSE, CI release workflow)

## Rules for this project
- Match SOP exactly — no architectural decisions beyond what's specced
- Do NOT add abstractions beyond what the phase requires
- Test each phase's "Done when" condition before marking it complete
- Each session: start by reading this file + checking which phase is current
- ffmpeg download-on-first-run: fetch from gyan.dev LGPL essentials build, store in app data dir, check existence on startup before allowing downloads
- Error messages must be specific (see SOP Section 1 Phase 1 error mapping)
- Concurrency cap: 3 simultaneous yt-dlp processes (tokio::sync::Semaphore)
