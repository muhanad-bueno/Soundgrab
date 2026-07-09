import { useEffect, useRef, useState } from "react";
import { load } from "@tauri-apps/plugin-store";
import { invoke } from "@tauri-apps/api/core";

export interface Settings {
  concurrentDownloads: number;
  concurrentFragments: number;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  defaultFolder: string;
  darkMode: boolean;
}

const DEFAULTS: Settings = {
  concurrentDownloads: 3,
  concurrentFragments: 4,
  embedThumbnail: true,
  embedMetadata: true,
  defaultFolder: "",
  darkMode: false,
};

type StoreInstance = Awaited<ReturnType<typeof load>>;

export function useSettings() {
  const [settings, setSettingsRaw] = useState<Settings>(DEFAULTS);
  const storeRef = useRef<StoreInstance | null>(null);

  useEffect(() => {
    let alive = true;
    load("settings.json", { defaults: DEFAULTS as unknown as Record<string, unknown> }).then(async (store) => {
      if (!alive) return;
      storeRef.current = store;
      const saved: Partial<Settings> = {};
      for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
        const v = await store.get(key);
        if (v !== undefined && v !== null) (saved as Record<string, unknown>)[key] = v;
      }
      const merged = { ...DEFAULTS, ...saved };
      if (alive) {
        setSettingsRaw(merged);
        applyDarkMode(merged.darkMode);
        invoke("set_concurrency", { cap: merged.concurrentDownloads }).catch(() => {});
      }
    });
    return () => { alive = false; };
  }, []);

  function applyDarkMode(dark: boolean) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }

  async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettingsRaw((prev) => ({ ...prev, [key]: value }));
    await storeRef.current?.set(key, value as unknown);

    if (key === "darkMode") applyDarkMode(value as boolean);
    if (key === "concurrentDownloads") {
      invoke("set_concurrency", { cap: value as number }).catch(() => {});
    }
  }

  return { settings, update };
}
