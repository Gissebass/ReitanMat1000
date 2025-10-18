// Client/MyApp/lib/getLastImage.ts
import { useEffect, useRef, useState } from "react";

export const DEFAULT_URL = "http://192.168.4.1/capture.jpg";

/** Fetch one JPEG and return a data URI (base64). */
export async function fetchImageDataUri(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" as any });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buf = await res.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    return `data:image/jpeg;base64,${b64}`;
  } finally {
    clearTimeout(to);
  }
}

/** Convert ArrayBuffer → Base64 (RN-safe, no extra deps). */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // @ts-ignore
  return typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

/**
 * Smooth, adaptive pipeline:
 *  - Producer: fetches continuously and fills a tiny queue (jitter buffer).
 *  - Consumer: ticks at targetFps, showing the newest frame (dropping stale ones).
 */
export function useSmoothedImageDataUri(
  url: string = DEFAULT_URL,
  targetFps: number = 20,
  timeoutMs: number = 800,
  bufferMs: number = 120
) {
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const running = useRef(true);
  const queue = useRef<string[]>([]);
  const lastShown = useRef<number>(0);

  useEffect(() => {
    running.current = true;

    // ---- Producer: continuous fetch loop ----
    (async function produce() {
      const maxFrames = Math.max(1, Math.round((bufferMs / 1000) * Math.max(1, targetFps)) + 1);

      while (running.current) {
        try {
          const uri = await fetchImageDataUri(url, timeoutMs);
          if (!running.current) break;

          const q = queue.current;
          q.push(uri);
          if (q.length > maxFrames) q.splice(0, q.length - maxFrames);

          setError(null);
        } catch (e: any) {
          if (!running.current) break;
          setError(e?.message ?? "Fetch failed");
          await new Promise((r) => setTimeout(r, 100));
        }
      }
    })();

    // ---- Consumer: steady display cadence ----
    const intervalMs = Math.max(5, Math.floor(1000 / Math.max(1, targetFps)));
    const consumer = setInterval(() => {
      const q = queue.current;
      if (q.length === 0) return;

      const newest = q[q.length - 1];
      q.length = 0;

      const now = Date.now();
      if (now - lastShown.current >= intervalMs * 0.5) {
        lastShown.current = now;
        setDisplayUri(newest);
      }
    }, intervalMs);

    return () => {
      running.current = false;
      clearInterval(consumer);
      queue.current.length = 0;
    };
  }, [url, targetFps, timeoutMs, bufferMs]);

  return { dataUri: displayUri, error };
}
