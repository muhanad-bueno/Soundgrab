import type { TrackMeta } from "../types";

function fmt(secs?: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  tracks: TrackMeta[];
  progress: Record<string, number>; // id -> 0-100
}

export function PlaylistTable({ tracks, progress }: Props) {
  return (
    <div className="border border-[var(--line)] rounded-lg overflow-hidden">
      <div className="max-h-64 overflow-y-auto">
        {tracks.map((t, i) => {
          const pct = progress[t.id] ?? 0;
          const done = pct >= 100;
          return (
            <div
              key={t.id}
              className="relative flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line)] last:border-b-0 bg-white"
            >
              {/* progress fill behind row */}
              {pct > 0 && (
                <div
                  className="absolute inset-0 bg-[var(--grab-red)] opacity-[0.07] pointer-events-none transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="text-xs text-[#aaa8a2] w-5 flex-shrink-0 text-right">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-[var(--ink)] font-[Inter] truncate">
                {t.title}
              </span>
              <span className="text-xs text-[#aaa8a2] flex-shrink-0">{fmt(t.duration)}</span>
              {done && (
                <span className="text-[var(--success)] text-xs font-bold flex-shrink-0">✓</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 bg-[var(--paper)] border-t border-[var(--line)] text-xs text-[#6b6860]">
        {tracks.length} tracks
      </div>
    </div>
  );
}
