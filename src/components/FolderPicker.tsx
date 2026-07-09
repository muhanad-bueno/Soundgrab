import { open } from "@tauri-apps/plugin-dialog";

interface Props {
  value: string;
  onChange: (path: string) => void;
  disabled: boolean;
}

export function FolderPicker({ value, onChange, disabled }: Props) {
  async function pick() {
    const dir = await open({ directory: true, multiple: false });
    if (typeof dir === "string") onChange(dir);
  }

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={pick}
        disabled={disabled}
        className="px-4 py-2 border border-[var(--line)] rounded-lg bg-white text-sm font-[Inter] text-[var(--ink)] hover:border-[var(--ink)] disabled:opacity-40 transition-colors flex-shrink-0"
      >
        Choose folder
      </button>
      <span className="text-sm text-[#6b6860] truncate min-w-0">
        {value || "No folder selected"}
      </span>
    </div>
  );
}
