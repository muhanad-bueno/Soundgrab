# Soundgrab — Build SOP (v2, expanded)

**Purpose:** hand this to a coding agent (Claude Code, Codex CLI, etc.) as a complete, code-level spec. Each phase includes exact commands, file contents, and function signatures — the agent should not need to make architectural decisions, only implementation ones.

---

## 1. Goal

Windows desktop app, **Soundgrab**: paste a YouTube or SoundCloud URL (single track or playlist), pick a format (MP3/FLAC/Opus), download tagged audio files to a chosen folder. Stateless — no history, no database. Open source, MIT licensed.

## 2. Assumptions carried over from v1

Sources: YouTube + SoundCloud only. Metadata: auto ID3 tags + cover art via yt-dlp, no manual editing. No persistence across restarts beyond the current session. See v1 doc section 2 for full list — unchanged.

## 3. UI direction (confirmed)

- **Mode:** light only, no dark mode toggle in v1.
- **Layout:** single view. Everything — URL input, preview, format picker, folder picker, progress, results — lives in one panel, no sidebar, no routing.
- **Vibe:** bold and opinionated, not a neutral utility-app look.

### Design system

The subject is literally *grabbing* audio out of a stream — that's the idea the visual language is built around, rather than a generic "music app" look (no vinyl records, no headphone icons, no waveform-as-wallpaper cliché).

**Palette** (named, hex — use as CSS custom properties):
```css
--paper:      #F7F5F0;   /* background — warm off-white, not stark white */
--ink:        #1A1A1A;   /* primary text */
--grab-red:   #FF4B2B;   /* primary accent — the "grab" action color, used sparingly */
--signal-blue:#0057FF;   /* secondary accent — links, in-progress states */
--line:       #DDD8CC;   /* borders, dividers */
--success:    #1DB954... /* DO NOT use Spotify green — pick #2E9E5B instead, a muted leaf green */
```
Correction on the last line — use:
```css
--success:    #2E9E5B;   /* completed downloads */
```

Two accents only (red + blue). Do not add a third accent color. Red is reserved for the primary action (the download/grab button); blue is reserved for in-progress/informational states. This restraint is intentional — don't let the agent add gradients or a third color "for visual interest."

**Typography:**
- Display face (titles, the app name, the big URL input): a geometric grotesk with some character — **Space Grotesk** (free, Google Fonts). Used bold, large, tight tracking.
- Body face: **Inter** — neutral, legible, doesn't compete with the display face.
- Do not use a serif anywhere. Do not use the system default font stack — it reads as unstyled.

**Layout concept (ASCII):**
```
┌──────────────────────────────────────────────┐
│  SOUNDGRAB                                     │  <- Space Grotesk, bold, large
│                                                 │
│  ┌───────────────────────────────────────┐    │
│  │  Paste a YouTube or SoundCloud link... │    │  <- big input, grab-red focus ring
│  └───────────────────────────────────────┘    │
│                                                 │
│  [ once URL resolves: ]                        │
│  ┌───────┐  Track Title                        │
│  │ thumb │  Uploader · 3:42                     │
│  └───────┘                                      │
│                                                 │
│  Format:  ( MP3 )  ( FLAC )  ( Opus )          │  <- pill toggle, selected = grab-red fill
│  Save to: /Users/.../Downloads/Soundgrab  [Change] │
│                                                 │
│              ┌─────────────┐                   │
│              │   GRAB IT   │                    │  <- signature button
│              └─────────────┘                   │
│                                                 │
│  [ progress state replaces the button area ]   │
└──────────────────────────────────────────────┘
```

**Signature element:** the download button, when clicked, doesn't just show a generic progress bar. It morphs into a horizontal waveform made of thin vertical bars that fill left-to-right with `--grab-red` as the download progresses (literally: the bars "grab" color as they complete). This is the one place animation is spent — nowhere else in the app should have motion beyond simple hover/focus states. For playlists, each row in the track list gets its own miniature version of this same bar.

Copy tone: plain, active voice, no marketing filler. The button says "Grab it," not "Download now!" or "Start." Error states say what happened and what to do — e.g. "This track is private or was removed. Try a different link." not "An error occurred."

---

## 4. Architecture (unchanged from v1, restated for reference)

