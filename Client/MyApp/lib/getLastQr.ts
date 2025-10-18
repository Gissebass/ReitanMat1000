import { fetchImageDataUri, DEFAULT_URL } from "./getLastImage";
import jsQR from "jsqr";
import jpeg from "jpeg-js";

export async function getLastQr(
  url: string = DEFAULT_URL,
  timeoutMs: number = 1200
): Promise<string | null> {
  const dataUri = await fetchImageDataUri(url, timeoutMs);
  return decodeQrFromDataUri(dataUri);
}

/** Hermes-friendly, two-stage QR decoder. Never throws; returns null if not found. */
export async function decodeQrFromDataUri(dataUri: string): Promise<string | null> {
  try {
    // 1) Base64 → bytes
    const base64 = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const jpegBytes = b64ToUint8(base64);

    // 2) JPEG → RGBA pixels (single decode per frame)
    const { data: rgba, width, height } = jpeg.decode(jpegBytes, { useTArray: true });

    // ---------------- FAST PATH (cheap) ----------------
    // Downscale to ~320 px wide, then center-crop ~60% of height.
    const fastMaxW = 320;
    const fastScale = width > fastMaxW ? fastMaxW / width : 1;
    const fastImg = scaleRGBA(rgba, width, height, fastScale);
    const center = cropCenter(fastImg.data, fastImg.width, fastImg.height, 0.60);

    const hitFast = runJsQR(center.data, center.width, center.height);
    if (hitFast) return hitFast;

    // yield to UI so we don't block
    await yieldToUI();

    // ---------------- FALLBACK PATH (heavier) ----------------
    // Slightly bigger image, try 0° and 90°. Avoid rotations if not needed.
    const slowMaxW = 480;
    const slowScale = width > slowMaxW ? slowMaxW / width : 1;
    const slowImg = scaleRGBA(rgba, width, height, slowScale);

    // 0°
    const hit0 = runJsQR(slowImg.data, slowImg.width, slowImg.height);
    if (hit0) return hit0;

    // yield again before another pass
    await yieldToUI();

    // 90°
    const rot = rotateRGBA(slowImg.data, slowImg.width, slowImg.height, 90);
    const hit90 = runJsQR(rot.data, rot.width, rot.height);
    if (hit90) return hit90;

    return null;
  } catch (err) {
    console.warn("QR decode unexpected error:", err);
    return null;
  }
}

/* ---------------- helpers ---------------- */

function runJsQR(rgba: Uint8Array, w: number, h: number): string | null {
  const input = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba);
  const res = jsQR(input, w, h, { inversionAttempts: "attemptBoth" });
  return res?.data ?? null;
}

function b64ToUint8(b64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  let bufferLength = b64.length * 0.75;
  if (b64.endsWith("==")) bufferLength -= 2;
  else if (b64.endsWith("=")) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const e1 = lookup[b64.charCodeAt(i)];
    const e2 = lookup[b64.charCodeAt(i + 1)];
    const e3 = lookup[b64.charCodeAt(i + 2)];
    const e4 = lookup[b64.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (!Number.isNaN(e3)) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (!Number.isNaN(e4)) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

/** Nearest-neighbor scale for RGBA */
function scaleRGBA(
  src: Uint8Array,
  w: number,
  h: number,
  s: number
): { data: Uint8Array; width: number; height: number } {
  if (s === 1) return { data: src, width: w, height: h };
  const W2 = Math.max(1, Math.round(w * s));
  const H2 = Math.max(1, Math.round(h * s));
  const out = new Uint8Array(W2 * H2 * 4);
  for (let y = 0; y < H2; y++) {
    const sy = Math.min(h - 1, Math.floor(y / s));
    for (let x = 0; x < W2; x++) {
      const sx = Math.min(w - 1, Math.floor(x / s));
      const si = (sy * w + sx) * 4;
      const di = (y * W2 + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return { data: out, width: W2, height: H2 };
}

/** Crop vertical center band with relative height relH (0..1) */
function cropCenter(
  src: Uint8Array,
  w: number,
  h: number,
  relH: number
): { data: Uint8Array; width: number; height: number } {
  const bandH = Math.max(8, Math.floor(h * relH));
  const y0 = Math.max(0, Math.floor((h - bandH) / 2));
  const out = new Uint8Array(w * bandH * 4);
  for (let y = 0; y < bandH; y++) {
    const si = (y0 + y) * w * 4;
    const di = y * w * 4;
    out.set(src.subarray(si, si + w * 4), di);
  }
  return { data: out, width: w, height: bandH };
}

/** Rotate RGBA by 0/90/180/270 degrees */
type Rotation = 0 | 90 | 180 | 270;
function rotateRGBA(
  src: Uint8Array,
  w: number,
  h: number,
  rot: Rotation
): { data: Uint8Array; width: number; height: number } {
  if (rot === 0) return { data: src, width: w, height: h };
  if (rot === 180) {
    const out = new Uint8Array(src.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4;
      const nx = w - 1 - x, ny = h - 1 - y;
      const di = (ny * w + nx) * 4;
      out[di] = src[si]; out[di + 1] = src[si + 1]; out[di + 2] = src[si + 2]; out[di + 3] = src[si + 3];
    }
    return { data: out, width: w, height: h };
  }
  // 90 or 270
  const out = new Uint8Array(src.length);
  const W2 = h, H2 = w;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = (y * w + x) * 4;
    let nx: number, ny: number;
    if (rot === 90) { nx = y; ny = w - 1 - x; }
    else { nx = h - 1 - y; ny = x; } // 270
    const di = (ny * W2 + nx) * 4;
    out[di] = src[si]; out[di + 1] = src[si + 1]; out[di + 2] = src[si + 2]; out[di + 3] = src[si + 3];
  }
  return { data: out, width: W2, height: H2 };
}

/** Yield control so UI can update before heavier work */
function yieldToUI() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}
