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
- No dark mode, no sidebar, no routing — single view only

## Build phases (track progress here)
- [ ] Phase 0 — Scaffolding (Tauri + React + Tailwind + tokens.css)
- [ ] Phase 1 — Core download engine (Rust: ytdlp.rs, commands.rs)
- [ ] Phase 2 — Format & quality verification (manual test matrix)
- [ ] Phase 3 — Frontend UI (all components + App.tsx state machine)
- [ ] Phase 4 — Concurrency & queueing (semaphore cap=3, filename sanitization)
- [ ] Phase 5 — Packaging (.msi, icons, clean-machine test)
- [ ] Phase 6 — Open source readiness (README, LICENSE, CI release workflow)

## Rules for this project
- Match SOP exactly — no architectural decisions beyond what's specced
- Do NOT add abstractions beyond what the phase requires
- Test each phase's "Done when" condition before marking it complete
- Each session: start by reading this file + checking which phase is current
- ffmpeg download-on-first-run: fetch from gyan.dev LGPL essentials build, store in app data dir, check existence on startup before allowing downloads
- Error messages must be specific (see SOP Section 1 Phase 1 error mapping)
- Concurrency cap: 3 simultaneous yt-dlp processes (tokio::sync::Semaphore)
