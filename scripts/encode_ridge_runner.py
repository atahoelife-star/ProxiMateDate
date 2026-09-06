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
    ("carnival-coaster-dispatch.jpg", 0.0, 4.8, "roll"),
    ("carnival-coaster-chain.jpg", 3.2, 9.2, "lift"),
    ("carnival-coaster-lift.jpg", 7.4, 13.8, "lift"),
    ("carnival-coaster-lift-mid.jpg", 12.0, 18.4, "lift"),
    ("carnival-coaster-lift-high.jpg", 16.6, 23.0, "lift"),
    ("carnival-coaster-hang.jpg", 21.4, 25.4, "hang"),
    ("carnival-coaster-crest.jpg", 24.2, 27.0, "crest"),
    ("carnival-coaster-drop.jpg", 26.0, 29.2, "drop"),
    ("carnival-coaster-drop-mid.jpg", 28.0, 30.8, "drop"),
    ("carnival-coaster-plunge.jpg", 29.8, 32.6, "drop"),
    ("carnival-coaster-valley.jpg", 31.6, 35.4, "rush"),
    ("carnival-coaster-airtime.jpg", 34.4, 38.0, "air"),
    ("carnival-coaster-camel.jpg", 36.8, 40.6, "rush"),
    ("carnival-coaster-bank.jpg", 39.4, 43.8, "bank"),
    ("carnival-coaster-turn.jpg", 42.6, 47.0, "bank"),
    ("carnival-coaster-helix.jpg", 45.8, 50.4, "helix"),
    ("carnival-coaster-portal.jpg", 49.2, 52.4, "rush"),
    ("carnival-coaster-tunnel.jpg", 51.4, 55.0, "tunnel"),
    ("carnival-coaster-tunnel-mid.jpg", 53.8, 57.2, "tunnel"),
    ("carnival-coaster-tunnel-exit.jpg", 56.2, 59.2, "rush"),
    ("carnival-coaster-climbout.jpg", 58.2, 62.4, "air"),
    ("carnival-coaster-brakerun.jpg", 61.2, 67.0, "brake"),
    ("carnival-coaster-brakes.jpg", 65.4, 70.4, "brake"),
    ("carnival-coaster-home.jpg", 69.0, 74.0, "home"),
]

DURATION = 74.0