```
Soundgrab/
├── src-tauri/
│   ├── binaries/            # yt-dlp.exe, ffmpeg.exe (sidecars)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs
│   │   ├── ytdlp.rs
│   │   └── events.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── components/
│   ├── hooks/
│   ├── styles/tokens.css     # the design system above, as CSS variables
│   ├── App.tsx
│   └── main.tsx
├── README.md
├── LICENSE
└── .github/workflows/build.yml
```

---

## 5. Phase-by-phase, expanded

### Phase 0 — Scaffolding

**Steps:**
```bash
npm create tauri-app@latest soundgrab -- --template react-ts
cd soundgrab
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Edit `tauri.conf.json`:
```json
{
  "productName": "Soundgrab",
  "identifier": "com.soundgrab.app",
  "app": {
    "windows": [{ "title": "Soundgrab", "width": 720, "height": 640, "resizable": true }]
  },
  "bundle": { "targets": ["msi"], "windows": {} }
}
```

Create `src/styles/tokens.css` with the CSS custom properties from Section 3. Import it in `main.tsx` before any component styles.

Set up `.gitignore` to exclude `node_modules`, `src-tauri/target`, and `dist` — but *include* `src-tauri/binaries/` in git only if the binaries are small enough for GitHub (yt-dlp.exe is small; ffmpeg.exe can be 60–80MB — consider a download-on-first-run step instead, see Phase 5 note).

Add `LICENSE` (MIT, fill in the year and your name/handle) and a placeholder `README.md` with just the project name and "Work in progress."

**Done when:** `npm run tauri dev` opens a window titled "Soundgrab" with the token colors visible (test with a placeholder `<div>` styled with `background: var(--paper)`).

---

### Phase 1 — Core download engine (Rust)

**Get the binaries:**
```bash
# yt-dlp — download the standalone Windows exe from the official releases
curl -L -o src-tauri/binaries/yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
# ffmpeg — get an LGPL Windows build (gyan.dev builds are commonly used and clearly labeled)
# manual step: download the "essentials" LGPL build from gyan.dev, extract ffmpeg.exe into src-tauri/binaries/
```

Register both as Tauri sidecars in `tauri.conf.json`:
```json
{
  "bundle": {
    "externalBin": ["binaries/yt-dlp", "binaries/ffmpeg"]
  }
}
```
(Tauri appends the platform-specific extension automatically — the file on disk stays `yt-dlp.exe` for Windows.)

**`src-tauri/src/ytdlp.rs` — process wrapper:**
```rust
use tauri_plugin_shell::ShellExt;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct TrackMeta {
    pub id: String,
    pub title: String,
    pub uploader: String,
    pub duration: Option<u32>,
    pub thumbnail: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub enum UrlKind {
    Single(TrackMeta),
    Playlist(Vec<TrackMeta>),
    Invalid,
}

pub async fn detect_and_fetch(app: &tauri::AppHandle, url: &str) -> Result<UrlKind, String> {
    let output = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| e.to_string())?
        .args(["--flat-playlist", "--dump-json", "--no-warnings", url])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok(UrlKind::Invalid);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().filter(|l| !l.is_empty()).collect();

    // parse each line as JSON into TrackMeta (map yt-dlp's fields: id, title, uploader, duration, thumbnail)
    // if lines.len() == 1 -> UrlKind::Single, else -> UrlKind::Playlist
    // (agent: implement the serde_json::from_str mapping here, field names must match yt-dlp's JSON output —
    //  verify exact field names by running `yt-dlp --dump-json <url>` manually first)
    todo!()
}
```

**Download command:**
```rust
pub async fn download_track(
    app: &tauri::AppHandle,
    url: &str,
    format: &str,       // "mp3" | "flac" | "opus"
    output_dir: &str,
    ffmpeg_path: &str,
) -> Result<(), String> {
    let mut args = vec![
        "-x".to_string(),
        "--audio-format".to_string(), format.to_string(),
        "--embed-metadata".to_string(),
        "--embed-thumbnail".to_string(),
        "--ffmpeg-location".to_string(), ffmpeg_path.to_string(),
        "-o".to_string(), format!("{}/%(title)s.%(ext)s", output_dir),
        "--newline".to_string(),   // forces progress on separate lines, easier to parse
    ];
    if format == "mp3" {
        args.push("--audio-quality".to_string());
        args.push("320K".to_string());
    }
    args.push(url.to_string());

    // spawn (not output()) so you can stream stdout line-by-line and emit
    // a `download-progress` Tauri event for each line matching yt-dlp's
    // "[download]  42.0% of ..." pattern. Parse the percentage with a regex:
    // r"\[download\]\s+(\d+\.\d+)%"
    todo!()
}
```

**Expose as Tauri commands in `commands.rs`:**
```rust
#[tauri::command]
async fn fetch_metadata(app: tauri::AppHandle, url: String) -> Result<UrlKind, String> {
    ytdlp::detect_and_fetch(&app, &url).await
}

