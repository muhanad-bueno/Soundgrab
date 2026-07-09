import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useReducer, useRef } from "react";
import { UrlInput } from "./components/UrlInput";
import { TrackPreview } from "./components/TrackPreview";
import { PlaylistTable } from "./components/PlaylistTable";
import { FormatSelector, type AudioFormat } from "./components/FormatSelector";
import { FolderPicker } from "./components/FolderPicker";
import { GrabButton } from "./components/GrabButton";
import { useDownloadEvents } from "./hooks/useDownloadEvents";
import { Logo } from "./components/Logo";
import type { TrackMeta, UrlKind } from "./types";

// ── state machine ────────────────────────────────────────────────────────────

type Phase =
  | { tag: "setup" }           // ffmpeg not ready, downloading it
  | { tag: "idle" }
  | { tag: "resolving" }       // fetch_metadata in flight
  | { tag: "previewing"; kind: Extract<UrlKind, { type: "Single" | "Playlist" }> }
  | { tag: "downloading"; kind: Extract<UrlKind, { type: "Single" | "Playlist" }>; progress: Record<string, number> }
  | { tag: "done"; kind: Extract<UrlKind, { type: "Single" | "Playlist" }> }
  | { tag: "error"; message: string };

type Action =
  | { type: "SETUP_NEEDED" }
  | { type: "READY" }
  | { type: "RESOLVE" }
  | { type: "RESOLVED"; kind: Extract<UrlKind, { type: "Single" | "Playlist" }> }
  | { type: "ERROR"; message: string }
  | { type: "START_DOWNLOAD" }
  | { type: "PROGRESS"; id: string; percent: number }
  | { type: "DONE" }
  | { type: "RESET" };

function reducer(state: Phase, action: Action): Phase {
  switch (action.type) {
    case "SETUP_NEEDED": return { tag: "setup" };
    case "READY":        return state.tag === "setup" ? { tag: "idle" } : state;
    case "RESOLVE":      return { tag: "resolving" };
    case "RESOLVED":     return { tag: "previewing", kind: action.kind };
    case "ERROR":        return { tag: "error", message: action.message };
    case "START_DOWNLOAD":
      if (state.tag !== "previewing") return state;
      return { tag: "downloading", kind: state.kind, progress: {} };
    case "PROGRESS":
      if (state.tag !== "downloading") return state;
      return { ...state, progress: { ...state.progress, [action.id]: action.percent } };
    case "DONE":
      if (state.tag !== "downloading") return state;
      return { tag: "done", kind: state.kind };
    case "RESET":        return { tag: "idle" };
    default:             return state;
  }
}

