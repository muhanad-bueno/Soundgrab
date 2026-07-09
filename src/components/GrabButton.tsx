// ponytail: 40 bars, filled left-to-right as percent rises — CSS only, no canvas
const BAR_COUNT = 40;

// Fixed random-ish heights for visual variety, seeded once
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = Math.sin(i * 0.7) * 0.5 + Math.sin(i * 1.3) * 0.3 + 0.2;
  return 20 + Math.abs(t) * 60; // 20%–80%
});

interface Props {
  onClick: () => void;
  disabled: boolean;
  percent: number; // 0–100 while downloading; -1 = idle/done
  state: "idle" | "downloading" | "done";
}

export function GrabButton({ onClick, disabled, percent, state }: Props) {
  const isDownloading = state === "downloading";
  const isDone = state === "done";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative w-full h-14 rounded-lg overflow-hidden font-[Space_Grotesk] font-bold text-base tracking-widest uppercase transition-opacity disabled:opacity-40"
      style={{ background: isDone ? "var(--success)" : "var(--grab-red)" }}
    >
      {/* waveform bars — visible only while downloading */}
      {isDownloading && (
        <div className="absolute inset-0 flex items-end gap-[2px] px-[6px] pb-[6px] pt-[6px]">
          {BAR_HEIGHTS.map((h, i) => {
            const barPct = ((i + 1) / BAR_COUNT) * 100;
            const filled = percent >= barPct;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-colors duration-150"
                style={{
                  height: `${h}%`,
                  background: filled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* label */}
      <span
        className="relative z-10 drop-shadow-sm"
        style={{ color: "white", mixBlendMode: isDownloading ? "overlay" : "normal" }}
      >
        {isDone ? "DONE" : isDownloading ? `${Math.round(percent)}%` : "GRAB IT"}
      </span>
    </button>
  );
}
