const FORMATS = ["mp3", "flac", "opus", "m4a"] as const;
export type AudioFormat = (typeof FORMATS)[number];

interface Props {
  value: AudioFormat;
  onChange: (f: AudioFormat) => void;
  disabled: boolean;
}

export function FormatSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {FORMATS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          disabled={disabled}
          className={`px-4 py-1.5 rounded border text-sm font-[Space_Grotesk] font-bold uppercase tracking-wide transition-colors
            ${value === f
              ? "border-[var(--grab-red)] bg-[var(--grab-red)] text-white"
              : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)]"}
            disabled:opacity-40`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
