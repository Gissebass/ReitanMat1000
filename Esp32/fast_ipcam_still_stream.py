#!/usr/bin/env python3
"""
Low-latency "stream" from a still JPEG endpoint by decoupling fetch + display.

Requirements:
  pip install opencv-python requests numpy
Usage:
  python fast_ipcam_still_stream.py --url http://192.168.4.1/capture.jpg --target_fps 20
Press 'q' or ESC to quit.
"""

import argparse
import threading
import time
import queue
import requests
import numpy as np
import cv2

def fetcher(url, out_q, stop_evt, connect_timeout=0.5, read_timeout=1.0, target_fps=30.0):
    """
    Fetch frames as fast as possible (or up to target_fps) and push only the newest frame.
    Uses keep-alive session and tiny timeouts to keep latency low.
    """
    session = requests.Session()
    session.headers.update({
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Connection": "keep-alive",
        "User-Agent": "jpeg-poller/1.0",
    })
    period = 1.0 / max(0.1, target_fps)
    t_next = time.time()
    backoff = 0.0

    while not stop_evt.is_set():
        now = time.time()
        if now < t_next:
            # simple pacing to avoid hammering the camera
            time.sleep(min(0.002, t_next - now))  # sleep a couple ms
            continue
        t_next += period

        try:
            r = session.get(url, timeout=(connect_timeout, read_timeout))
            r.raise_for_status()
            arr = np.frombuffer(r.content, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is None:
                raise ValueError("Failed to decode JPEG")

            # Non-blocking put: keep only the latest frame (drop older if queue is full)
            try:
                # Clear any stale frame
                while True:
                    out_q.get_nowait()
            except queue.Empty:
                pass
            out_q.put_nowait(frame)
            backoff = 0.0
        except Exception:
            # brief backoff so we don't spin when the camera blips
            backoff = min(0.5, (backoff + 0.05))
            time.sleep(backoff)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://192.168.4.1/capture.jpg")
    parser.add_argument("--target_fps", type=float, default=20.0, help="Max fetch rate")
    parser.add_argument("--window", default="IP Camera")
    parser.add_argument("--show_fps", action="store_true")
    parser.add_argument("--resize_width", type=int, default=0, help="Resize to this width (0 = no resize)")
    args = parser.parse_args()

    cv2.setUseOptimized(True)  # enable OpenCV micro-optimizations
    cv2.namedWindow(args.window, cv2.WINDOW_NORMAL)

    # Single-slot queue: always display the freshest frame
    q = queue.Queue(maxsize=1)
    stop_evt = threading.Event()
    t = threading.Thread(target=fetcher, daemon=True,
                         args=(args.url, q, stop_evt, 0.5, 1.0, args.target_fps))
    t.start()

    ema_fps = None
    t_prev = time.time()

    try:
        while True:
            try:
                # Wait a short time for a new frame; if none, loop and poll keys
                frame = q.get(timeout=0.2)
            except queue.Empty:
                frame = None

            if frame is not None:
                if args.resize_width and frame.shape[1] > args.resize_width:
                    # Fast linear resize is usually enough; INTER_AREA for downscale quality, but slower.
                    frame = cv2.resize(frame, (args.resize_width, int(frame.shape[0]*args.resize_width/frame.shape[1])))

                if args.show_fps:
                    now = time.time()
                    inst = 1.0 / max(now - t_prev, 1e-6)
                    ema_fps = inst if ema_fps is None else (0.9*ema_fps + 0.1*inst)
                    t_prev = now
                    cv2.putText(frame, f"{ema_fps:.1f} FPS", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2, cv2.LINE_AA)

                cv2.imshow(args.window, frame)

            # Responsive key handling
            key = cv2.waitKey(1) & 0xFF
            if key in (ord('q'), 27):
                break

    finally:
        stop_evt.set()
        t.join(timeout=1.0)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
