#!/usr/bin/env python3
"""Ridge Runner: photoreal plates + real forward travel. No cartoon. No shake.

Each frame is a vanishing-point expansion through the original stills so rails
and timber stream past while the picture stays the photographed wood. Extra
hill cycles reuse drop/valley/airtime plates. Audio is mechanical only.
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
DEST = "/workspace/public/videos/carnival/coaster.mp4"
SRC_W, SRC_H = 1600, 900
OUT_W, OUT_H = 1280, 720
FPS = 24
SR = 44100

# Overlapping photoreal plates. Extra drop/valley/airtime cycles = more hills.
WAYPOINTS = [
    ("carnival-coaster-dispatch.jpg", 0.0, 5.2, "roll"),
    ("carnival-coaster-chain.jpg", 3.6, 9.8, "lift"),
    ("carnival-coaster-lift.jpg", 7.8, 15.4, "lift"),
    ("carnival-coaster-lift-mid.jpg", 13.4, 21.2, "lift"),
    ("carnival-coaster-lift-high.jpg", 19.2, 26.4, "lift"),
    ("carnival-coaster-hang.jpg", 24.8, 28.8, "hang"),
    ("carnival-coaster-crest.jpg", 27.2, 30.2, "crest"),
    # hill 1
    ("carnival-coaster-drop.jpg", 29.2, 32.8, "drop"),
    ("carnival-coaster-drop-mid.jpg", 31.6, 34.8, "drop"),
    ("carnival-coaster-plunge.jpg", 33.8, 36.8, "drop"),
    ("carnival-coaster-valley.jpg", 35.8, 39.2, "rush"),
    ("carnival-coaster-airtime.jpg", 38.2, 42.2, "air"),
    ("carnival-coaster-camel.jpg", 41.2, 44.8, "rush"),
    # hill 2
    ("carnival-coaster-drop-mid.jpg", 43.8, 46.8, "drop"),
    ("carnival-coaster-plunge.jpg", 45.8, 48.8, "drop"),
    ("carnival-coaster-valley.jpg", 47.8, 51.2, "rush"),
    ("carnival-coaster-airtime.jpg", 50.2, 53.8, "air"),
    ("carnival-coaster-camel.jpg", 52.8, 56.2, "rush"),
    # hill 3 into the bank
    ("carnival-coaster-drop.jpg", 55.2, 58.4, "drop"),
    ("carnival-coaster-bank.jpg", 57.2, 61.8, "bank"),
    ("carnival-coaster-turn.jpg", 60.6, 65.2, "bank"),
    ("carnival-coaster-helix.jpg", 64.0, 68.6, "helix"),
    ("carnival-coaster-portal.jpg", 67.4, 71.0, "rush"),
    ("carnival-coaster-tunnel.jpg", 69.8, 73.6, "tunnel"),
    ("carnival-coaster-tunnel-mid.jpg", 72.4, 76.0, "tunnel"),
    ("carnival-coaster-tunnel-exit.jpg", 74.8, 78.2, "rush"),
    ("carnival-coaster-climbout.jpg", 77.0, 81.6, "air"),
    ("carnival-coaster-brakerun.jpg", 80.4, 86.2, "brake"),
    ("carnival-coaster-brakes.jpg", 84.4, 89.6, "brake"),
    ("carnival-coaster-home.jpg", 87.8, 94.0, "home"),
]
DURATION = 94.0

# t, speed 0-1, pitch (up + / down -), roll
PHYSICS = [
    (0.0, 0.20, 0.04, 0.00),
    (4.0, 0.16, 0.14, 0.00),
    (10.0, 0.13, 0.30, 0.00),
    (18.0, 0.12, 0.40, 0.00),
    (24.5, 0.11, 0.28, 0.00),
    (27.4, 0.12, 0.06, 0.00),
    (29.4, 0.28, -0.12, 0.02),
    (31.4, 0.78, -0.52, 0.04),
    (34.0, 0.96, -0.40, 0.02),
    (36.6, 0.88, -0.06, -0.04),
    (39.4, 0.68, 0.26, 0.00),
    (42.4, 0.60, 0.16, 0.00),
    (44.6, 0.82, -0.10, 0.02),
    (46.6, 0.95, -0.48, 0.03),
    (49.0, 0.90, -0.10, 0.00),
    (51.6, 0.70, 0.24, 0.00),
    (54.2, 0.64, 0.14, 0.00),
    (56.4, 0.90, -0.42, 0.04),
    (58.6, 0.86, -0.04, -0.22),
    (62.4, 0.84, 0.02, -0.38),
    (66.2, 0.82, 0.00, -0.26),
    (70.4, 0.80, -0.02, 0.04),
    (74.6, 0.76, 0.00, 0.00),
    (78.4, 0.52, 0.16, 0.00),
    (82.6, 0.26, 0.06, 0.00),
    (88.4, 0.12, 0.02, 0.00),
    (94.0, 0.04, 0.00, 0.00),
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


def source_vp(kind: str, pitch: float) -> tuple[float, float]:
    vx = SRC_W * 0.50
    if kind == "lift":
        vy = SRC_H * (0.30 - pitch * 0.06)
    elif kind == "drop":
        vy = SRC_H * (0.56 - pitch * 0.08)
    elif kind in ("crest", "hang"):
        vy = SRC_H * 0.40
    elif kind == "air":
        vy = SRC_H * (0.32 - pitch * 0.05)
    elif kind in ("bank", "helix"):
        vy = SRC_H * 0.42
    elif kind == "tunnel":
        vy = SRC_H * 0.46
    else:
        vy = SRC_H * (0.40 - pitch * 0.05)
    return vx, vy


def warp(img: np.ndarray, travel: float, kind: str, pitch: float, roll: float, bank_pan: float) -> np.ndarray:
    """Forward travel: expand away from the vanishing point. No shake."""
    vx, vy = source_vp(kind, pitch)
    # travel is monotonic meters-of-look. Scale < 1 = we have moved closer.
    scale = 1.0 / (1.0 + travel * 0.92)
    # Extra downward pull so the track under the nose rushes the lens.
    under = travel * (18.0 + (0.55 if kind == "drop" else 0.28) * 22.0)
    look = -pitch * 70.0
    sx = vx + (XS * (SRC_W / OUT_W) - vx) * scale + bank_pan
    sy = vy + (YS * (SRC_H / OUT_H) - vy) * scale + look + under * (YS / OUT_H)
    if abs(roll) > 0.004:
        cx, cy = SRC_W * 0.5, SRC_H * 0.5
        dx, dy = sx - cx, sy - cy
        c, s = math.cos(roll), math.sin(roll)
        sx = dx * c - dy * s + cx
        sy = dx * s + dy * c + cy
    return sample(img, sx, sy)


def active_waypoints(t: float) -> list[tuple[int, float]]:
    hits = []
    for i, (_name, t0, t1, _kind) in enumerate(WAYPOINTS):
        if t0 <= t <= t1:
            u = (t - t0) / max(t1 - t0, 0.001)
            hits.append((i, min(max(u, 0.0), 1.0)))
    if hits:
        return hits
    if t < WAYPOINTS[0][1]:
        return [(0, 0.0)]
    return [(len(WAYPOINTS) - 1, 1.0)]


def blend_weight(u: float) -> float:
    # Edges fade so overlaps mix; middle stays the plate. Never a hold at u=1.
    if u < 0.16:
        return 0.15 + 0.85 * (u / 0.16)
    if u > 0.84:
        return 0.15 + 0.85 * ((1.0 - u) / 0.16)
    return 1.0


def encode_video(seconds: float) -> str:
    cache: dict[str, np.ndarray] = {}
    for name, *_ in WAYPOINTS:
        path = os.path.join(IMG, name)
        if not os.path.isfile(path):
            raise SystemExit(f"missing {path}")
        if name not in cache:
            print(f"load {name}", flush=True)
            cache[name] = load_rgb(path)

    tmp = "/tmp/ridge-photoreal.mp4"
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
            "19",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            tmp,
        ],
        stdin=subprocess.PIPE,
    )
    assert ff.stdin is not None

    frames = int(round(seconds * FPS))
    travel = 0.0
    t0 = time.time()
    for n in range(frames):
        t = n / FPS
        speed, pitch, roll = ride_state(t)
        travel += (0.045 + speed * 0.155) / FPS
        hits = active_waypoints(t)
        layers = []
        weights = []
        for idx, u in hits:
            name, _a, _b, kind = WAYPOINTS[idx]
            # Local plate also keeps advancing — no ease-out park.
            local = travel * 0.55 + u * (0.22 + speed * 0.28)
            pan = 0.0
            if kind in ("bank", "helix"):
                pan = (-40 + u * 210) if kind == "bank" else (-52 + u * 230)
            frame = warp(cache[name], local, kind, pitch, roll * 0.42, pan)
            layers.append(frame)
            weights.append(blend_weight(u))
        wsum = sum(weights) or 1.0
        acc = layers[0] * (weights[0] / wsum)
        for layer, w in zip(layers[1:], weights[1:]):
            acc = acc + layer * (w / wsum)
        out = np.clip(acc, 0, 255).astype(np.uint8)
        ff.stdin.write(out.tobytes())
        if n % 48 == 0:
            print(
                f"frame {n}/{frames} t={t:.1f}s speed={speed:.2f} travel={travel:.2f} "
                f"render={(n+1)/max(time.time()-t0,0.01):.1f}fps",
                flush=True,
            )
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg video failed")
    return tmp


def env_at(times: np.ndarray, keys: list[tuple[float, float]]) -> np.ndarray:
    xp = np.array([k[0] for k in keys], dtype=np.float32)
    fp = np.array([k[1] for k in keys], dtype=np.float32)
    return np.interp(times, xp, fp).astype(np.float32)


def bandlimited(n: int, rng: np.random.Generator, lo: float, hi: float) -> np.ndarray:
    noise = rng.normal(0, 1, n).astype(np.float32)
    spec = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec *= ((freqs >= lo) & (freqs <= hi)).astype(np.float32)
    y = np.fft.irfft(spec, n=n).astype(np.float32)
    peak = float(np.max(np.abs(y))) or 1.0
    return y / peak


def synth_mech(seconds: float) -> np.ndarray:
    """Lift ratchet + track roar/whoosh. No voices."""
    n = int(round(seconds * SR))
    t = np.arange(n, dtype=np.float32) / SR
    speed = env_at(t, [(k[0], k[1]) for k in PHYSICS])
    pitch = env_at(t, [(k[0], k[2]) for k in PHYSICS])
    lift = ((t >= 3.8) & (t < 26.2)).astype(np.float32)
    falling = np.clip(-pitch, 0, 1)
    rising = np.clip(pitch, 0, 1)
    speed_n = np.clip(speed, 0, 1)
    # Louder toward bottoms (fast + looking down), quieter climbing away.
    prox = np.clip(speed_n * (0.28 + 0.72 * falling) * (1.0 - 0.45 * rising), 0, 1)
    rng = np.random.default_rng(5)
    roar = bandlimited(n, rng, 40, 380)
    clatter = bandlimited(n, rng, 380, 1400)
    wind = bandlimited(n, rng, 900, 4800)
    bed = np.zeros((2, n), dtype=np.float32)
    bed += roar * (0.030 + speed_n * 0.14 + prox * 0.16)
    bed += clatter * (speed_n * 0.040 + prox * 0.05)
    bed += wind * (speed_n**1.3 * (0.04 + 0.20 * falling) + prox * 0.08)

    def click(kind: str) -> np.ndarray:
        m = int(0.085 * SR)
        tt = np.arange(m, dtype=np.float32) / SR
        if kind == "dog":
            y = 0.74 * np.sin(2 * np.pi * 1480 * tt) * np.exp(-tt * 42)
            y += 0.40 * np.sin(2 * np.pi * 620 * tt) * np.exp(-tt * 28)
            y += 0.16 * rng.normal(0, 1, m).astype(np.float32) * np.exp(-tt * 55)
        else:
            y = 0.52 * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt * 18)
            y += 0.22 * rng.normal(0, 1, m).astype(np.float32) * np.exp(-tt * 30)
        return y.astype(np.float32)

    t_clack = 0.0
    while t_clack < seconds:
        i = int(t_clack * SR)
        if i < n and lift[i] > 0.5:
            ck = click("dog") * 0.50
            sl = ck[: max(0, n - i)]
            if sl.size:
                bed[0, i : i + sl.size] += sl
                bed[1, i : i + sl.size] += sl * 0.92
            i2 = min(i + int(0.16 * SR), n - 1)
            ck2 = click("chain") * 0.26
            sl2 = ck2[: max(0, n - i2)]
            if sl2.size:
                bed[0, i2 : i2 + sl2.size] += sl2 * 0.9
                bed[1, i2 : i2 + sl2.size] += sl2
            t_clack += 0.27
        else:
            t_clack += 0.2

    peak = float(np.max(np.abs(bed))) or 1.0
    return np.clip(bed * (0.84 / peak), -1, 1)


def write_wav(path: str, stereo: np.ndarray) -> None:
    interleaved = np.empty(stereo.shape[1] * 2, dtype=np.int16)
    interleaved[0::2] = (np.clip(stereo[0], -1, 1) * 32767).astype(np.int16)
    interleaved[1::2] = (np.clip(stereo[1], -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(interleaved.tobytes())


def mux(video: str, wav: str, dest: str) -> None:
    tmp = "/tmp/ridge-photoreal-mux.mp4"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            video,
            "-i",
            wav,
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-shortest",
            "-movflags",
            "+faststart",
            tmp,
        ]
    )
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    os.replace(tmp, dest)


def main() -> None:
    preview = "--preview" in sys.argv
    seconds = 8.0 if preview else DURATION
    print(f"photoreal Ridge Runner {seconds:.1f}s", flush=True)
    video = encode_video(seconds)
    wav = "/tmp/ridge-photoreal.wav"
    write_wav(wav, synth_mech(seconds))
    dest = "/tmp/ridge-photoreal-preview.mp4" if preview else DEST
    mux(video, wav, dest)
    print(f"wrote {dest}", flush=True)


if __name__ == "__main__":
    main()