# Ride physics keys: (t, speed 0-1, pitch -1..1 look down/up, roll -1..1)
PHYSICS = [
    (0.0, 0.18, 0.02, 0.00),
    (2.0, 0.24, 0.05, 0.02),
    (4.2, 0.20, 0.10, 0.00),
    (7.0, 0.15, 0.22, 0.00),
    (12.0, 0.13, 0.34, 0.01),
    (18.0, 0.12, 0.40, 0.00),
    (22.4, 0.11, 0.22, 0.00),
    (24.6, 0.10, 0.04, 0.00),
    (26.0, 0.18, -0.12, 0.03),
    (27.0, 0.55, -0.42, 0.05),
    (28.6, 0.92, -0.58, 0.06),
    (30.8, 1.00, -0.36, 0.02),
    (33.2, 0.90, -0.06, -0.10),
    (36.0, 0.76, 0.24, 0.04),
    (39.2, 0.72, 0.12, 0.00),
    (42.0, 0.82, 0.02, -0.28),
    (45.2, 0.86, 0.00, -0.44),
    (48.6, 0.84, 0.02, -0.30),
    (51.4, 0.80, -0.04, -0.12),
    (54.2, 0.92, -0.02, 0.06),
    (57.4, 0.86, 0.04, 0.02),
    (60.6, 0.52, 0.16, 0.00),
    (64.8, 0.26, 0.06, 0.00),
    (69.2, 0.12, 0.02, 0.00),
    (74.0, 0.04, 0.00, 0.00),
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
        z = 1.10 + u * 0.72
        persp = 0.28 + u * 0.55
        panx = 8 * math.sin(u * 2.4)
        pany = -48 - u * 150
    elif kind == "hang":
        z = 1.12 + u * 0.34
        persp = 0.22 + u * 0.22
        panx = 12 * math.sin(u * 3.6)
        pany = -6 + u * 36
    elif kind == "crest":
        z = 1.14 + u * 0.55
        persp = 0.34 + u * 0.70
        panx = 10 * math.sin(u * 5)
        pany = 22 + u * 110
    elif kind == "drop":
        z = 1.16 + u * (1.15 + speed * 0.28)
        persp = 0.50 + u * 1.20
        panx = 18 * math.sin(u * 13)
        pany = 48 + u * 190
    elif kind == "rush":
        z = 1.14 + u * (0.82 + speed * 0.22)
        persp = 0.38 + u * 0.88
        panx = 9 * math.sin(u * 6.2)
        pany = 10 + u * 36
    elif kind == "air":
        z = 1.12 + u * 0.52
        persp = 0.24 + u * 0.34
        panx = 6 * math.sin(u * 3.0)
        pany = -24 - u * 120
    elif kind == "bank":
        z = 1.14 + u * 0.62
        persp = 0.32 + u * 0.48
        panx = -36 + u * 240
        pany = 12 * math.sin(u * 3.4)
    elif kind == "helix":
        z = 1.16 + u * 0.70
        persp = 0.34 + u * 0.58
        panx = -48 + u * 260
        pany = 14 * math.sin(u * 4.8)
    elif kind == "tunnel":
        z = 1.18 + u * (0.95 + speed * 0.18)
        persp = 0.44 + u * 0.95
        panx = 8 * math.sin(u * 7)
        pany = 8 + u * 22
    elif kind == "brake":
        z = 1.10 + u * 0.34
        persp = 0.18 + u * 0.18
        panx = 6 * math.sin(u * 2.2)
        pany = 5 * math.cos(u * 1.8)
    elif kind == "home":
        z = 1.08 + u * 0.20
        persp = 0.14 + u * 0.10
        panx = 5 * math.sin(u * 1.6)
        pany = 3
    else:  # roll / dispatch
        z = 1.08 + u * 0.38
        persp = 0.20 + u * 0.28
        panx = 10 * math.sin(u * 3.0)
        pany = 5 * math.cos(u * 2.2)
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
        shake = 0.38 + speed * 1.65
        # wooden chatter ~12 Hz plus a slower car sway — never a locked-off plate
        jx = shake * 8.4 * math.sin(n * math.pi * 0.55) + shake * 3.1 * math.sin(n * 2.15)
        jy = shake * 6.2 * math.cos(n * math.pi * 0.48) + shake * 2.4 * math.sin(n * 2.62)
        roll_rad = roll * 0.46 + 0.028 * math.sin(n * 0.14) * (0.45 + speed)
        crawl = ((t * (14 + speed * 86)) % 36) - 8

        layers = []
        weights = []
        hits = active_waypoints(t)
        for idx, u in hits:
            name, _a, _b, kind = WAYPOINTS[idx]
            z, persp, panx, pany = still_travel(kind, u, speed)
            pany += -pitch * 128 + crawl * (0.35 + speed * 0.55)
            panx += 18 * math.sin(t * 1.35) * (0.28 + speed * 0.7)
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
        if speed > 0.28 and layers:
            name, _a, _b, kind = WAYPOINTS[hits[0][0]]
            u = min(hits[0][1] + 0.10 + speed * 0.08, 1.0)
            z, persp, panx, pany = still_travel(kind, u, speed)
            rush = warp(
                cache[name],
                z * 1.08,
                persp + 0.16,
                panx,
                pany - pitch * 128 + crawl,
                roll_rad,
                jx,
                jy,
            )
            mix = 0.14 + 0.28 * speed
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
        f0a, f0b, f0c = rng.uniform(260, 320), rng.uniform(480, 620), rng.uniform(280, 340)
        f1, f2 = 680.0, 2100.0
        bright = 0.18
    else:
        f0a, f0b, f0c = rng.uniform(105, 140), rng.uniform(200, 280), rng.uniform(120, 160)
        f1, f2 = 400.0, 980.0
        bright = 0.08
    # hold the peak — a sustained “woooo”, not a chirp or a horror wail
    rise = rng.uniform(0.18, 0.28) * dur
    hold = rng.uniform(0.42, 0.58) * dur
    f0 = np.where(
        t < rise,
        f0a + (f0b - f0a) * (t / max(rise, 1e-3)),
        np.where(
            t < rise + hold,
            f0b + (f0b * 0.04) * np.sin(2 * np.pi * 3.2 * (t - rise)),
            f0b + (f0c - f0b) * ((t - rise - hold) / max(dur - rise - hold, 1e-3)),
        ),
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
    lift = ((t >= 4.2) & (t < 25.2)).astype(np.float32)
    after_crest = ((t >= 26.0) & (t < 61.0)).astype(np.float32)
    drop_fun = env_at(
        t,
        [
            (0, 0),
            (25.6, 0),
            (26.4, 0.70),
            (28.2, 1.0),
            (33.0, 0.80),
            (38.0, 0.45),
            (43.0, 0.55),
            (49.0, 0.40),
            (54.0, 0.50),
            (60.0, 0.18),
            (68.0, 0.04),
            (74.0, 0),
        ],
    )

    rng = np.random.default_rng(20260906)
    raw = rng.normal(0, 1, n).astype(np.float32)
    # bass-heavy wooden roar after the crest, plus a lighter lift rumble
    roar = fft_shape(raw, lambda f: (f < 40) * 0.55 + ((f >= 40) & (f < 180)) * 1.15 + ((f >= 180) & (f < 700)) * 0.28)
    roar *= 0.08 + speed * 0.48 + after_crest * (0.22 + speed * 0.38)
    rattle = fft_shape(rng.normal(0, 1, n).astype(np.float32), lambda f: ((f >= 180) & (f < 1400)).astype(np.float32))
    rattle *= (0.04 + speed * 0.22) * (0.35 + after_crest)
    # harsh wind whoosh that peaks with speed
    air = fft_shape(
        rng.normal(0, 1, n).astype(np.float32),
        lambda f: ((f >= 900) & (f < 6200)).astype(np.float32) * np.clip(f / 3200, 0, 1.4),
    )
    air *= (speed**1.75) * 0.48
    whoosh_burst = air * env_at(
        t,
        [(0, 0), (25.8, 0), (26.8, 1.35), (30.4, 0.85), (34.0, 0.35), (43.0, 0.45), (54.0, 0.40), (62.0, 0.08), (74.0, 0)],
    )

    bed = np.zeros((2, n), dtype=np.float32)
    bed[0] += roar * 0.95 + rattle * 0.70 + air * 0.90 + whoosh_burst * 0.85
    bed[1] += roar * 0.90 + rattle * 0.78 + air * 1.00 + whoosh_burst * 0.95

    # lift chain + anti-rollback clack
    chain_noise = fft_shape(rng.normal(0, 1, n).astype(np.float32), lambda f: ((f >= 60) & (f < 380)).astype(np.float32))
    bed += (chain_noise * lift * 0.10)[None, :]

    def click(freq: float, decay: float, length: float) -> np.ndarray:
        m = int(length * SR)
        tt = np.arange(m, dtype=np.float32) / SR
        return (np.sin(2 * np.pi * freq * tt) * np.exp(-tt * decay) + 0.25 * rng.normal(0, 1, m) * np.exp(-tt * (decay * 1.4))).astype(
            np.float32
        )

    # anti-rollback dogs — regular metallic clack that tightens as we climb
    t_clack = 5.0
    while t_clack < 24.8:
        gap = 0.36 - 0.08 * ((t_clack - 5.0) / 20.0)
        place(bed, click(1860, 42, 0.08), t_clack, 0.58, rng.uniform(-0.12, 0.12))
        place(bed, click(510, 26, 0.10), t_clack, 0.36, 0.0)
        t_clack += max(gap, 0.26)

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

    # joyful riders — sustained “woooo” / hollers on drops, never horror wails
    fun_times = [
        (26.15, "w", 1.35, -0.32),
        (26.28, "m", 1.55, 0.22),
        (26.55, "w", 1.15, 0.38),
        (26.70, "m", 1.40, -0.12),
        (27.40, "w", 1.05, 0.08),
        (27.70, "m", 1.45, 0.28),
        (28.50, "w", 0.95, -0.22),
        (29.10, "m", 1.20, 0.06),
        (30.20, "w", 0.85, 0.40),
        (31.10, "m", 1.15, -0.28),
        (36.20, "m", 1.25, 0.12),
        (36.45, "w", 1.00, 0.30),
        (42.40, "m", 1.20, -0.20),
        (42.70, "w", 0.95, 0.24),
        (46.80, "m", 1.10, 0.08),
        (47.10, "w", 0.90, -0.30),
        (53.60, "m", 1.05, 0.16),
        (53.90, "w", 0.85, 0.22),
        (57.40, "m", 0.90, -0.10),
    ]
    for i, (at, gender, dur, pan) in enumerate(fun_times):
        place(bed, make_whoop(dur, gender, 9000 + i * 17), at, 1.02 if gender == "m" else 0.94, pan)
    # quieter laughs between elements, then the next dip takes off again
    for i, at in enumerate((32.6, 34.8, 39.4, 44.8, 50.6, 59.6)):
        place(bed, make_laugh(0.42, 4400 + i), at, 0.62, (-0.18, 0.22, -0.08, 0.14, -0.12, 0.06)[i])

    # quiet station murmur under the first seconds and last brakes
    murmur = fft_shape(rng.normal(0, 1, n).astype(np.float32), lambda f: ((f >= 80) & (f < 500)).astype(np.float32))
    murmur *= env_at(t, [(0, 0.16), (5, 0.09), (10, 0.03), (62, 0.04), (68, 0.10), (74, 0.14)])
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
