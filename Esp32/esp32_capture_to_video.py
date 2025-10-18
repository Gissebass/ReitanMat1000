import argparse
import time
from pathlib import Path

import cv2
import numpy as np
import requests

def fetch_jpeg(url: str, timeout: float = 1.5) -> np.ndarray | None:
    """
    Fetch a single JPEG and return a decoded BGR image (numpy array) or None on failure.
    """
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        img_array = np.frombuffer(r.content, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if frame is None:
            return None
        return frame
    except requests.RequestException:
        return None

def pick_fourcc(codec: str) -> int:
    codec = codec.lower()
    if codec == "mp4v":
        return cv2.VideoWriter_fourcc(*"mp4v")
    if codec == "xvid":
        return cv2.VideoWriter_fourcc(*"XVID")
    if codec == "mjpg" or codec == "mjpeg":
        return cv2.VideoWriter_fourcc(*"MJPG")
    # default
    return cv2.VideoWriter_fourcc(*"mp4v")

def main():
    parser = argparse.ArgumentParser(description="Fetch ESP32-CAM JPEGs and save as video.")
    parser.add_argument("--url", default="http://192.168.4.1/capture.jpg",
                        help="Capture URL (default: http://192.168.4.1/capture.jpg)")
    parser.add_argument("--fps", type=float, default=10.0, help="Target frames per second (default: 10)")
    parser.add_argument("--seconds", type=float, default=30.0, help="Duration to capture in seconds (default: 30)")
    parser.add_argument("--out", default="capture.mp4", help="Output video filename (default: capture.mp4)")
    parser.add_argument("--codec", default="mp4v", choices=["mp4v", "xvid", "mjpg"],
                        help="Video codec: mp4v (MP4), xvid (AVI), mjpg (AVI). Default: mp4v")
    parser.add_argument("--timeout", type=float, default=1.5, help="Per-request timeout in seconds (default: 1.5)")
    parser.add_argument("--resize", type=str, default="", help='Optional WxH resize, e.g. "1280x720"')
    parser.add_argument("--verbose", action="store_true", help="Print per-frame status")
    args = parser.parse_args()

    # Pre-fetch first frame to get dimensions (and verify connectivity)
    print(f"Fetching first frame from {args.url} ...")
    first = fetch_jpeg(args.url, timeout=args.timeout)
    if first is None:
        print("ERROR: Could not fetch the first frame. Check the ESP32-CAM AP and URL.")
        return

    # Determine output size
    if args.resize:
        try:
            w_str, h_str = args.resize.lower().split("x")
            out_w, out_h = int(w_str), int(h_str)
        except Exception:
            print('ERROR: --resize must be like "1280x720"')
            return
        frame_size = (out_w, out_h)
        frame_to_write = cv2.resize(first, frame_size, interpolation=cv2.INTER_LINEAR)
    else:
        h, w = first.shape[:2]
        frame_size = (w, h)
        frame_to_write = first

    # Setup VideoWriter
    out_path = Path(args.out)
    fourcc = pick_fourcc(args.codec)

    # If mp4v, ensure extension looks like .mp4; if mjpg/xvid, .avi is conventional
    if args.codec in {"mjpg", "xvid"} and out_path.suffix.lower() != ".avi":
        print("Note: For 'mjpg' or 'xvid', consider using an .avi extension for better compatibility.")

    writer = cv2.VideoWriter(str(out_path), fourcc, args.fps, frame_size)
    if not writer.isOpened():
        print("ERROR: Failed to open VideoWriter. Try a different --codec (e.g., mjpg) or change the extension.")
        return

    total_frames = int(round(args.seconds * args.fps))
    print(f"Writing {total_frames} frames at {args.fps:.3f} FPS to {out_path} ({frame_size[0]}x{frame_size[1]}), codec={args.codec}")

    # Timing loop: fixed-step scheduler
    start = time.perf_counter()
    next_tick = start
    last_good = frame_to_write.copy()

    # Write first frame immediately so the video starts without delay
    writer.write(frame_to_write)

    for i in range(1, total_frames):
        next_tick += 1.0 / args.fps
        # Attempt fetch
        frame = fetch_jpeg(args.url, timeout=args.timeout)

        if frame is None:
            # On failure, freeze the last frame to keep timing consistent
            frame_to_write = last_good
            if args.verbose:
                print(f"[{i:05d}] fetch FAILED -> repeating last frame")
        else:
            # Resize if requested
            if frame_size != (frame.shape[1], frame.shape[0]):
                frame = cv2.resize(frame, frame_size, interpolation=cv2.INTER_LINEAR)
            frame_to_write = frame
            last_good = frame_to_write

            if args.verbose:
                dt = time.perf_counter() - start
                print(f"[{i:05d}] ok @ t={dt:.3f}s")

        writer.write(frame_to_write)

        # Sleep until the next tick (can be 0 if we’re late)
        now = time.perf_counter()
        sleep_s = next_tick - now
        if sleep_s > 0:
            time.sleep(sleep_s)
        # if sleep_s <= 0, we’re behind schedule; continue immediately

    writer.release()
    elapsed = time.perf_counter() - start
    print(f"Done. Wrote {total_frames} frames in {elapsed:.2f}s -> {out_path}")

if __name__ == "__main__":
    main()
