import { fetchImageDataUri, DEFAULT_URL } from "./getLastImage";
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  HybridBinarizer,
  GlobalHistogramBinarizer,
  BinaryBitmap,
  NotFoundException,
} from "@zxing/library";
import { Canvas, Image as CanvasImage } from "react-native-canvas";

export async function getLastQr(
  url: string = DEFAULT_URL,
  timeoutMs: number = 1200
): Promise<string | null> {
  const dataUri = await fetchImageDataUri(url, timeoutMs);
  return decodeQrFromDataUri(dataUri);
}

export async function decodeQrFromDataUri(dataUri: string): Promise<string | null> {
  // --- draw JPEG into canvas ---
  const baseCanvas = new Canvas();
  const bctx = baseCanvas.getContext("2d");
  const img = new CanvasImage(baseCanvas);
  img.src = dataUri;

  await new Promise<void>((resolve, reject) => {
    img.addEventListener("load", () => resolve());
    img.addEventListener("error", () => reject(new Error("Image load failed")));
  });

  const minBaseW = 1000;
  const baseScale = Math.max(1, Math.ceil(minBaseW / Math.max(1, img.width)));
  const W = img.width * baseScale;
  const H = img.height * baseScale;

  baseCanvas.width = W;
  baseCanvas.height = H;
  (bctx as any).imageSmoothingEnabled = false;
  bctx.drawImage(img as any, 0, 0, W, H);

  const fullRGBA = bctx.getImageData(0, 0, W, H).data;

  // ZXing reader + hints (QR only)
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  // helpful for non-UTF8 content; ZXing often defaults, but we can hint
  hints.set(DecodeHintType.CHARACTER_SET, "utf-8");

  const reader = new MultiFormatReader();
  reader.setHints(hints);

  // ---------- helpers ----------
  const rgbaToLuma = (rgba: Uint8ClampedArray): Uint8ClampedArray => {
    const n = rgba.length / 4;
    const out = new Uint8ClampedArray(n);
    for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
      out[j] = ((rgba[i] * 299 + rgba[i + 1] * 587 + rgba[i + 2] * 114) / 1000) | 0;
    }
    return out;
  };

  const lumaToRGBA = (luma: Uint8ClampedArray): Uint8ClampedArray => {
    const out = new Uint8ClampedArray(luma.length * 4);
    for (let i = 0, j = 0; j < luma.length; j++, i += 4) {
      const v = luma[j];
      out[i] = out[i + 1] = out[i + 2] = v;
      out[i + 3] = 255;
    }
    return out;
  };

  const invertLuma = (luma: Uint8ClampedArray): Uint8ClampedArray => {
    const out = new Uint8ClampedArray(luma.length);
    for (let i = 0; i < luma.length; i++) out[i] = 255 - luma[i];
    return out;
  };

  // mild unsharp mask – keeps QR edges crisp
  const sharpen = (luma: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray => {
    const out = new Uint8ClampedArray(luma.length);
    const idx = (x: number, y: number) => y * w + x;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const v =
          luma[idx(x, y)] * 5 -
          luma[idx(x - 1, y)] -
          luma[idx(x + 1, y)] -
          luma[idx(x, y - 1)] -
          luma[idx(x, y + 1)];
        out[idx(x, y)] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    // copy borders
    for (let x = 0; x < w; x++) {
      out[idx(x, 0)] = luma[idx(x, 0)];
      out[idx(x, h - 1)] = luma[idx(x, h - 1)];
    }
    for (let y = 0; y < h; y++) {
      out[idx(0, y)] = luma[idx(0, y)];
      out[idx(w - 1, y)] = luma[idx(w - 1, y)];
    }
    return out;
  };

  const stretch = (luma: Uint8ClampedArray): Uint8ClampedArray => {
    let lo = 255,
      hi = 0;
    for (let i = 0; i < luma.length; i++) {
      const v = luma[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    if (hi - lo < 16) return luma.slice();
    const scale = 255 / (hi - lo);
    const out = new Uint8ClampedArray(luma.length);
    for (let i = 0; i < luma.length; i++) {
      let v = (luma[i] - lo) * scale;
      out[i] = v < 0 ? 0 : v > 255 ? 255 : (v | 0);
    }
    return out;
  };

  const rotate90 = (rgba: Uint8ClampedArray, w: number, h: number) => {
    const out = new Uint8ClampedArray(rgba.length);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const si = (y * w + x) * 4;
        const nx = y,
          ny = w - 1 - x;
        const di = (ny * h + nx) * 4;
        out[di] = rgba[si];
        out[di + 1] = rgba[si + 1];
        out[di + 2] = rgba[si + 2];
        out[di + 3] = rgba[si + 3];
      }
    return { data: out, width: h, height: w };
  };

  const scaleRGBA = (rgba: Uint8ClampedArray, w: number, h: number, s: number) => {
    if (s === 1) return { data: rgba, width: w, height: h };
    const W2 = Math.max(1, Math.round(w * s));
    const H2 = Math.max(1, Math.round(h * s));
    const out = new Uint8ClampedArray(W2 * H2 * 4);
    for (let y = 0; y < H2; y++) {
      const sy = Math.min(h - 1, Math.floor(y / s));
      for (let x = 0; x < W2; x++) {
        const sx = Math.min(w - 1, Math.floor(x / s));
        const si = (sy * w + sx) * 4,
          di = (y * W2 + x) * 4;
        out[di] = rgba[si];
        out[di + 1] = rgba[si + 1];
        out[di + 2] = rgba[si + 2];
        out[di + 3] = rgba[si + 3];
      }
    }
    return { data: out, width: W2, height: H2 };
  };

  // Try normal + inverted for the given buffer and binarizer
  const tryDecode = (
    rgba: Uint8ClampedArray,
    w: number,
    h: number,
    kind: "hybrid" | "hist"
  ): string | null => {
    // normal
    const nLuma = sharpen(stretch(rgbaToLuma(rgba)), w, h);
    const lumN = new RGBLuminanceSource(lumaToRGBA(nLuma), w, h);
    const bmpN = new BinaryBitmap(
      kind === "hybrid" ? new HybridBinarizer(lumN) : new GlobalHistogramBinarizer(lumN)
    );
    try {
      return reader.decode(bmpN).getText();
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
    }

    // inverted (helps when colors are reversed)
    const iLuma = invertLuma(nLuma);
    const lumI = new RGBLuminanceSource(lumaToRGBA(iLuma), w, h);
    const bmpI = new BinaryBitmap(
      kind === "hybrid" ? new HybridBinarizer(lumI) : new GlobalHistogramBinarizer(lumI)
    );
    try {
      return reader.decode(bmpI).getText();
    } catch (e) {
      if (e instanceof NotFoundException) return null;
      throw e;
    }
  };

  // ----- passes (stop at first hit) -----
  const scales = [1, 1.5, 2]; // try a couple upscales for small QRs
  const binarizers: Array<"hybrid" | "hist"> = ["hybrid", "hist"];

  // Full-frame in four orientations (QRs can be anywhere/any rotation)
  for (const s of scales) {
    const S = scaleRGBA(fullRGBA, W, H, s);

    // 0°, 90°, 180°, 270°
    let buffers = [ { data: S.data, width: S.width, height: S.height } ];
    const r1 = rotate90(S.data, S.width, S.height);
    const r2 = rotate90(r1.data, r1.width, r1.height);
    const r3 = rotate90(r2.data, r2.width, r2.height);
    buffers = buffers.concat([r1, r2, r3]);

    for (const buf of buffers) {
      for (const kind of binarizers) {
        const hit = tryDecode(buf.data, buf.width, buf.height, kind);
        if (hit) return hit;
      }
    }
  }

  // If nothing found
  return null;
}
