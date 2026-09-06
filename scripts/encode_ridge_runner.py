#!/usr/bin/env python3
"""Ridge Runner only: continuous on-ride POV + original sound bed.

Stills are waypoints on one unbroken camera path (speed / pitch / roll / shake).
The picture never parks on a photograph. Audio is original synthesis — no ripped
YouTube soundtrack. Pinewick layout only.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import time
import wave

import numpy as np

IMG = "/workspace/public/images/carnival"
OUT = "/workspace/public/videos/carnival"
SRC_W, SRC_H = 1600, 900
OUT_W, OUT_H = 1280, 720
FPS = 24
SR = 44100

# Overlapping waypoints: (file, start_s, end_s, kind)
# kind only biases the still's local travel, not the physics clock.
WAYPOINTS = [
    ("carnival-coaster-dispatch.jpg", 0.0, 6.2, "roll"),
    ("carnival-coaster-chain.jpg", 4.4, 14.2, "lift"),
    ("carnival-coaster-lift.jpg", 11.8, 25.0, "lift"),
    ("carnival-coaster-lift-mid.jpg", 22.4, 35.6, "lift"),
    ("carnival-coaster-lift-high.jpg", 32.8, 44.0, "lift"),
    ("carnival-coaster-hang.jpg", 41.6, 47.2, "hang"),
    ("carnival-coaster-crest.jpg", 45.4, 49.4, "crest"),
    ("carnival-coaster-drop.jpg", 47.8, 52.2, "drop"),
    ("carnival-coaster-drop-mid.jpg", 50.4, 54.4, "drop"),
    ("carnival-coaster-plunge.jpg", 52.6, 56.4, "drop"),
    ("carnival-coaster-valley.jpg", 54.8, 61.2, "rush"),
    ("carnival-coaster-airtime.jpg", 59.0, 65.4, "air"),
    ("carnival-coaster-camel.jpg", 63.2, 70.0, "rush"),
    ("carnival-coaster-bank.jpg", 67.6, 75.4, "bank"),
    ("carnival-coaster-turn.jpg", 73.0, 80.8, "bank"),
    ("carnival-coaster-helix.jpg", 78.4, 86.6, "helix"),
    ("carnival-coaster-portal.jpg", 84.4, 89.6, "rush"),
    ("carnival-coaster-tunnel.jpg", 87.6, 93.6, "tunnel"),
    ("carnival-coaster-tunnel-mid.jpg", 91.2, 96.8, "tunnel"),
    ("carnival-coaster-tunnel-exit.jpg", 94.8, 99.6, "rush"),
    ("carnival-coaster-climbout.jpg", 97.6, 104.8, "air"),
    ("carnival-coaster-brakerun.jpg", 102.4, 111.2, "brake"),
    ("carnival-coaster-brakes.jpg", 108.6, 115.4, "brake"),
    ("carnival-coaster-home.jpg", 113.0, 120.0, "home"),
]

DURATION = 120.0

# Ride physics keys: (t, speed 0-1, pitch -1..1 look down/up, roll -1..1)
PHYSICS = [
    (0.0, 0.16, 0.02, 0.00),
    (2.4, 0.22, 0.04, 0.02),
    (5.0, 0.20, 0.08, 0.00),
    (8.0, 0.15, 0.18, 0.00),
    (14.0, 0.13, 0.30, 0.00),
    (24.0, 0.12, 0.36, 0.01),
    (34.0, 0.12, 0.40, 0.00),
    (42.0, 0.11, 0.28, 0.00),
    (45.8, 0.10, 0.06, 0.00),
    (47.6, 0.14, -0.08, 0.02),
    (48.6, 0.42, -0.38, 0.04),
    (50.4, 0.88, -0.58, 0.06),
    (52.8, 1.00, -0.42, 0.03),
    (55.6, 0.92, -0.08, -0.08),
    (59.4, 0.78, 0.22, 0.04),
    (63.2, 0.70, 0.16, 0.02),
    (67.0, 0.80, 0.04, -0.22),
    (71.4, 0.84, 0.00, -0.42),
    (75.8, 0.82, 0.02, -0.28),
    (80.4, 0.86, 0.00, -0.46),
    (84.8, 0.80, -0.06, -0.18),
    (88.6, 0.90, -0.04, 0.06),
    (93.0, 0.88, 0.00, 0.04),
    (97.2, 0.74, 0.10, 0.00),
    (101.6, 0.48, 0.18, 0.00),
    (106.4, 0.28, 0.06, 0.00),
    (111.2, 0.14, 0.02, 0.00),
    (116.0, 0.08, 0.00, 0.00),
    (120.0, 0.04, 0.00, 0.00),
]


def lerp_keys(keys: list[tuple], t: float) -> tuple[float, ...]:
    if t <= keys[0][0]:
        return keys[0][1:]
    if t >= keys[-1][0]:
        return keys[-1][1:]
    for i in range(1, len(keys)):
        t1, *a = keys[i]
        t0, *b = keys[i - 1]
        if t <= t1:
            u = (t - t0) / (t1 - t0)
            u = u * u * (3 - 2 * u)
            return tuple(p + (q - p) * u for p, q in zip(b, a))
    return keys[-1][1:]


def ride_state(t: float) -> tuple[float, float, float]:
    speed, pitch, roll = lerp_keys(PHYSICS, t)
    return float(speed), float(pitch), float(roll)


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
YNORM = YS / OUT_H


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
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def still_travel(kind: str, u: float, speed: float) -> tuple[float, float, float, float]:
    """Local dolly through one still. u is 0..1 and must keep moving — no ease-out."""
    if kind == "lift":
        z = 1.06 + u * (0.42 + speed * 0.08)
        persp = 0.22 + u * 0.38
        panx = 6 * math.sin(u * 2.1)
        pany = -36 - u * 118
    elif kind == "hang":
        z = 1.08 + u * 0.22
        persp = 0.18 + u * 0.16
        panx = 10 * math.sin(u * 3.2)
        pany = -8 + u * 24
    elif kind == "crest":
        z = 1.10 + u * 0.38
        persp = 0.28 + u * 0.55
        panx = 8 * math.sin(u * 4)
        pany = 18 + u * 90
    elif kind == "drop":
        z = 1.12 + u * (0.95 + speed * 0.35)
        persp = 0.42 + u * 1.05
        panx = 14 * math.sin(u * 11)
        pany = 40 + u * 170
    elif kind == "rush":
        z = 1.10 + u * (0.62 + speed * 0.28)
        persp = 0.32 + u * 0.72
        panx = 7 * math.sin(u * 5.4)
        pany = 8 + u * 28
    elif kind == "air":
        z = 1.08 + u * 0.40
        persp = 0.20 + u * 0.28
        panx = 5 * math.sin(u * 2.6)
        pany = -18 - u * 96
    elif kind == "bank":
        z = 1.10 + u * 0.48
        persp = 0.28 + u * 0.40
        panx = -28 + u * 210
        pany = 10 * math.sin(u * 3)
    elif kind == "helix":
        z = 1.12 + u * 0.55
        persp = 0.30 + u * 0.50
        panx = -40 + u * 240
        pany = 12 * math.sin(u * 4.2)
    elif kind == "tunnel":
        z = 1.14 + u * (0.78 + speed * 0.2)
        persp = 0.38 + u * 0.85
        panx = 6 * math.sin(u * 6)
        pany = 6 + u * 18
    elif kind == "brake":
        z = 1.07 + u * 0.26
        persp = 0.16 + u * 0.14
        panx = 5 * math.sin(u * 2)
        pany = 4 * math.cos(u * 1.6)
    elif kind == "home":
        z = 1.05 + u * 0.16
        persp = 0.12 + u * 0.08
        panx = 4 * math.sin(u * 1.4)
        pany = 2
    else:  # roll / dispatch
        z = 1.06 + u * 0.28
        persp = 0.18 + u * 0.22
        panx = 9 * math.sin(u * 2.8)
        pany = 4 * math.cos(u * 2.1)
    return z, persp, panx, pany


def warp(
    img: np.ndarray,
    z: float,
    persp_amt: float,
    panx: float,
    pany: float,
    roll: float,
    jx: float,
    jy: float,
) -> np.ndarray:
    persp = 1.0 + YNORM * persp_amt
    dx = (XS - CX - jx) * persp
    dy = (YS - CY - jy) * persp
    if abs(roll) > 0.002:
        c = math.cos(roll)
        s = math.sin(roll)
        rx = dx * c - dy * s
        ry = dx * s + dy * c
        dx, dy = rx, ry
    sx = dx / z + SRC_W / 2.0 + panx
    sy = dy / z + SRC_H / 2.0 + pany
    return sample(img, sx, sy)


def active_waypoints(t: float) -> list[tuple[int, float]]:
    hits = []
    for i, (_name, t0, t1, _kind) in enumerate(WAYPOINTS):
        if t0 <= t <= t1:
            u = (t - t0) / max(t1 - t0, 0.001)
            hits.append((i, min(max(u, 0.0), 1.0)))
    if hits:
        return hits
    # hold last / first if clock ever undershoots
    if t < WAYPOINTS[0][1]:
        return [(0, 0.0)]
    return [(len(WAYPOINTS) - 1, 1.0)]


def encode_video(dest_video: str) -> int:
    cache: dict[str, np.ndarray] = {}
    for name, *_ in WAYPOINTS:
        path = os.path.join(IMG, name)
        if not os.path.isfile(path):
            raise SystemExit(f"missing {path}")
        print(f"load {name}", flush=True)
        cache[name] = load_rgb(path)

    tmp = "/tmp/ridge-runner-video.mp4"
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

    frames = int(round(DURATION * FPS))
    prev = None
    t0 = time.time()
    for n in range(frames):
        t = n / FPS
        speed, pitch, roll = ride_state(t)
        shake = 0.18 + speed * 1.35
        # wooden chatter ~11 Hz plus a slower sway
        jx = shake * 6.2 * math.sin(n * 0.79) + shake * 2.4 * math.sin(n * 2.05)
        jy = shake * 4.6 * math.cos(n * 0.67) + shake * 1.8 * math.sin(n * 2.51)
        roll_rad = roll * 0.38 + 0.018 * math.sin(n * 0.11) * (0.4 + speed)

        layers = []
        weights = []
        for idx, u in active_waypoints(t):
            name, _a, _b, kind = WAYPOINTS[idx]
            z, persp, panx, pany = still_travel(kind, u, speed)
            pany += -pitch * 120
            panx += 16 * math.sin(t * 1.15) * (0.25 + speed * 0.6)
            frame = warp(cache[name], z, persp, panx, pany, roll_rad, jx, jy)
            # raised-cosine weight so two stills always mix in the overlap
            w = 0.5 - 0.5 * math.cos(math.pi * min(max(u, 0.0), 1.0))
            if u < 0.18:
                w = max(w, u / 0.18)
            if u > 0.82:
                w = max(w, (1 - u) / 0.18)
            w = max(w, 0.12)
            layers.append(frame)
            weights.append(w)
        wsum = sum(weights) or 1.0
        acc = layers[0] * (weights[0] / wsum)
        for layer, w in zip(layers[1:], weights[1:]):
            acc = acc + layer * (w / wsum)

        # extra rush sample: look a hair farther down the track at speed
        if speed > 0.45 and layers:
            name, _a, _b, kind = WAYPOINTS[active_waypoints(t)[0][0]]
            u = min(active_waypoints(t)[0][1] + 0.08 + speed * 0.06, 1.0)
            z, persp, panx, pany = still_travel(kind, u, speed)
            rush = warp(cache[name], z * 1.06, persp + 0.12, panx, pany - pitch * 120, roll_rad, jx, jy)
            mix = 0.16 + 0.22 * speed
            acc = acc * (1 - mix) + rush * mix

        blur = 0.16 + speed * 0.42
        if prev is not None:
            acc = acc * (1 - blur) + prev * blur
        out = np.clip(acc, 0, 255).astype(np.uint8)
        ff.stdin.write(out.tobytes())
        prev = acc
        if n % 48 == 0:
            elapsed = time.time() - t0
            fps = (n + 1) / max(elapsed, 0.01)
            print(f"frame {n}/{frames} t={t:.1f}s speed={speed:.2f} render={fps:.1f}fps", flush=True)

    ff.stdin.close()
    code = ff.wait()
    if code != 0:
        raise SystemExit(f"ffmpeg video failed {code}")
    os.replace(tmp, dest_video)
    print(f"video {dest_video} frames={frames} sec={frames / FPS:.2f}", flush=True)
    return frames


def fft_shape(x: np.ndarray, gain_fn) -> np.ndarray:
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(x.size, 1 / SR)
    spec = spec * gain_fn(freqs)
    y = np.fft.irfft(spec, n=x.size)
    return y.astype(np.float32)


def env_at(times: np.ndarray, keys: list[tuple[float, float]]) -> np.ndarray:
    xp = np.array([k[0] for k in keys], dtype=np.float32)
    fp = np.array([k[1] for k in keys], dtype=np.float32)
    return np.interp(times, xp, fp).astype(np.float32)


def make_whoop(dur: float, gender: str, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = max(int(dur * SR), 8)
    t = np.arange(n, dtype=np.float32) / SR
    if gender == "w":
        f0a, f0b, f0c = rng.uniform(280, 340), rng.uniform(520, 740), rng.uniform(300, 380)
        f1, f2 = 720.0, 2250.0
        bright = 0.22
    else:
        f0a, f0b, f0c = rng.uniform(110, 150), rng.uniform(220, 320), rng.uniform(130, 170)
        f1, f2 = 430.0, 1050.0
        bright = 0.10
    peak_at = rng.uniform(0.28, 0.42) * dur
    f0 = np.where(
        t < peak_at,
        f0a + (f0b - f0a) * (t / peak_at),
        f0b + (f0c - f0b) * ((t - peak_at) / max(dur - peak_at, 1e-3)),
    )
    phase = np.cumsum(f0, dtype=np.float64) * 2 * np.pi / SR
    pulse = (
        0.62 * np.sin(phase)
        + 0.24 * np.sin(2 * phase)
        + 0.10 * np.sin(3 * phase)
        + bright * np.sin(4 * phase)
    )
    form = 0.55 + 0.45 * np.sin(2 * np.pi * f1 * t) + 0.18 * np.sin(2 * np.pi * f2 * t)
    breath = rng.normal(0, 0.09, n).astype(np.float32)
    att = max(int(0.025 * SR), 1)
    rel = max(int(0.14 * SR), 1)
    env = np.ones(n, dtype=np.float32)
    env[:att] = np.linspace(0, 1, att, dtype=np.float32)
    env[-rel:] *= np.linspace(1, 0, rel, dtype=np.float32)
    # joyful, short — never a held horror wail
    return (pulse * form + breath).astype(np.float32) * env * (0.32 if gender == "w" else 0.38)


def make_laugh(dur: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = max(int(dur * SR), 8)
    t = np.arange(n, dtype=np.float32) / SR
    pulses = np.zeros(n, dtype=np.float32)
    step = int(0.09 * SR)
    for i, f0 in enumerate((240, 260, 230, 250)):
        start = i * step
        if start >= n:
            break
        hunk = min(int(0.07 * SR), n - start)
        tt = np.arange(hunk) / SR
        pulses[start : start + hunk] += np.sin(2 * np.pi * f0 * tt) * np.hanning(hunk)
    noise = rng.normal(0, 0.12, n).astype(np.float32)
    env = np.hanning(n).astype(np.float32)
    return (pulses * 0.55 + noise) * env * 0.22


def place(dst: np.ndarray, src: np.ndarray, at: float, gain: float, pan: float) -> None:
    i0 = int(at * SR)
    if i0 >= dst.shape[1]:
        return
    sl = src[: max(0, dst.shape[1] - i0)]
    if sl.size == 0:
        return
    left = gain * (0.5 - 0.5 * pan)
    right = gain * (0.5 + 0.5 * pan)
    dst[0, i0 : i0 + sl.size] += sl * left
    dst[1, i0 : i0 + sl.size] += sl * right


def synth_audio(seconds: float) -> np.ndarray:
    n = int(round(seconds * SR))
    t = np.arange(n, dtype=np.float32) / SR
    speed = env_at(
        t,
        [(k[0], k[1]) for k in PHYSICS],
    )
    lift = ((t >= 5.0) & (t < 46.5)).astype(np.float32)
    drop_fun = env_at(
        t,
        [
            (0, 0),
            (47.4, 0),
            (48.2, 0.55),
            (50.0, 1.0),
            (56.0, 0.85),
            (62.0, 0.55),
            (72.0, 0.40),
            (82.0, 0.50),
            (90.0, 0.35),
            (98.0, 0.12),
            (108.0, 0.04),
            (120.0, 0),
        ],
    )

    rng = np.random.default_rng(20260906)
    raw = rng.normal(0, 1, n).astype(np.float32)
    # wooden wheel roar — low rumble that grows with speed
    roar = fft_shape(raw, lambda f: (f < 28) * 0.15 + ((f >= 28) & (f < 220)) * 1.0 + ((f >= 220) & (f < 900)) * 0.35)
    roar *= 0.10 + speed * 0.62
    # rushing air / zoom whoosh
    air = fft_shape(rng.normal(0, 1, n).astype(np.float32), lambda f: ((f >= 700) & (f < 4200)).astype(np.float32) * (f / 4200))
    air *= (speed**1.6) * 0.34
    # extra drop whoosh
    whoosh_burst = air * env_at(t, [(0, 0), (47.6, 0), (49.2, 1.2), (53.5, 0.4), (58, 0.15), (120, 0.05)])

    bed = np.zeros((2, n), dtype=np.float32)
    bed[0] += roar * 0.92 + air * 0.85 + whoosh_burst * 0.7
    bed[1] += roar * 0.88 + air * 0.95 + whoosh_burst * 0.8

    # lift chain + anti-rollback clack
    chain_noise = fft_shape(rng.normal(0, 1, n).astype(np.float32), lambda f: ((f >= 60) & (f < 380)).astype(np.float32))
    bed += (chain_noise * lift * 0.10)[None, :]

    def click(freq: float, decay: float, length: float) -> np.ndarray:
        m = int(length * SR)
        tt = np.arange(m, dtype=np.float32) / SR
        return (np.sin(2 * np.pi * freq * tt) * np.exp(-tt * decay) + 0.25 * rng.normal(0, 1, m) * np.exp(-tt * (decay * 1.4))).astype(
            np.float32
        )

    # anti-rollback dogs on the lift
    t_clack = 6.2
    while t_clack < 46.2:
        gap = 0.40 - 0.04 * ((t_clack - 6.2) / 40.0)
        place(bed, click(1680, 38, 0.09), t_clack, 0.42, rng.uniform(-0.15, 0.15))
        place(bed, click(420, 22, 0.11), t_clack, 0.28, 0.0)
        t_clack += max(gap, 0.30)

    # running track joints / wheel clacks scale with speed
    t_joint = 1.0
    while t_joint < seconds - 0.2:
        spd = float(np.interp(t_joint, [k[0] for k in PHYSICS], [k[1] for k in PHYSICS]))
        if spd > 0.18:
            gap = max(0.075, 0.30 - 0.22 * spd)
            g = 0.12 + spd * 0.38
            place(bed, click(920 + spd * 400, 48, 0.06), t_joint, g, rng.uniform(-0.25, 0.25))
            t_joint += gap
        else:
            t_joint += 0.20

    # joyful riders — women screech / men hoop, never horror wails
    fun_times = [
        (48.1, "w", 0.55, -0.35),
        (48.22, "m", 0.70, 0.20),
        (48.40, "w", 0.48, 0.40),
        (48.55, "m", 0.62, -0.15),
        (49.05, "w", 0.42, 0.10),
        (49.35, "m", 0.80, 0.30),
        (50.10, "w", 0.50, -0.25),
        (50.40, "m", 0.55, 0.05),
        (51.20, "w", 0.38, 0.45),
        (52.10, "m", 0.72, -0.30),
        (53.40, "w", 0.44, 0.15),
        (54.80, "m", 0.66, 0.25),
        (56.60, "w", 0.36, -0.20),
        (59.80, "m", 0.58, 0.10),
        (60.15, "w", 0.40, 0.35),
        (64.20, "m", 0.50, -0.10),
        (68.40, "w", 0.34, 0.20),
        (71.80, "m", 0.62, -0.25),
        (72.10, "w", 0.40, 0.30),
        (79.40, "m", 0.55, 0.05),
        (80.00, "w", 0.36, -0.35),
        (88.90, "m", 0.48, 0.15),
        (89.20, "w", 0.32, 0.25),
        (96.40, "m", 0.44, -0.10),
    ]
    for i, (at, gender, dur, pan) in enumerate(fun_times):
        place(bed, make_whoop(dur, gender, 9000 + i * 17), at, 0.95 if gender == "m" else 0.88, pan)
    for i, at in enumerate((49.8, 53.1, 61.4, 73.2, 90.6)):
        place(bed, make_laugh(0.38, 4400 + i), at, 0.55, (-0.2, 0.25, -0.1, 0.15, 0.0)[i])

    # quiet station murmur under the first seconds and last brakes
    murmur = fft_shape(rng.normal(0, 1, n).astype(np.float32), lambda f: ((f >= 80) & (f < 500)).astype(np.float32))
    murmur *= env_at(t, [(0, 0.16), (6, 0.10), (12, 0.04), (100, 0.03), (110, 0.10), (120, 0.14)])
    bed += murmur[None, :] * 0.22

    # keep drop reactions in the clear
    bed *= 1.0 + 0.12 * drop_fun

    peak = float(np.max(np.abs(bed))) or 1.0
    bed = np.clip(bed * (0.92 / peak), -1.0, 1.0)
    return bed


def write_wav(path: str, stereo: np.ndarray) -> None:
    pcm = np.clip(stereo, -1, 1)
    interleaved = np.empty(pcm.shape[1] * 2, dtype=np.int16)
    interleaved[0::2] = (pcm[0] * 32767).astype(np.int16)
    interleaved[1::2] = (pcm[1] * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(interleaved.tobytes())


def mux(video: str, audio: str, dest: str) -> None:
    tmp = "/tmp/ridge-runner-mux.mp4"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            video,
            "-i",
            audio,
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-ac",
            "2",
            "-shortest",
            "-movflags",
            "+faststart",
            tmp,
        ]
    )
    os.replace(tmp, dest)
    print(f"muxed {dest}", flush=True)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    video = "/tmp/ridge-runner-video-final.mp4"
    audio = "/tmp/ridge-runner-audio.wav"
    dest = os.path.join(OUT, "coaster.mp4")
    frames = encode_video(video)
    seconds = frames / FPS
    print(f"synth audio {seconds:.2f}s", flush=True)
    write_wav(audio, synth_audio(seconds))
    mux(video, audio, dest)
    print(f"done {dest} duration={seconds:.2f}", flush=True)


if __name__ == "__main__":
    sys.exit(main())
