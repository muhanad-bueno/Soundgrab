interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function UrlInput({ value, onChange, onSubmit, disabled }: Props) {
  return (
    <div className="flex gap-2">
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && onSubmit()}
        placeholder="Paste a YouTube or SoundCloud URL…"
        disabled={disabled}
        className="flex-1 px-4 py-3 border border-[var(--line)] rounded-lg bg-white text-[var(--ink)] font-[Inter] text-sm placeholder:text-[#aaa8a2] focus:outline-none focus:ring-2 focus:ring-[var(--signal-blue)] disabled:opacity-40"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="px-5 py-3 bg-[var(--ink)] text-white font-[Space_Grotesk] font-bold text-sm rounded-lg hover:opacity-80 disabled:opacity-30 transition-opacity"
      >
        LOOK UP
      </button>
    </div>
  );
}