// ── app ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, dispatch] = useReducer(reducer, { tag: "setup" });
  const urlRef = useRef("");
  const formatRef = useRef<AudioFormat>("mp3");
  const folderRef = useRef("");

  // Force re-render when refs change (they're controlled imperatively for perf)
  const [, tick] = useReducer((n: number) => n + 1, 0);
  function setUrl(v: string) { urlRef.current = v; tick(); }
  function setFormat(v: AudioFormat) { formatRef.current = v; tick(); }
  function setFolder(v: string) { folderRef.current = v; tick(); }

  // ffmpeg first-run setup
  useEffect(() => {
    invoke<boolean>("check_ffmpeg").then((ready) => {
      if (ready) {
        dispatch({ type: "READY" });
      } else {
        dispatch({ type: "SETUP_NEEDED" });
        // listen for setup-progress from Rust
        const unsub = listen<{ status: string }>("setup-progress", (e) => {
          if (e.payload.status === "done") dispatch({ type: "READY" });
        });
        invoke("setup_ffmpeg").catch((e: unknown) =>
          dispatch({ type: "ERROR", message: String(e) })
        );
        return () => { unsub.then((f) => f()); };
      }
    });
  }, []);

  // download event listeners
  useDownloadEvents(
    (id, percent) => dispatch({ type: "PROGRESS", id, percent }),
    (_id, message) => dispatch({ type: "ERROR", message }),
  );

  async function handleLookup() {
    const url = urlRef.current.trim();
    if (!url) return;
    dispatch({ type: "RESOLVE" });
    try {
      const result = await invoke<UrlKind>("fetch_metadata", { url });
      if (result.type === "Invalid") {
        dispatch({ type: "ERROR", message: "No playable content found at that URL." });
      } else {
        dispatch({ type: "RESOLVED", kind: result as Extract<UrlKind, { type: "Single" | "Playlist" }> });
      }
    } catch (e) {
      dispatch({ type: "ERROR", message: String(e) });
    }
  }

  async function handleGrab() {
    if (phase.tag !== "previewing") return;
    const folder = folderRef.current.trim();
    if (!folder) { dispatch({ type: "ERROR", message: "Please choose a save folder first." }); return; }

    dispatch({ type: "START_DOWNLOAD" });

    const tracks: TrackMeta[] =
      phase.kind.type === "Single" ? [phase.kind.data] : phase.kind.data;

    try {
      // run downloads sequentially (Phase 4 adds concurrency cap)
      for (const track of tracks) {
        const trackUrl = track.webpage_url || track.url || urlRef.current;
        await invoke("start_download", {
          url: trackUrl,
          format: formatRef.current,
          outputDir: folder,
          eventId: track.id,
        });
      }
      dispatch({ type: "DONE" });
    } catch (e) {
      dispatch({ type: "ERROR", message: String(e) });
    }
  }

  // derived
  const busy = phase.tag === "resolving" || phase.tag === "downloading" || phase.tag === "setup";
  const tracks: TrackMeta[] | null =
    phase.tag === "previewing" || phase.tag === "downloading" || phase.tag === "done"
      ? phase.kind.type === "Single" ? [phase.kind.data] : phase.kind.data
      : null;

  const totalProgress =
    phase.tag === "downloading" && tracks
      ? tracks.reduce((sum, t) => sum + (phase.progress[t.id] ?? 0), 0) / tracks.length
      : phase.tag === "done" ? 100 : 0;

  const grabState: "idle" | "downloading" | "done" =
    phase.tag === "downloading" ? "downloading" :
    phase.tag === "done" ? "done" : "idle";

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start pt-12 px-4"
      style={{ background: "var(--paper)" }}
    >
      <div className="w-full max-w-lg flex flex-col gap-5">
        {/* header */}
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1
              className="text-3xl font-bold tracking-tight leading-none"
              style={{ fontFamily: "Space Grotesk, sans-serif", color: "var(--ink)" }}
            >
              SOUNDGRAB
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6b6860" }}>
              Download audio from YouTube & SoundCloud
            </p>
          </div>
        </div>

        {/* setup state */}
        {phase.tag === "setup" && (
          <div
            className="px-4 py-3 rounded-lg border text-sm font-[Inter]"
            style={{ borderColor: "var(--signal-blue)", color: "var(--signal-blue)", background: "rgba(0,87,255,0.05)" }}
          >
            Setting up ffmpeg… this only happens once.
          </div>
        )}

        {/* error state */}
        {phase.tag === "error" && (
          <div
            className="px-4 py-3 rounded-lg border text-sm font-[Inter]"
            style={{ borderColor: "var(--grab-red)", color: "var(--grab-red)", background: "rgba(255,75,43,0.05)" }}
          >
            <span className="font-bold">Error: </span>{phase.message}
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="ml-3 underline text-xs opacity-70 hover:opacity-100"
            >
              try again
            </button>
          </div>
        )}

        {/* URL input — hidden during setup */}
        {phase.tag !== "setup" && (
          <UrlInput
            value={urlRef.current}
            onChange={setUrl}
            onSubmit={handleLookup}
            disabled={busy || phase.tag === "done"}
          />
        )}

        {/* resolving indicator */}
        {phase.tag === "resolving" && (
          <p className="text-sm text-center" style={{ color: "var(--signal-blue)" }}>
            Looking up…
          </p>
        )}

        {/* track/playlist preview */}
        {tracks && tracks.length === 1 && (
          <TrackPreview track={tracks[0]} />
        )}
        {tracks && tracks.length > 1 && (
          <PlaylistTable
            tracks={tracks}
            progress={phase.tag === "downloading" ? phase.progress : phase.tag === "done" ? Object.fromEntries(tracks.map(t => [t.id, 100])) : {}}
          />
        )}

        {/* format + folder + grab — shown once we have a result */}
        {(phase.tag === "previewing" || phase.tag === "downloading" || phase.tag === "done") && (
          <>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#6b6860] mb-1.5 block" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Format
                </label>
                <FormatSelector
                  value={formatRef.current}
                  onChange={setFormat}
                  disabled={phase.tag !== "previewing"}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-[#6b6860] mb-1.5 block" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Save to
                </label>
                <FolderPicker
                  value={folderRef.current}
                  onChange={setFolder}
                  disabled={phase.tag !== "previewing"}
                />
              </div>
            </div>

            <GrabButton
              onClick={phase.tag === "done" ? () => { dispatch({ type: "RESET" }); setUrl(""); } : handleGrab}
              disabled={phase.tag === "downloading" || (phase.tag === "previewing" && !folderRef.current)}
              percent={totalProgress}
              state={grabState}
            />
          </>
        )}
      </div>
    </div>
  );
}
