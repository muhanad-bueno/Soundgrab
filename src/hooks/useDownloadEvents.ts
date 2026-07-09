import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

export type ProgressMap = Record<string, number>;

export function useDownloadEvents(
  onProgress: (id: string, percent: number) => void,
  onError: (id: string, message: string) => void,
) {
  // stable refs so listeners don't need to re-subscribe on every render
  const onProgressRef = useRef(onProgress);
  const onErrorRef = useRef(onError);
  onProgressRef.current = onProgress;
  onErrorRef.current = onError;

  useEffect(() => {
    const unsubs = [
      listen<{ id: string; percent: number }>("download-progress", (e) =>
        onProgressRef.current(e.payload.id, e.payload.percent)
      ),
      listen<{ id: string; message: string }>("download-error", (e) =>
        onErrorRef.current(e.payload.id, e.payload.message)
      ),
    ];
    return () => {
      unsubs.forEach((p) => p.then((f) => f()));
    };
  }, []);
}
