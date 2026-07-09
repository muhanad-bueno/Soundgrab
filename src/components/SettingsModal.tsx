import { useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { Settings } from "../hooks/useSettings";

interface Props {
  settings: Settings;
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdate, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function pickFolder() {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === "string") onUpdate("defaultFolder", dir);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-base font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif", color: "var(--ink)" }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--ink)", background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--line)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* divider */}
        <div style={{ height: 1, background: "var(--line)", margin: "-4px 0" }} />

        {/* Concurrent downloads */}
        <SliderRow
          label="Concurrent downloads"
          value={settings.concurrentDownloads}
          min={1} max={8}
          onChange={(v) => onUpdate("concurrentDownloads", v)}
        />

        {/* Concurrent fragments */}
        <SliderRow
          label="Concurrent fragments"
          value={settings.concurrentFragments}
          min={1} max={8}
          onChange={(v) => onUpdate("concurrentFragments", v)}
        />

        {/* divider */}
        <div style={{ height: 1, background: "var(--line)", margin: "-4px 0" }} />

        {/* Toggles */}
        <ToggleRow
          label="Embed thumbnail"
          checked={settings.embedThumbnail}
          onChange={(v) => onUpdate("embedThumbnail", v)}
        />
        <ToggleRow
          label="Embed metadata"
          checked={settings.embedMetadata}
          onChange={(v) => onUpdate("embedMetadata", v)}
        />
        <ToggleRow
          label="Dark mode"
          checked={settings.darkMode}
          onChange={(v) => onUpdate("darkMode", v)}
        />

        {/* divider */}
        <div style={{ height: 1, background: "var(--line)", margin: "-4px 0" }} />

        {/* Default save folder */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            Default save folder
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={pickFolder}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              style={{
                border: "1px solid var(--line)",
                background: "var(--line)",
                color: "var(--ink)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            >
              Choose folder
            </button>
            <span
              className="text-sm truncate min-w-0"
              style={{ color: settings.defaultFolder ? "var(--ink)" : "#888" }}
            >
              {settings.defaultFolder || "No folder selected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  // pct for track fill
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{label}</span>
        <span
          className="text-sm font-bold tabular-nums w-5 text-right"
          style={{ fontFamily: "Space Grotesk, sans-serif", color: "var(--grab-red)" }}
        >
          {value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          // custom track via background gradient — works in Chromium
          WebkitAppearance: "none",
          appearance: "none",
          width: "100%",
          height: "4px",
          borderRadius: "2px",
          outline: "none",
          cursor: "pointer",
          background: `linear-gradient(to right, var(--grab-red) ${pct}%, var(--line) ${pct}%)`,
        }}
      />
    </div>
  );
}

function ToggleRow({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 rounded-full transition-colors duration-200"
        style={{
          width: 44,
          height: 24,
          background: checked ? "var(--grab-red)" : "var(--line)",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          className="absolute rounded-full bg-white shadow-sm"
          style={{
            width: 18,
            height: 18,
            top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.15s ease",
          }}
        />
      </button>
    </div>
  );
}
