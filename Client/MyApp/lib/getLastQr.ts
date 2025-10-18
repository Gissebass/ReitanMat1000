// Ultra-simple, Hermes-friendly QR decode: jpeg-js + jsqr
// One decode, small downscale (≈240 px wide), center crop, one jsQR call.

import { fetchImageDataUri, DEFAULT_URL } from "./getLastImage";
import jsQR from "jsqr";
import jpeg from "jpeg-js";

export async function getLastQr(
  url: string = DEFAULT_URL,
  timeoutMs: number = 800
): Promise<string | null> {
  const dataUri = await fetchImageDataUri(url, timeoutMs);
  return decodeQrFromDataUri(dataUri);
}

export async function decodeQrFromDataUri(dataUri: string): Promise<string | null> {
  try {
    // Base64 → bytes
    const base64 = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const jpegBytes = b64ToUint8(base64);

    // JPEG → RGBA (single decode)
    const { data: rgba, width, height } = jpeg.decode(jpegBytes, { useTArray: true });
    if (!rgba || !width || !height) return null;

    // Downscale aggressively to cap work (~240 px width)
    const maxW = 240;
    const scale = width > maxW ? maxW / width : 1;
    const sized = scaleRGBA(rgba, width, height, scale);

    // Center band crop (QR likely near middle in many use-cases)
    const band = cropCenter(sized.data, sized.width, sized.height, 0.60);

    // Single jsQR call; let it try inversion internally
    const input = band.data instanceof Uint8ClampedArray ? band.data : new Uint8ClampedArray(band.data);
    const res = jsQR(input, band.width, band.height, { inversionAttempts: "attemptBoth" });

    return res?.data ?? null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("QR decode error:", err);
    return null;
  }
}

/* ---------------- helpers (tiny + tight) ---------------- */

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
function scaleRGBA(src: Uint8Array, w: number, h: number, s: number) {
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
function cropCenter(src: Uint8Array, w: number, h: number, relH: number) {
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