#[tauri::command]
async fn start_download(
    app: tauri::AppHandle,
    url: String,
    format: String,
    output_dir: String,
) -> Result<(), String> {
    // resolve bundled ffmpeg path via app.path() resolver, then call ytdlp::download_track
    todo!()
}
```
Register both in `main.rs`'s `.invoke_handler(tauri::generate_handler![fetch_metadata, start_download])`.

**Error mapping:** yt-dlp's stderr on failure contains recognizable substrings — check for `"Private video"`, `"This video is unavailable"`, `"Sign in to confirm your age"` and map each to a specific user-facing message rather than surfacing raw stderr. Anything unrecognized falls back to a generic "Couldn't download this — the link may be invalid or the content unavailable."

**Done when:** calling `fetch_metadata` from the Tauri dev console on a real YouTube URL returns parsed track data, and `start_download` produces a file on disk.

---

### Phase 2 — Format & quality verification

Manual test matrix — run each cell and confirm output:

| | YouTube | SoundCloud |
|---|---|---|
| MP3 | ☐ plays, 320kbps, tagged, art embedded | ☐ same |
| FLAC | ☐ plays, lossless, tagged, art embedded | ☐ same |
| Opus | ☐ plays, tagged, art embedded | ☐ same |

Verify tags with `ffprobe -v quiet -print_format json -show_format <file>` — check `format.tags.title`, `format.tags.artist`, and that `format.tags` includes embedded art (shows as an attached-pic stream in `ffprobe -show_streams`).

**Known gotcha:** the `--ffmpeg-location` path resolves differently in `tauri dev` (points into `src-tauri/binaries/`) vs. the packaged app (points into the installed app's resource directory). Use Tauri's path resolver API (`app.path().resolve(...)`) rather than a hardcoded relative path, and test both dev and a packaged build before calling this phase done.

**Done when:** all 6 matrix cells pass in both dev mode and a locally packaged build.

---

### Phase 3 — Frontend UI

Build components in this order (each depends on the previous):

1. **`tokens.css`** — already done in Phase 0, confirm it's wired up.
2. **`UrlInput.tsx`** — controlled text input, on blur/enter calls `invoke('fetch_metadata', { url })`, shows a subtle loading state (a pulsing bar under the input using `--signal-blue`, not a spinner — spinners are the generic default, avoid them per the design direction).
3. **`TrackPreview.tsx`** — props: `{ meta: TrackMeta }`. Renders thumbnail (rounded corners, `--line` border), title in Space Grotesk, uploader + duration in Inter, muted.
4. **`PlaylistTable.tsx`** — props: `{ tracks: TrackMeta[], selected: Set<string>, onToggle: (id: string) => void }`. Checkbox per row, "select all" header checkbox.
5. **`FormatSelector.tsx`** — three pill buttons (MP3/FLAC/Opus), selected state fills with `--grab-red`, unselected is outline only.
6. **`FolderPicker.tsx`** — button that calls Tauri's dialog plugin (`@tauri-apps/plugin-dialog`, `open({ directory: true })`), displays the chosen path truncated with an ellipsis in the middle if too long (not just cut off at the end — folder paths are more readable that way).
7. **`GrabButton.tsx`** — the signature element. Idle state: solid `--grab-red` button, text "Grab it." Active state: morphs into the waveform-fill described in Section 3 — implement as a row of ~40 thin `div`s with `height` randomized once (seeded, not re-randomized per render) to look like a waveform, each turning `--grab-red` as progress crosses its horizontal position.
8. **`useDownloadEvents.ts`** — hook that calls `listen('download-progress', ...)` from `@tauri-apps/api/event`, exposes `{ percent, status }`.
9. **`App.tsx`** — composes all of the above. State machine: `idle -> resolving -> previewing -> downloading -> done | error`. Keep this state machine explicit (a single `status` string, not scattered booleans) — it maps directly onto which components render.

**Done when:** the full flow — paste, preview, pick format, pick folder, grab, watch the waveform fill, see "Open folder" — works for both a single track and a playlist, entirely through the UI.

---

### Phase 4 — Concurrency & queueing

- In `start_download`'s Rust side (or a new `start_batch_download` command for playlists), cap concurrent yt-dlp subprocesses at 3 using a semaphore (`tokio::sync::Semaphore`).
- Sanitize filenames before passing to yt-dlp's `-o` template: strip `\ / : * ? " < > |` — yt-dlp mostly handles this itself but double-check on titles with emoji or non-Latin scripts (relevant given the app may see Arabic-titled tracks).
- Duplicate filename handling: yt-dlp's default behavior already avoids overwriting by appending `(1)`, `(2)` etc. — confirm this is on (it's default) rather than reimplementing it.

