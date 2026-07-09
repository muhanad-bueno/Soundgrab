import { useEffect } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

interface Props {
  onClose: () => void;
}

export function InfoModal({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-xl"
        style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg leading-none opacity-40 hover:opacity-80"
          aria-label="Close"
        >
          ✕
        </button>

        <h2
          className="text-xl font-bold mb-4"
          style={{ fontFamily: "Space Grotesk, sans-serif", color: "var(--ink)" }}
        >
          About Soundgrab
        </h2>

        <div className="text-sm space-y-3" style={{ color: "var(--ink)", fontFamily: "Inter, sans-serif" }}>
          <p>
            Paste a YouTube, SoundCloud, or TikTok link — Soundgrab figures out what it
            is, shows you a preview, then downloads the audio in the format you pick.
          </p>

          <div>
            <p className="font-semibold mb-1">How it works</p>
            <ul className="space-y-1 opacity-80">
              <li>• <strong>yt-dlp</strong> fetches track info and extracts the audio stream URL.</li>
              <li>• <strong>ffmpeg</strong> converts that stream into your chosen format (MP3, FLAC, etc.).</li>
              <li>• The app shell is built with <strong>Tauri</strong> (Rust + WebView) and <strong>React</strong>.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">Attributions</p>
            <ul className="space-y-1 opacity-80">
              <li>
                • Cassette tape icon by{" "}
                <button
                  className="underline"
                  onClick={() => openUrl("https://thenounproject.com/icon/casette-tape-343515/")}
                >
                  The Noun Project
                </button>
                {" "}— CC BY 3.0
              </li>
              <li>
                • <button className="underline" onClick={() => openUrl("https://github.com/yt-dlp/yt-dlp")}>yt-dlp</button>
                {" "}— Unlicense
              </li>
              <li>
                • <button className="underline" onClick={() => openUrl("https://ffmpeg.org")}>ffmpeg</button>
                {" "}— LGPL v2.1
              </li>
              <li>
                • <button className="underline" onClick={() => openUrl("https://tauri.app")}>Tauri</button>
                {" "}— MIT / Apache 2.0
              </li>
            </ul>
          </div>

          <p className="opacity-60 text-xs pt-1">
            Soundgrab is public domain (The Unlicense).{" "}
            <button
              className="underline"
              onClick={() => openUrl("https://github.com/muhanad-bueno/Soundgrab")}
            >
              Source on GitHub
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
