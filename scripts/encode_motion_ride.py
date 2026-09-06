#!/usr/bin/env python3
"""Encode Pinewick ride stills as 24fps camera-travel film, not Ken Burns holds.

Each output frame is a new perspective sample (dolly / pitch / pan / shake).
The eye should never see a freeze. Original park only — no copied IP.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import time

import numpy as np

IMG = "/workspace/public/images/carnival"
OUT = "/workspace/public/videos/carnival"
SRC_W, SRC_H = 1600, 900
OUT_W, OUT_H = 1280, 720
FPS = 24


def load_rgb(path: str) -> np.ndarray:
    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            path,
            "-vf",
            f"scale={SRC_W}:{SRC_H}:force_original_aspect_ratio=increase,crop={SRC_W}:{SRC_H}",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-frames:v",
            "1",
            "pipe:1",
        ]
    )
    return np.frombuffer(raw, dtype=np.uint8).reshape(SRC_H, SRC_W, 3).copy()


YS, XS = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
CX = (OUT_W - 1) / 2.0
CY = (OUT_H - 1) / 2.0


def sample(img: np.ndarray, sx: np.ndarray, sy: np.ndarray) -> np.ndarray:
    sx = np.clip(sx, 0, SRC_W - 1.001)
    sy = np.clip(sy, 0, SRC_H - 1.001)
    x0 = sx.astype(np.int32)
    y0 = sy.astype(np.int32)
    x1 = np.minimum(x0 + 1, SRC_W - 1)
    y1 = np.minimum(y0 + 1, SRC_H - 1)
    fx = (sx - x0)[..., None]
    fy = (sy - y0)[..., None]
    a = img[y0, x0].astype(np.float32)
    b = img[y0, x1].astype(np.float32)
    c = img[y1, x0].astype(np.float32)
    d = img[y1, x1].astype(np.float32)
    top = a * (1 - fx) + b * fx
    bot = c * (1 - fx) + d * fx
    return top * (1 - fy) + bot * fy


def warp(img: np.ndarray, t: float, kind: str, shake: float, frame: int) -> np.ndarray:
    """t is 0..1 through this still. kind sets camera path."""
    ease = t * t * (3 - 2 * t)
    if kind == "lift":
        amount = 0.14 + ease * 0.98
        persp = 1.0 + (YS / OUT_H) * (0.28 + ease * 0.7)
        panx = 8 * math.sin(t * 2.4)
        pany = -50 - ease * 160
        z = 1.04 + amount * 0.72
    elif kind == "drop":
        amount = ease * 1.35
        persp = 1.0 + (YS / OUT_H) * (0.55 + ease * 1.15)
        panx = 10 * math.sin(t * 9)
        pany = 30 + ease * 160
        z = 1.06 + amount * 0.95
        shake *= 2.4
    elif kind == "rush":
        amount = ease * 1.1
        persp = 1.0 + (YS / OUT_H) * (0.4 + ease * 0.9)
        panx = 4 * math.sin(t * 5)
        pany = ease * 20
        z = 1.05 + amount * 0.85
        shake *= 1.6
    elif kind == "left":
        amount = 0.15 + ease * 0.7
        persp = 1.0 + (YS / OUT_H) * (0.3 + ease * 0.45)
        panx = -20 + ease * 220
        pany = 8 * math.sin(t * 3)
        z = 1.08 + ease * 0.42
        shake *= 1.3
    elif kind == "right":
        amount = 0.15 + ease * 0.7
        persp = 1.0 + (YS / OUT_H) * (0.3 + ease * 0.45)
        panx = 20 - ease * 220
        pany = 8 * math.sin(t * 3)
        z = 1.08 + ease * 0.42
        shake *= 1.3
    elif kind == "up":
        amount = 0.1 + ease * 0.65
        persp = 1.0 + (YS / OUT_H) * (0.18 + ease * 0.35)
        panx = 5 * math.sin(t * 2)
        pany = -20 - ease * 150
        z = 1.04 + amount * 0.4
    elif kind == "down":
        amount = 0.1 + ease * 0.75
        persp = 1.0 + (YS / OUT_H) * (0.25 + ease * 0.55)
        panx = 5 * math.sin(t * 2.2)
        pany = 20 + ease * 150
        z = 1.04 + amount * 0.5
    elif kind == "drift":
        amount = 0.12 + ease * 0.38
        persp = 1.0 + (YS / OUT_H) * (0.2 + 0.15 * math.sin(t * math.pi))
        panx = math.sin(t * math.pi * 2) * 70
        pany = math.cos(t * math.pi * 2) * 28
        z = 1.08 + 0.12 * math.sin(t * math.pi)
        shake *= 0.45
    elif kind == "spin":
        amount = 0.2 + 0.15 * math.sin(t * math.pi * 2)
        persp = 1.0 + (YS / OUT_H) * 0.28
        panx = -30 + ease * 260
        pany = math.sin(t * math.pi * 6) * 36
        z = 1.1 + 0.08 * math.sin(t * math.pi * 2)
        shake *= 0.35
    elif kind == "channel":
        amount = 0.15 + ease * 0.85
        persp = 1.0 + (YS / OUT_H) * (0.35 + ease * 0.7)
        panx = math.sin(t * math.pi * 2) * 55
        pany = 10 + ease * 30
        z = 1.05 + amount * 0.62
        shake *= 0.7
    else:  # zin
        amount = 0.12 + ease * 0.7
        persp = 1.0 + (YS / OUT_H) * (0.25 + ease * 0.5)
        panx = 8 * math.sin(t * 3.1)
        pany = 6 * math.cos(t * 2.2)
        z = 1.04 + amount * 0.55

    jx = shake * 7 * math.sin(frame * 0.73) + shake * 3 * math.sin(frame * 1.9)
    jy = shake * 5 * math.cos(frame * 0.61) + shake * 2 * math.sin(frame * 2.4)
    sx = (XS - CX - jx) * persp / z + SRC_W / 2.0 + panx
    sy = (YS - CY - jy) * persp / z + SRC_H / 2.0 + pany
    return sample(img, sx, sy)


RIDES = {
    "coaster": [
        ("carnival-coaster-dispatch.jpg", 8.0, "zin", 0.25),
        ("carnival-coaster-chain.jpg", 16.0, "lift", 0.45),
        ("carnival-coaster-lift.jpg", 16.0, "lift", 0.5),
        ("carnival-coaster-lift-mid.jpg", 15.0, "lift", 0.55),
        ("carnival-coaster-lift-high.jpg", 13.0, "lift", 0.5),
        ("carnival-coaster-hang.jpg", 8.0, "zin", 0.2),
        ("carnival-coaster-crest.jpg", 5.0, "zin", 0.15),
        ("carnival-coaster-drop.jpg", 4.0, "drop", 1.0),
        ("carnival-coaster-drop-mid.jpg", 3.5, "drop", 1.15),
        ("carnival-coaster-plunge.jpg", 3.5, "drop", 1.2),
        ("carnival-coaster-valley.jpg", 6.5, "rush", 0.85),
        ("carnival-coaster-airtime.jpg", 6.0, "up", 0.4),
        ("carnival-coaster-camel.jpg", 7.0, "zin", 0.55),
        ("carnival-coaster-bank.jpg", 8.0, "left", 0.7),
        ("carnival-coaster-turn.jpg", 8.0, "left", 0.75),
        ("carnival-coaster-helix.jpg", 9.0, "left", 0.8),
        ("carnival-coaster-portal.jpg", 4.5, "rush", 0.7),
        ("carnival-coaster-tunnel.jpg", 6.5, "rush", 0.95),
        ("carnival-coaster-tunnel-mid.jpg", 5.5, "rush", 1.0),
        ("carnival-coaster-tunnel-exit.jpg", 4.5, "zin", 0.55),
        ("carnival-coaster-climbout.jpg", 7.0, "up", 0.45),
        ("carnival-coaster-brakerun.jpg", 9.0, "zin", 0.3),
        ("carnival-coaster-brakes.jpg", 7.0, "zin", 0.2),
        ("carnival-coaster-home.jpg", 8.0, "zin", 0.15),
    ],
    "flume": [
        ("carnival-flume-push.jpg", 10.0, "channel", 0.2),
        ("carnival-flume-log.jpg", 12.0, "channel", 0.25),
        ("carnival-flume-willow.jpg", 16.0, "channel", 0.3),
        ("carnival-flume-current.jpg", 14.0, "channel", 0.35),
        ("carnival-flume-camp.jpg", 14.0, "left", 0.25),
        ("carnival-flume-miners.jpg", 12.0, "right", 0.25),
        ("carnival-flume-rocks.jpg", 11.0, "channel", 0.4),
        ("carnival-flume-bend.jpg", 11.0, "left", 0.35),
        ("carnival-flume-lift.jpg", 18.0, "lift", 0.3),
        ("carnival-flume-lift-mid.jpg", 16.0, "lift", 0.35),
        ("carnival-flume-crest.jpg", 7.0, "zin", 0.2),
        ("carnival-flume-tunnel.jpg", 9.0, "rush", 0.45),
        ("carnival-flume-tunnel-mid.jpg", 8.0, "rush", 0.5),
        ("carnival-flume-drop.jpg", 4.5, "drop", 0.9),
        ("carnival-flume-splash.jpg", 6.0, "drop", 0.7),
        ("carnival-flume-pond.jpg", 10.0, "channel", 0.25),
        ("carnival-flume-after.jpg", 12.0, "channel", 0.2),
        ("carnival-flume-home.jpg", 12.0, "zin", 0.15),
    ],
    "hollow": [
        ("carnival-hollow-push.jpg", 10.0, "channel", 0.15),
        ("carnival-hollow-porch.jpg", 16.0, "zin", 0.12),
        ("carnival-hollow-porch-pass.jpg", 12.0, "left", 0.18),
        ("carnival-hollow-creek.jpg", 16.0, "channel", 0.2),
        ("carnival-hollow-creek-mid.jpg", 14.0, "channel", 0.22),
        ("carnival-hollow-bend.jpg", 12.0, "left", 0.2),
        ("carnival-hollow-raccoon.jpg", 14.0, "zin", 0.12),
        ("carnival-hollow-raccoon-close.jpg", 10.0, "zin", 0.1),
        ("carnival-hollow-wolves.jpg", 14.0, "zin", 0.12),
        ("carnival-hollow-wolves-close.jpg", 10.0, "zin", 0.1),
        ("carnival-hollow-neighbor.jpg", 12.0, "channel", 0.18),
        ("carnival-hollow-lane.jpg", 12.0, "channel", 0.2),
        ("carnival-hollow-quiet.jpg", 12.0, "drift", 0.1),
        ("carnival-hollow-fireflies.jpg", 16.0, "drift", 0.12),
        ("carnival-hollow-firefly-field.jpg", 18.0, "drift", 0.12),
        ("carnival-hollow-home.jpg", 12.0, "zin", 0.1),
    ],
    "wheel": [
        ("carnival-wheel-board.jpg", 10.0, "zin", 0.12),
        ("carnival-wheel-ground.jpg", 10.0, "up", 0.18),
        ("carnival-wheel-rise-low.jpg", 14.0, "up", 0.22),
        ("carnival-wheel-rise-mid.jpg", 14.0, "up", 0.22),
        ("carnival-wheel.jpg", 12.0, "up", 0.2),
        ("carnival-wheel-rise-high.jpg", 12.0, "up", 0.2),
        ("carnival-wheel-top.jpg", 12.0, "drift", 0.1),
        ("carnival-wheel-top-around.jpg", 14.0, "left", 0.15),
        ("carnival-wheel-side.jpg", 12.0, "right", 0.18),
        ("carnival-wheel-far.jpg", 12.0, "right", 0.18),
        ("carnival-wheel-descent-mid.jpg", 12.0, "down", 0.22),
        ("carnival-wheel-descent.jpg", 12.0, "down", 0.22),
        ("carnival-wheel-booths.jpg", 12.0, "down", 0.2),
        ("carnival-wheel-queues.jpg", 12.0, "down", 0.18),
        ("carnival-wheel-ground.jpg", 10.0, "zin", 0.12),
        ("carnival-wheel-second.jpg", 12.0, "up", 0.2),
        ("carnival-wheel-rise-mid.jpg", 12.0, "up", 0.2),
        ("carnival-wheel-top-around.jpg", 12.0, "left", 0.15),
    ],
    "carousel": [
        ("carnival-carousel-ride.jpg", 12.0, "spin", 0.2),
        ("carnival-carousel-pole.jpg", 12.0, "spin", 0.18),
        ("carnival-carousel-high.jpg", 10.0, "up", 0.25),
        ("carnival-carousel-fox.jpg", 12.0, "spin", 0.2),
        ("carnival-carousel.jpg", 12.0, "spin", 0.22),
        ("carnival-carousel-stag.jpg", 12.0, "spin", 0.2),
        ("carnival-carousel-mirrors.jpg", 12.0, "spin", 0.16),
        ("carnival-carousel-canopy.jpg", 10.0, "up", 0.15),
        ("carnival-carousel-out.jpg", 12.0, "spin", 0.22),
        ("carnival-carousel-crowd.jpg", 10.0, "left", 0.18),
        ("carnival-carousel-low.jpg", 10.0, "down", 0.25),
        ("carnival-carousel-ride.jpg", 12.0, "spin", 0.2),
        ("carnival-carousel-fox.jpg", 12.0, "spin", 0.2),
        ("carnival-carousel-out.jpg", 12.0, "spin", 0.22),
        ("carnival-carousel-high.jpg", 10.0, "up", 0.25),
        ("carnival-carousel.jpg", 12.0, "spin", 0.22),
        ("carnival-carousel-pole.jpg", 12.0, "spin", 0.18),
        ("carnival-carousel-stag.jpg", 12.0, "spin", 0.2),
    ],
}


def encode(ride: str) -> None:
    segs = RIDES[ride]
    fade = 10
    dest = os.path.join(OUT, f"{ride}.mp4")
    tmp = f"/tmp/{ride}-motion.mp4"
    os.makedirs(OUT, exist_ok=True)
    for name, *_ in segs:
        path = os.path.join(IMG, name)
        if not os.path.isfile(path):
            raise SystemExit(f"missing {path}")

    ff = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{OUT_W}x{OUT_H}",
            "-r",
            str(FPS),
            "-i",
            "pipe:0",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            tmp,
        ],
        stdin=subprocess.PIPE,
    )
    assert ff.stdin is not None

    cache: dict[str, np.ndarray] = {}

    def get(name: str) -> np.ndarray:
        if name not in cache:
            cache.clear()
            cache[name] = load_rgb(os.path.join(IMG, name))
        return cache[name]

    prev = None
    total = 0
    t0 = time.time()
    nseg = len(segs)
    for i, (name, seconds, kind, shake) in enumerate(segs):
        img = get(name)
        nxt = get(segs[i + 1][0]) if i + 1 < nseg else None
        nkind = segs[i + 1][2] if i + 1 < nseg else kind
        nshake = segs[i + 1][3] if i + 1 < nseg else shake
        frames = max(int(round(seconds * FPS)), fade + 2)
        print(f"{ride} {i + 1}/{nseg} {name} {seconds}s {kind}", flush=True)
        for f in range(frames):
            t = f / max(frames - 1, 1)
            frame = warp(img, t, kind, shake, total)
            if nxt is not None and f >= frames - fade:
                a = (f - (frames - fade)) / fade
                blend = warp(nxt, a * 0.18, nkind, nshake, total)
                frame = frame * (1 - a) + blend * a
            if prev is not None:
                # motion blur: keep a tail so the picture never freezes
                blur = 0.38 if kind in ("drop", "rush") else 0.28
                frame = frame * (1 - blur) + prev * blur
            out = np.clip(frame, 0, 255).astype(np.uint8)
            ff.stdin.write(out.tobytes())
            prev = frame
            total += 1
    ff.stdin.close()
    code = ff.wait()
    if code != 0:
        raise SystemExit(f"ffmpeg failed {code}")
    elapsed = time.time() - t0
    os.replace(tmp, dest)
    print(f"{ride} wrote {dest} frames={total} sec={total / FPS:.2f} encode={elapsed:.1f}s")


if __name__ == "__main__":
    names = sys.argv[1:] or ["coaster"]
    for name in names:
        if name not in RIDES:
            raise SystemExit(f"unknown ride {name}")
        encode(name)