**Done when:** a playlist with 20+ tracks downloads completely, no more than 3 processes running at once (verify with Task Manager during a test run), no crashes on tracks with unusual title characters.

---

### Phase 5 — Packaging

```bash
npm run tauri build
```

- Confirm the resulting `.msi` in `src-tauri/target/release/bundle/msi/` includes the sidecar binaries (check the installer's file list, or install it on a clean VM/second machine).
- **ffmpeg size note:** if `ffmpeg.exe` pushes the repo or installer size uncomfortably high, consider downloading it on first run instead of bundling it (show a one-time "Setting up..." step that fetches the LGPL build and caches it in the app's data directory). This is optional — bundling is simpler and fine for v1 unless size becomes a real problem.
- App icon: generate from a single source PNG using `npm run tauri icon path/to/icon.png` (Tauri's built-in icon generator produces all required sizes).

**Done when:** a clean Windows machine (no Python, no ffmpeg pre-installed) can run the `.msi` and complete a download.

---

### Phase 6 — Open source readiness

**README sections to include, in order:**
1. One-line description + a screenshot or GIF of the grab-button waveform animation (this is the app's best visual hook, lead with it)
2. Features list
3. Install instructions (download from Releases, run the `.msi`)
4. The usage disclaimer (see below)
5. Credits: yt-dlp, ffmpeg
6. License

**Disclaimer language (draft, adjust tone as you like):**
> Soundgrab is a personal-use tool for saving audio you have the right to access. It doesn't circumvent DRM or paid-content protections. You're responsible for how you use it and for complying with the terms of the services you download from.

**`.github/workflows/build.yml`** — trigger on tag push (`v*`), run `npm run tauri build`, upload the `.msi` as a release asset using `softprops/action-gh-release` or Tauri's own `tauri-apps/tauri-action`.

**Done when:** repo is public-ready — clean clone, clear README, a tagged release produces a downloadable installer automatically.

---

## 6. Edge cases (unchanged from v1 — repeated for completeness)

Age-restricted videos, private/deleted tracks, very large playlists, no internet, stale yt-dlp binary. See v1 Section 6 if this doc's history is available; otherwise: fail with specific, non-generic error messages for each case rather than surfacing raw yt-dlp stderr.

## 7. Risks

Legal gray area (yt-dlp precedent, not legal advice), extraction fragility (yt-dlp updates independently), ffmpeg licensing (LGPL required), unsigned installer triggering SmartScreen (note in README, code signing is a future consideration).

## 8. Definition of done (v1)

- [ ] Single-track download works end to end, all 3 formats, both sources, correctly tagged
- [ ] Playlist download works with selection, concurrency cap, no filename collisions
- [ ] UI matches the design system: light mode, single view, red/blue two-accent palette, waveform-fill grab button
- [ ] Packaged `.msi` runs on a clean machine
- [ ] README, LICENSE, NOTICE, and a working release workflow are in place
