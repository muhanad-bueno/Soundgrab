import type { TrackMeta } from "../types";

function fmt(secs?: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  track: TrackMeta;
}

export function TrackPreview({ track }: Props) {
  return (
    <div className="flex gap-4 items-center p-4 border border-[var(--line)] rounded-lg bg-white">
      {track.thumbnail && (
        <img
          src={track.thumbnail}
          alt=""
          className="w-16 h-16 object-cover rounded flex-shrink-0"
        />
      )}
      <div className="min-w-0">
        <p className="font-[Space_Grotesk] font-bold text-[var(--ink)] text-base leading-tight truncate">
          {track.title}
        </p>
        <p className="text-sm text-[#6b6860] mt-0.5 truncate">{track.uploader}</p>
        {track.duration && (
          <p className="text-xs text-[#aaa8a2] mt-0.5">{fmt(track.duration)}</p>
        )}
      </div>
    </div>
  );
}
