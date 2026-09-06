#!/usr/bin/env python3
"""Ridge Runner 30s motion test — continuous 24fps POV, no still dissolves.

Every output frame is a new interpolated camera station on a 3D wooden track.
Rails, ties, posts, and trees have world positions and translate past the lens.
Photoreal stills supply dusk sky, wood colors, and the lap-bar dash only —
they are never crossfaded as the ride. Pinewick layout only. Light mechanical audio.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import time
import wave
from dataclasses import dataclass

import numpy as np

OUT = "/workspace/public/videos/carnival/coaster.mp4"
IMG_DIR = "/workspace/public/images/carnival"
W, H = 1280, 720
FPS = 24
SR = 44100
FOCAL = 580.0
CX, CY = (W - 1) / 2.0, 338.0
CAM_H = 0.86
DS = 0.22
TRACK_W = 1.18
RAIL_IN = 0.44
TIE_STEP = 0.46
TIE_DEPTH = 0.16
POST_STEP = 1.55
DRAW_AHEAD = 88.0
FILM_SECONDS = 30.0

CHAIN = np.array([36, 36, 38], dtype=np.float32)
RAIL = np.array([228, 232, 238], dtype=np.float32)
RAIL_SHADOW = np.array([70, 62, 54], dtype=np.float32)
BULB = np.array([255, 210, 110], dtype=np.float32)
TUNNEL = np.array([8, 6, 7], dtype=np.float32)
PINE = np.array([32, 52, 28], dtype=np.float32)
PINE2 = np.array([48, 74, 38], dtype=np.float32)
TRUNK = np.array([54, 38, 26], dtype=np.float32)
WOOD_DK = np.array([48, 32, 22], dtype=np.float32)
TIE_HI = np.array([78, 52, 30], dtype=np.float32)


@dataclass
class Cam:
    x: float
    y: float
    z: float
    heading: float
    roll: float
    s: float
    speed: float
    lift: float
    tunnel: float
    i: int


@dataclass
class Mats:
    sky: np.ndarray
    dash: np.ndarray
    wood: np.ndarray
    tie: np.ndarray
    dirt: np.ndarray
    walk: np.ndarray


def load_rgb(path: str, w: int = W, h: int = H) -> np.ndarray:
    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            path,
            "-vf",
            f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-frames:v",
            "1",
            "pipe:1",
        ]
    )
    return np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3).astype(np.float32)


def mean_color(img: np.ndarray, y0: int, y1: int, x0: int, x1: int) -> np.ndarray:
    patch = img[y0:y1, x0:x1]
    return np.mean(patch.reshape(-1, 3), axis=0).astype(np.float32)


def section_path() -> dict[str, np.ndarray]:
    """~30s woodie motion test: hang, long drop, more hills, bank, tunnel, home."""
    # length, speed, d_elev, d_heading, roll, flags(lift=1, tunnel=2)
    pieces = [
        (10.0, 2.6, 0.8, 0.02, 0.0, 1.0),
        (6.0, 4.8, -1.2, 0.00, 0.0, 0.0),
        (48.0, 17.8, -11.0, 0.05, 0.05, 0.0),
        (22.0, 16.2, 0.8, -0.14, -0.10, 0.0),
        (24.0, 12.0, 5.8, 0.04, 0.04, 0.0),
        (36.0, 16.8, -5.6, 0.08, 0.03, 0.0),
        (18.0, 15.5, 0.6, -0.10, -0.06, 0.0),
        (20.0, 12.2, 4.2, 0.04, 0.02, 0.0),
        (32.0, 17.0, -4.6, 0.10, 0.04, 0.0),
        (30.0, 15.6, -0.3, -0.95, -0.42, 0.0),
        (20.0, 15.2, 0.1, -0.45, -0.18, 0.0),
        (22.0, 16.0, 0.0, 0.04, 0.04, 2.0),
        (16.0, 10.5, 1.6, 0.04, 0.00, 0.0),
        (20.0, 5.8, -0.4, 0.02, 0.00, 0.0),
        (8.0, 3.0, 0.0, 0.00, 0.00, 0.0),
    ]
    total = sum(p[0] for p in pieces)
    n = int(total / DS) + 2
    elev = np.zeros(n, dtype=np.float64)
    heading = np.zeros(n, dtype=np.float64)
    roll = np.zeros(n, dtype=np.float64)
    speed = np.zeros(n, dtype=np.float64)
    lift = np.zeros(n, dtype=np.float64)
    tunnel = np.zeros(n, dtype=np.float64)
    x = np.zeros(n, dtype=np.float64)
    z = np.zeros(n, dtype=np.float64)
    s_at = np.arange(n, dtype=np.float64) * DS

    cursor = 0.0
    e = 8.4
    h = 0.0
    for length, spd, de, dh, rl, flags in pieces:
        for _ in range(int(round(length / DS))):
            i = int(round(cursor / DS))
            if i >= n:
                break
            speed[i] = spd
            lift[i] = 1.0 if flags == 1.0 else 0.0
            tunnel[i] = 1.0 if flags == 2.0 else 0.0
            elev[i] = e
            heading[i] = h
            roll[i] = rl
            e += de / max(length, 0.01) * DS
            h += dh / max(length, 0.01) * DS
            cursor += DS
    for i in range(1, n):
        if speed[i] == 0:
            speed[i] = speed[i - 1]
            elev[i] = elev[i - 1]
            heading[i] = heading[i - 1]
            roll[i] = roll[i - 1]
            lift[i] = lift[i - 1]
            tunnel[i] = tunnel[i - 1]
        x[i] = x[i - 1] + math.sin(heading[i - 1]) * DS
        z[i] = z[i - 1] + math.cos(heading[i - 1]) * DS

    times = [0.0]
    for i in range(1, n):
        times.append(times[-1] + DS / max(speed[i], 0.8))
    return {
        "s": s_at,
        "x": x,
        "y": elev,
        "z": z,
        "heading": heading,
        "roll": roll,
        "speed": speed,
        "lift": lift,
        "tunnel": tunnel,
        "t": np.array(times, dtype=np.float64),
    }


def sample_idx(arrays: dict[str, np.ndarray], s: float) -> int:
    return int(np.clip(s / DS, 0, arrays["s"].size - 1))


def cam_at(arrays: dict[str, np.ndarray], t: float) -> Cam:
    """Interpolate pose so every 24fps tick is a new spatial sample."""
    ts = arrays["t"]
    t = float(np.clip(t, ts[0], ts[-1]))
    i1 = int(np.clip(np.searchsorted(ts, t), 1, ts.size - 1))
    i0 = i1 - 1
    span = max(ts[i1] - ts[i0], 1e-6)
    u = (t - ts[i0]) / span
    def L(name: str) -> float:
        return float(arrays[name][i0] + (arrays[name][i1] - arrays[name][i0]) * u)

    return Cam(
        x=L("x"),
        y=L("y"),
        z=L("z"),
        heading=L("heading"),
        roll=L("roll"),
        s=L("s"),
        speed=L("speed"),
        lift=L("lift"),
        tunnel=L("tunnel"),
        i=i0,
    )


def project(cam: Cam, px: float, py: float, pz: float, pitch: float) -> tuple[float, float, float] | None:
    rx = px - cam.x
    ry = py - cam.y - CAM_H
    rz = pz - cam.z
    ch, sh = math.cos(-cam.heading), math.sin(-cam.heading)
    xr = rx * ch - rz * sh
    zr = rx * sh + rz * ch
    cp, sp = math.cos(pitch), math.sin(pitch)
    yr = ry * cp - zr * sp
    zr = ry * sp + zr * cp
    if abs(cam.roll) > 0.001:
        cr, sr = math.cos(-cam.roll), math.sin(-cam.roll)
        xr, yr = xr * cr - yr * sr, xr * sr + yr * cr
    if zr < 0.45:
        return None
    return CX + FOCAL * xr / zr, CY - FOCAL * yr / zr, zr


def fill_trap(
    img: np.ndarray,
    y0: float,
    l0: float,
    r0: float,
    y1: float,
    l1: float,
    r1: float,
    color: np.ndarray,
    y_clip: int = 0,
) -> None:
    vals = (y0, l0, r0, y1, l1, r1)
    if any(not math.isfinite(v) or abs(v) > 12000 for v in vals):
        return
    if y1 < y0:
        y0, y1, l0, l1, r0, r1 = y1, y0, l1, l0, r1, r0
    iy0 = int(math.floor(y0))
    iy1 = int(math.ceil(y1))
    if iy1 < 0 or iy0 >= H:
        return
    iy0 = max(iy0, 0, y_clip)
    iy1 = min(iy1, H - 1)
    span = max(y1 - y0, 1e-3)
    for y in range(iy0, iy1 + 1):
        u = (y - y0) / span
        xl = int(l0 + (l1 - l0) * u)
        xr = int(r0 + (r1 - r0) * u)
        if xr < xl:
            xl, xr = xr, xl
        xl = max(xl, 0)
        xr = min(xr, W)
        if xr > xl:
            img[y, xl:xr] = color


def onish(p) -> bool:
    return p is not None and -180 < p[0] < W + 180 and -120 < p[1] < H + 120


def dirt_ok(a, b, c, d) -> bool:
    if not all(onish(p) for p in (a, b, c, d)):
        return False
    xs = [p[0] for p in (a, b, c, d)]
    ys = [p[1] for p in (a, b, c, d)]
    if max(xs) - min(xs) > W * 0.72:
        return False
    if max(ys) - min(ys) > H * 0.32:
        return False
    return True


def bed_ok(a, b, c, d) -> bool:
    if not all(onish(p) for p in (a, b, c, d)):
        return False
    xs = [p[0] for p in (a, b, c, d)]
    ys = [p[1] for p in (a, b, c, d)]
    if max(xs) - min(xs) > W * 1.05:
        return False
    if max(ys) - min(ys) > H * 0.22:
        return False
    return True


def draw_disk(img: np.ndarray, x: float, y: float, r: float, color: np.ndarray) -> None:
    ix, iy, ir = int(x), int(y), max(int(r), 1)
    y0, y1 = max(iy - ir, 0), min(iy + ir + 1, H)
    x0, x1 = max(ix - ir, 0), min(ix + ir + 1, W)
    if y1 <= y0 or x1 <= x0:
        return
    yy, xx = np.ogrid[y0:y1, x0:x1]
    mask = (xx - x) ** 2 + (yy - y) ** 2 <= r * r
    img[y0:y1, x0:x1][mask] = color


def stroke(
    img: np.ndarray,
    a: tuple[float, float],
    b: tuple[float, float],
    color: np.ndarray,
    thick: float,
    max_dist: float = 900.0,
) -> None:
    x0, y0 = a
    x1, y1 = b
    if not all(math.isfinite(v) for v in (x0, y0, x1, y1)):
        return
    if max(abs(x0), abs(y0), abs(x1), abs(y1)) > 8000:
        return
    dist = math.hypot(x1 - x0, y1 - y0)
    if dist > max_dist:
        return
    steps = max(int(dist), 1)
    half = max(min(int(round(thick)), 12), 1)
    for s in range(steps + 1):
        u = s / steps
        x = x0 + (x1 - x0) * u
        y = y0 + (y1 - y0) * u
        ix, iy = int(round(x)), int(round(y))
        img[max(iy - half // 2, 0) : min(iy + half // 2 + 1, H), max(ix - half, 0) : min(ix + half + 1, W)] = color


def lateral(arrays: dict[str, np.ndarray], k: int, lat: float) -> tuple[float, float]:
    h = arrays["heading"][k]
    return arrays["x"][k] + math.cos(h) * lat, arrays["z"][k] - math.sin(h) * lat


def load_mats() -> Mats:
    high = load_rgb(os.path.join(IMG_DIR, "carnival-coaster-lift-high.jpg"))
    lift = load_rgb(os.path.join(IMG_DIR, "carnival-coaster-lift.jpg"))
    dispatch = load_rgb(os.path.join(IMG_DIR, "carnival-coaster-dispatch.jpg"))
    # Dusk only — crop well above the photographed track/shack so the sky is not a ride plate.
    sky_band = high[:118]
    # Fade the last rows toward a dark treeline so no shack silhouette rides the horizon.
    fade = np.linspace(1.0, 0.22, 18, dtype=np.float32)[:, None, None]
    sky_band[-18:] = sky_band[-18:] * fade + np.array([24, 22, 20], dtype=np.float32) * (1 - fade)
    sky = np.concatenate([sky_band, np.fliplr(sky_band), sky_band], axis=1)

    dash = np.zeros_like(dispatch)
    top = int(H * 0.82)
    dash[top:] = dispatch[top:]
    fade = np.linspace(0, 1, 28, dtype=np.float32)[:, None, None]
    dash[top : top + 28] *= fade

    return Mats(
        sky=sky,
        dash=dash,
        wood=mean_color(lift, 470, 600, 420, 860),
        tie=mean_color(dispatch, 530, 610, 380, 900),
        dirt=mean_color(lift, 500, 620, 40, 180),
        walk=mean_color(lift, 500, 580, 560, 720),
    )


def paint_sky(mats: Mats, heading: float, pitch: float, tunnel_amt: float) -> np.ndarray:
    img = np.zeros((H, W, 3), dtype=np.float32)
    sky = mats.sky
    sh, sw = sky.shape[0], sky.shape[1]
    ox = int((heading / (2 * math.pi)) * W) % max(sw - W, 1)
    horizon = int(np.clip(CY + 18 + pitch * 90, 210, H - 80))
    # Photograph fills the sky; below the horizon stays dark so the 3D track can read.
    for y in range(horizon):
        sy = int(y * (sh - 1) / max(horizon, 1))
        img[y] = sky[sy, ox : ox + W]
    # Thin photographed treeline, then dark ground (not a still of the rails).
    ridge = img[max(horizon - 16, 0) : horizon]
    ridge[:] = ridge * 0.18 + np.array([22, 28, 18], dtype=np.float32)
    img[horizon:] = np.array([28, 22, 16], dtype=np.float32)
    if tunnel_amt > 0:
        img[:] = img * (1 - tunnel_amt) + TUNNEL * tunnel_amt
    return img


def draw_pine(img: np.ndarray, x: float, y: float, h: float) -> None:
    hh = int(h)
    ww = max(int(h * 0.42), 4)
    ix, iy = int(x), int(y)
    trunk_h = max(int(hh * 0.22), 5)
    tw = max(int(ww * 0.12), 2)
    img[max(iy - trunk_h, 0) : min(iy + 1, H), max(ix - tw, 0) : min(ix + tw + 1, W)] = TRUNK
    for k, col in ((1.0, PINE), (0.64, PINE2), (0.34, PINE)):
        half_w = max(int(ww * k), 2)
        th = max(int(hh * (0.92 - k * 0.28)), 5)
        y1 = iy - trunk_h - int((1 - k) * hh * 0.38)
        y0 = y1 - th
        for row in range(max(y0, 0), min(y1, H)):
            u = (row - y0) / max(th, 1)
            half = max(int(half_w * u), 1)
            x0, x1 = max(ix - half, 0), min(ix + half, W)
            if x1 > x0:
                img[row, x0:x1] = col


def make_side_props(arrays: dict[str, np.ndarray], rng: np.random.Generator) -> list[tuple[float, float, float, str, float]]:
    props = []
    s_end = float(arrays["s"][-1])
    s = 1.2
    while s < s_end - 3:
        i = sample_idx(arrays, s)
        for side in (-1.0, 1.0):
            lat = side * rng.uniform(4.3, 9.4)
            px = arrays["x"][i] + math.cos(arrays["heading"][i]) * lat
            pz = arrays["z"][i] - math.sin(arrays["heading"][i]) * lat
            kind = "pine" if rng.random() > 0.18 else "lamp"
            ht = rng.uniform(5.2, 9.4) if kind == "pine" else 2.6
            props.append((px, 0.0, pz, kind, ht))
        s += rng.uniform(1.6, 2.8)
    return props


def render_frame(arrays: dict[str, np.ndarray], cam: Cam, props, mats: Mats) -> np.ndarray:
    look = min(cam.i + 14, arrays["s"].size - 1)
    run = max(arrays["s"][look] - cam.s, 0.2)
    slope = math.atan2(arrays["y"][look] - cam.y, run)
    # Enough pitch to read a drop; not so much the near deck becomes a wall.
    pitch = slope * 0.44 - 0.10
    tun = cam.tunnel
    horizon = int(np.clip(CY + 18 + pitch * 90, 210, H - 80))
    img = paint_sky(mats, cam.heading, pitch, tun)
    s0 = cam.s
    i_end = min(arrays["s"].size - 1, cam.i + int(DRAW_AHEAD / DS))

    prev = None
    rail_l: list[tuple[float, float]] = []
    rail_r: list[tuple[float, float]] = []
    for k in range(i_end, cam.i, -1):
        d = arrays["s"][k] - s0
        if d < 1.15:
            continue
        xl, zl = lateral(arrays, k, -TRACK_W)
        xr, zr = lateral(arrays, k, TRACK_W)
        p_l = project(cam, xl, arrays["y"][k], zl, pitch)
        p_r = project(cam, xr, arrays["y"][k], zr, pitch)
        if p_l is None or p_r is None:
            prev = None
            continue
        fog = min(d / DRAW_AHEAD, 1.0)
        wood = mats.wood * (1 - 0.28 * fog)
        if tun > 0.5:
            wood = wood * 0.28
        if prev is not None and bed_ok(prev[0], prev[1], p_l, p_r):
            fill_trap(img, prev[0][1], prev[0][0], prev[1][0], p_l[1], p_l[0], p_r[0], wood, horizon)
        prev = (p_l, p_r)

        rlx, rlz = lateral(arrays, k, -RAIL_IN)
        rrx, rrz = lateral(arrays, k, RAIL_IN)
        pl = project(cam, rlx, arrays["y"][k] + 0.08, rlz, pitch)
        pr = project(cam, rrx, arrays["y"][k] + 0.08, rrz, pitch)
        if pl:
            rail_l.append((pl[0], pl[1]))
        if pr:
            rail_r.append((pr[0], pr[1]))

        if cam.lift > 0.5 and abs((arrays["s"][k] % 0.38) - 0.19) < DS * 0.7:
            pc = project(cam, arrays["x"][k], arrays["y"][k] + 0.05, arrays["z"][k], pitch)
            if pc is not None:
                tw = max(2, int(7 * (2.2 / max(d, 1.0))))
                x0 = int(np.clip(pc[0] - tw, 0, W - 1))
                y0 = int(np.clip(pc[1] - 1, 0, H - 1))
                img[y0 : min(y0 + tw, H), x0 : min(x0 + tw * 2, W)] = CHAIN

    t_far = int((s0 + DRAW_AHEAD) / TIE_STEP)
    t_near = int((s0 + 0.35) / TIE_STEP)
    for ti in range(t_far, t_near - 1, -1):
        ts = ti * TIE_STEP
        k = sample_idx(arrays, ts)
        d = ts - s0
        if d < 0.35:
            continue
        k2 = sample_idx(arrays, ts + TIE_DEPTH)
        xl, zl = lateral(arrays, k, -TRACK_W * 0.96)
        xr, zr = lateral(arrays, k, TRACK_W * 0.96)
        xl2, zl2 = lateral(arrays, k2, -TRACK_W * 0.96)
        xr2, zr2 = lateral(arrays, k2, TRACK_W * 0.96)
        a = project(cam, xl, arrays["y"][k] + 0.03, zl, pitch)
        b = project(cam, xr, arrays["y"][k] + 0.03, zr, pitch)
        c = project(cam, xr2, arrays["y"][k2] + 0.03, zr2, pitch)
        e = project(cam, xl2, arrays["y"][k2] + 0.03, zl2, pitch)
        if a and b and onish(a) and onish(b) and abs(a[0] - b[0]) < W * 0.92 and min(a[1], b[1]) > horizon - 36:
            fog = min(d / DRAW_AHEAD, 1.0)
            col = mats.tie * (1 - 0.25 * fog)
            thick = max(3.0, min(14.0, 16.0 * (2.2 / max(d, 0.9))))
            stroke(img, (a[0], a[1]), (b[0], b[1]), col, thick, max_dist=520)
            if c and e and onish(c) and onish(e) and abs(a[1] - e[1]) < 70:
                fill_trap(img, a[1], a[0], b[0], e[1], e[0], c[0], col, horizon)
            if d < 16:
                stroke(img, (a[0], a[1]), (b[0], b[1]), TIE_HI * (1 - 0.2 * fog), max(1.5, thick * 0.35), max_dist=520)

    prev_w = None
    for k in range(i_end, cam.i, -1):
        d = arrays["s"][k] - s0
        if d < 0.55:
            continue
        wl, zl = lateral(arrays, k, -0.20)
        wr, zr = lateral(arrays, k, 0.20)
        a = project(cam, wl, arrays["y"][k] + 0.02, zl, pitch)
        b = project(cam, wr, arrays["y"][k] + 0.02, zr, pitch)
        if a is None or b is None:
            prev_w = None
            continue
        if prev_w is not None and bed_ok(prev_w[0], prev_w[1], a, b):
            fill_trap(
                img,
                prev_w[0][1],
                prev_w[0][0],
                prev_w[1][0],
                a[1],
                a[0],
                b[0],
                mats.walk * (1 - 0.3 * min(d / DRAW_AHEAD, 1)),
                horizon,
            )
        prev_w = (a, b)

    for pts in (rail_l, rail_r):
        for a, b in zip(pts, pts[1:]):
            stroke(img, a, b, RAIL_SHADOW, 6.0, max_dist=260)
            stroke(img, a, b, RAIL, 3.4, max_dist=260)

    p_far = int((s0 + 72) / POST_STEP)
    p_near = int((s0 + 0.8) / POST_STEP)
    for pi in range(p_far, p_near - 1, -1):
        ps = pi * POST_STEP
        k = sample_idx(arrays, ps)
        d = ps - s0
        if d < 0.8:
            continue
        fog = min(d / DRAW_AHEAD, 1.0)
        for side in (-TRACK_W * 1.02, TRACK_W * 1.02):
            bx, bz = lateral(arrays, k, side)
            base = project(cam, bx, arrays["y"][k] - 0.05, bz, pitch)
            top = project(cam, bx, arrays["y"][k] + 1.35, bz, pitch)
            if base is None or top is None:
                continue
            stroke(img, (base[0], base[1]), (top[0], top[1]), WOOD_DK, max(2.0, 7.5 * (2.2 / max(d, 1.1))), max_dist=380)
            if d < 48:
                draw_disk(img, top[0], top[1], max(1.6, 6.2 * (2.2 / max(d, 1.2))), BULB * (1 - fog * 0.35))

    for px, py, pz, kind, ht in props:
        dx = px - cam.x
        dz = pz - cam.z
        if dx * dx + dz * dz > DRAW_AHEAD * DRAW_AHEAD:
            continue
        pr = project(cam, px, py, pz, pitch)
        if pr is None:
            continue
        if kind == "pine":
            draw_pine(img, pr[0], pr[1], (ht * 38) * (2.6 / max(pr[2], 1.8)))
        else:
            top = project(cam, px, py + ht, pz, pitch)
            if top:
                stroke(img, (pr[0], pr[1]), (top[0], top[1]), WOOD_DK, max(2.0, 6.0 * (2.2 / max(pr[2], 1.2))))
                draw_disk(img, top[0], top[1], max(1.8, 5.5 * (2.2 / max(pr[2], 1.2))), BULB)

    dash_mask = mats.dash.sum(axis=2) > 12
    img[dash_mask] = mats.dash[dash_mask]
    return np.clip(img, 0, 255).astype(np.uint8)


def bandlimited(n: int, rng: np.random.Generator, lo: float, hi: float) -> np.ndarray:
    noise = rng.normal(0, 1, n).astype(np.float32)
    spec = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec *= ((freqs >= lo) & (freqs <= hi)).astype(np.float32)
    y = np.fft.irfft(spec, n=n).astype(np.float32)
    peak = float(np.max(np.abs(y))) or 1.0
    return y / peak


def synth_mech(seconds: float, arrays: dict[str, np.ndarray], t0: float) -> np.ndarray:
    n = int(round(seconds * SR))
    t = np.arange(n, dtype=np.float32) / SR + t0
    cam = np.clip(np.searchsorted(arrays["t"], t), 0, arrays["speed"].size - 1)
    speed_n = np.clip(arrays["speed"][cam].astype(np.float32) / 18.0, 0, 1)
    ahead = np.clip(cam + 10, 0, arrays["y"].size - 1)
    falling = np.clip((arrays["y"][cam] - arrays["y"][ahead]) / 4.0, 0, 1).astype(np.float32)
    rng = np.random.default_rng(5)
    roar = bandlimited(n, rng, 40, 380)
    wind = bandlimited(n, rng, 900, 4800)
    bed = np.zeros((2, n), dtype=np.float32)
    bed += roar * (0.020 + speed_n * 0.09 + falling * 0.07)
    bed += wind * (speed_n**1.3 * (0.025 + 0.10 * falling))

    def click() -> np.ndarray:
        m = int(0.08 * SR)
        tt = np.arange(m, dtype=np.float32) / SR
        y = 0.70 * np.sin(2 * np.pi * 1480 * tt) * np.exp(-tt * 42)
        y += 0.36 * np.sin(2 * np.pi * 620 * tt) * np.exp(-tt * 28)
        return y.astype(np.float32)

    t_clack = t0
    while t_clack < t0 + seconds:
        idx = int(np.clip(np.searchsorted(arrays["t"], t_clack), 0, arrays["lift"].size - 1))
        i0 = int((t_clack - t0) * SR)
        if 0 <= i0 < n and arrays["lift"][idx] > 0.5:
            ck = click() * 0.32
            sl = ck[: max(0, n - i0)]
            if sl.size:
                bed[0, i0 : i0 + sl.size] += sl
                bed[1, i0 : i0 + sl.size] += sl * 0.92
            t_clack += 0.28
        else:
            t_clack += 0.2
    peak = float(np.max(np.abs(bed))) or 1.0
    return np.clip(bed * (0.58 / peak), -1, 1)


def write_wav(path: str, stereo: np.ndarray) -> None:
    interleaved = np.empty(stereo.shape[1] * 2, dtype=np.int16)
    interleaved[0::2] = (np.clip(stereo[0], -1, 1) * 32767).astype(np.int16)
    interleaved[1::2] = (np.clip(stereo[1], -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(interleaved.tobytes())


def write_jpg(frame: np.ndarray, dest: str) -> None:
    ppm = "/tmp/_ridge_frame.ppm"
    with open(ppm, "wb") as f:
        f.write(f"P6\n{W} {H}\n255\n".encode())
        f.write(frame.tobytes())
    subprocess.check_call(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", ppm, "-q:v", "3", dest])


def dump_stills(arrays: dict[str, np.ndarray], props, mats: Mats, times: list[float], dest_dir: str) -> None:
    os.makedirs(dest_dir, exist_ok=True)
    for t in times:
        cam = cam_at(arrays, t)
        frame = render_frame(arrays, cam, props, mats)
        jpg = f"{dest_dir}/t{t:.2f}.jpg"
        write_jpg(frame, jpg)
        print(f"dump {jpg} s={cam.s:.2f} elev={cam.y:.1f} spd={cam.speed:.1f}", flush=True)


def main() -> None:
    preview = "--preview" in sys.argv
    dump_only = "--dump" in sys.argv
    arrays = section_path()
    raw_duration = float(arrays["t"][-1])
    start_t = 0.12
    duration = min(FILM_SECONDS, max(raw_duration - start_t, 1.0))
    if preview:
        duration = min(8.0, duration)
    print(f"path {arrays['s'][-1]:.1f}m path_time={raw_duration:.2f}s film={duration:.2f}s start={start_t:.2f}", flush=True)
    rng = np.random.default_rng(11)
    props = make_side_props(arrays, rng)
    print("load photoreal materials", flush=True)
    mats = load_mats()
    if dump_only:
        times = [start_t + dt for dt in (0.00, 1 / 24, 2 / 24, 0.50, 2.0, 5.5, 7.0, 9.0, 12.0, 16.0, 20.0, 24.0, 28.0)]
        times = [min(max(t, 0.0), raw_duration - 0.05) for t in times]
        dump_stills(arrays, props, mats, times, "/tmp/pov-dump")
        return

    frames = int(round(duration * FPS))
    print(f"frames={frames} ({FPS} fps, interpolated camera each frame)", flush=True)
    tmp = "/tmp/ridge-pov.mp4"
    ff = subprocess.Popen(
        [
            "ffmpeg",
            "-y",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-s",
            f"{W}x{H}",
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
            "18",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            tmp,
        ],
        stdin=subprocess.PIPE,
    )
    assert ff.stdin is not None
    t0 = time.time()
    last_s = None
    unique = 0
    min_ds = 1e9
    for n in range(frames):
        t = n / FPS + start_t
        cam = cam_at(arrays, min(t, raw_duration))
        if last_s is None or abs(cam.s - last_s) > 1e-4:
            unique += 1
            if last_s is not None:
                min_ds = min(min_ds, abs(cam.s - last_s))
            last_s = cam.s
        frame = render_frame(arrays, cam, props, mats)
        ff.stdin.write(frame.tobytes())
        if n % 24 == 0:
            print(
                f"frame {n}/{frames} s={cam.s:.2f} elev={cam.y:.1f} spd={cam.speed:.1f} "
                f"render={(n + 1) / max(time.time() - t0, 0.01):.1f}fps",
                flush=True,
            )
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg video failed")
    print(f"unique camera stations={unique}/{frames} min_ds={min_ds:.4f}m", flush=True)
    if unique < frames:
        raise SystemExit(f"duplicate viewpoints ({unique}/{frames}) — refusing slideshow")

    audio = "/tmp/ridge-pov.wav"
    write_wav(audio, synth_mech(frames / FPS, arrays, t0=start_t))
    dest = OUT if not preview else "/tmp/ridge-pov-preview.mp4"
    mux = "/tmp/ridge-pov-mux.mp4"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            tmp,
            "-i",
            audio,
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "96k",
            "-shortest",
            "-movflags",
            "+faststart",
            mux,
        ]
    )
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    os.replace(mux, dest)
    print(f"wrote {dest} duration={frames / FPS:.2f}", flush=True)


if __name__ == "__main__":
    main()
