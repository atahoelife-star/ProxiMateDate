#!/usr/bin/env python3
"""Ridge Runner: generated on-train POV with real forward travel.

The camera advances along a 3D wooden track every frame. Rails, ties, timber,
and trees have world positions — they translate past the lens. No Ken Burns,
no earthquake shake. Pinewick layout only. Quiet placeholder audio.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import time
import wave

import numpy as np

OUT = "/workspace/public/videos/carnival/coaster.mp4"
IMG = "/workspace/public/images/carnival/carnival-coaster-dispatch.jpg"
W, H = 1280, 720
FPS = 24
SR = 44100
FOCAL = 580.0
CX, CY = (W - 1) / 2.0, 338.0
CAM_H = 0.86
DS = 0.28
TRACK_W = 1.18
RAIL_IN = 0.44
TIE_STEP = 0.46
TIE_DEPTH = 0.16
POST_STEP = 1.55
DRAW_AHEAD = 88.0

# Pinewick dusk
SKY_TOP = np.array([22, 16, 28], dtype=np.float32)
SKY_HORIZ = np.array([196, 118, 72], dtype=np.float32)
SKY_GLOW = np.array([232, 168, 88], dtype=np.float32)
WOOD = np.array([186, 148, 102], dtype=np.float32)
WOOD_EDGE = np.array([118, 86, 56], dtype=np.float32)
WOOD_DK = np.array([48, 32, 22], dtype=np.float32)
TIE = np.array([42, 26, 14], dtype=np.float32)
TIE_HI = np.array([78, 52, 30], dtype=np.float32)
RAIL = np.array([228, 232, 238], dtype=np.float32)
RAIL_SHADOW = np.array([70, 62, 54], dtype=np.float32)
WALK = np.array([164, 124, 82], dtype=np.float32)
DIRT = np.array([82, 64, 46], dtype=np.float32)
CHAIN = np.array([36, 36, 38], dtype=np.float32)
PINE = np.array([32, 52, 28], dtype=np.float32)
PINE2 = np.array([48, 74, 38], dtype=np.float32)
TRUNK = np.array([54, 38, 26], dtype=np.float32)
BULB = np.array([255, 210, 110], dtype=np.float32)
TUNNEL = np.array([8, 6, 7], dtype=np.float32)


def smooth(x: float) -> float:
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def section_path() -> tuple[np.ndarray, dict[str, np.ndarray]]:
    """Build a compact original woodie: lift, drop, hills, bank, tunnel, home."""
    pieces: list[tuple[float, float, float, float, float, float]] = []
    # length, speed, d_elev, d_heading, roll, flags(lift=1, tunnel=2)
    pieces += [
        (6.0, 4.4, 0.0, 0.02, 0.0, 0.0),  # dispatch
        (10.0, 2.9, 0.4, 0.06, 0.0, 1.0),  # chain
        (88.0, 2.35, 21.5, 0.02, 0.0, 1.0),  # lift
        (10.0, 2.1, 0.4, 0.00, 0.0, 1.0),  # hang
        (8.0, 4.5, -2.2, 0.00, 0.0, 0.0),  # crest
        (38.0, 17.5, -17.8, 0.06, 0.05, 0.0),  # drop
        (28.0, 16.0, 1.2, -0.18, -0.12, 0.0),  # valley
        (24.0, 13.5, 6.8, 0.04, 0.04, 0.0),  # airtime climb
        (22.0, 14.5, -5.4, 0.08, 0.02, 0.0),  # camel
        (36.0, 15.5, -0.6, -0.95, -0.42, 0.0),  # bank left
        (30.0, 15.0, 0.4, -0.70, -0.28, 0.0),  # turn
        (28.0, 15.8, 0.2, -0.85, -0.38, 0.0),  # helix
        (14.0, 15.0, -0.4, -0.12, -0.08, 0.0),  # portal
        (32.0, 16.2, 0.0, 0.05, 0.04, 2.0),  # tunnel
        (16.0, 14.0, 0.8, 0.08, 0.00, 0.0),  # exit
        (22.0, 10.5, 3.4, 0.04, 0.00, 0.0),  # climbout
        (36.0, 5.5, -0.8, 0.02, 0.00, 0.0),  # brakes
        (22.0, 2.8, 0.0, 0.00, 0.00, 0.0),  # home
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
    e = 0.0
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
        # fill any leftover index at section end
    # integrate xz
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

    # time table: s(t)
    times = [0.0]
    for i in range(1, n):
        times.append(times[-1] + DS / max(speed[i], 0.8))
    t = np.array(times, dtype=np.float64)
    arrays = {
        "s": s_at,
        "x": x,
        "y": elev,
        "z": z,
        "heading": heading,
        "roll": roll,
        "speed": speed,
        "lift": lift,
        "tunnel": tunnel,
        "t": t,
    }
    return s_at, arrays


def sample_idx(arrays: dict[str, np.ndarray], s: float) -> int:
    return int(np.clip(s / DS, 0, arrays["s"].size - 1))


def cam_of_time(arrays: dict[str, np.ndarray], t: float) -> int:
    return int(np.clip(np.searchsorted(arrays["t"], t), 0, arrays["t"].size - 1))


def project(arrays: dict[str, np.ndarray], i: int, px: float, py: float, pz: float, pitch: float) -> tuple[float, float, float] | None:
    h = arrays["heading"][i]
    rx = px - arrays["x"][i]
    ry = py - arrays["y"][i] - CAM_H
    rz = pz - arrays["z"][i]
    ch, sh = math.cos(-h), math.sin(-h)
    xr = rx * ch - rz * sh
    zr = rx * sh + rz * ch
    cp, sp = math.cos(pitch), math.sin(pitch)
    yr = ry * cp - zr * sp
    zr = ry * sp + zr * cp
    rl = arrays["roll"][i]
    if abs(rl) > 0.001:
        cr, sr = math.cos(-rl), math.sin(-rl)
        xr, yr = xr * cr - yr * sr, xr * sr + yr * cr
    if zr < 0.45:
        return None
    return CX + FOCAL * xr / zr, CY - FOCAL * yr / zr, zr


def fill_trap(img: np.ndarray, y0: float, l0: float, r0: float, y1: float, l1: float, r1: float, color: np.ndarray) -> None:
    vals = (y0, l0, r0, y1, l1, r1)
    if any(not math.isfinite(v) or abs(v) > 12000 for v in vals):
        return
    if y1 < y0:
        y0, y1, l0, l1, r0, r1 = y1, y0, l1, l0, r1, r0
    iy0 = int(math.floor(y0))
    iy1 = int(math.ceil(y1))
    if iy1 < 0 or iy0 >= H:
        return
    iy0 = max(iy0, 0)
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
    """Reject side-dirt quads that become a wall or a screen wipe."""
    if not all(onish(p) for p in (a, b, c, d)):
        return False
    xs = [p[0] for p in (a, b, c, d)]
    ys = [p[1] for p in (a, b, c, d)]
    if max(xs) - min(xs) > W * 0.72:
        return False
    if max(ys) - min(ys) > H * 0.38:
        return False
    return True


def bed_ok(a, b, c, d) -> bool:
    if not all(onish(p) for p in (a, b, c, d)):
        return False
    xs = [p[0] for p in (a, b, c, d)]
    ys = [p[1] for p in (a, b, c, d)]
    if max(xs) - min(xs) > W * 1.15:
        return False
    if max(ys) - min(ys) > H * 0.42:
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
    patch = img[y0:y1, x0:x1]
    patch[mask] = color


def stroke(img: np.ndarray, a: tuple[float, float], b: tuple[float, float], color: np.ndarray, thick: float) -> None:
    """World-projected polyline segment — thick enough that rails read as steel, not dots."""
    x0, y0 = a
    x1, y1 = b
    steps = max(int(math.hypot(x1 - x0, y1 - y0)), 1)
    half = max(int(round(thick)), 1)
    for s in range(steps + 1):
        u = s / steps
        x = x0 + (x1 - x0) * u
        y = y0 + (y1 - y0) * u
        ix, iy = int(round(x)), int(round(y))
        img[max(iy - half // 2, 0) : min(iy + half // 2 + 1, H), max(ix - half, 0) : min(ix + half + 1, W)] = color


def lateral(arrays: dict[str, np.ndarray], k: int, lat: float) -> tuple[float, float]:
    h = arrays["heading"][k]
    return arrays["x"][k] + math.cos(h) * lat, arrays["z"][k] - math.sin(h) * lat


def paint_sky(pitch: float, tunnel_amt: float) -> np.ndarray:
    img = np.zeros((H, W, 3), dtype=np.float32)
    ys = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    shift = np.clip(ys + pitch * 0.12, 0, 1)
    sky = SKY_TOP * (1 - shift) + SKY_HORIZ * shift
    glow = np.exp(-((np.arange(W) - W * 0.62) / 220.0) ** 2)[None, :] * np.exp(-((np.arange(H) - (CY + 40)) / 90.0) ** 2)[:, None]
    sky = sky + glow[..., None] * (SKY_GLOW - sky) * 0.55
    # distant ridge silhouette — scrolls only with heading, not a still plate
    ridge_y = int(CY + 28 + pitch * 70)
    img[:] = sky
    if 0 < ridge_y < H - 4:
        # Thin distant ridge only. The lower frame must stay free for the generated track.
        band = img[ridge_y : min(ridge_y + 18, H)]
        band[:] = band * 0.22 + np.array([18, 16, 14], dtype=np.float32)
        for i in range(0, W, 18):
            ht = 10 + (i * 7) % 14
            y0 = max(ridge_y - ht, 0)
            img[y0:ridge_y, i : min(i + 14, W)] = np.array([28, 36, 22], dtype=np.float32)
    if tunnel_amt > 0:
        img[:] = img * (1 - tunnel_amt) + TUNNEL * tunnel_amt
    return img


def load_dash() -> np.ndarray:
    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            IMG,
            "-vf",
            f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-frames:v",
            "1",
            "pipe:1",
        ]
    )
    full = np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 3).astype(np.float32)
    # keep the car / lap bar only
    crop = np.zeros_like(full)
    # lap bar / hands only — do not keep the photo's own track
    top = int(H * 0.82)
    crop[top:] = full[top:]
    fade = np.linspace(0, 1, 28, dtype=np.float32)[:, None, None]
    crop[top : top + 28] *= fade
    return crop


def make_side_props(arrays: dict[str, np.ndarray], rng: np.random.Generator) -> list[tuple[float, float, float, str, float]]:
    """Trees sit on the ground (y=0), not at rail height — so they do not float."""
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


def render_frame(arrays: dict[str, np.ndarray], i: int, props, dash: np.ndarray) -> np.ndarray:
    # Follow the slope gently and keep a little look-down so the deck
    # stays in frame. Full slope-pitch turns the lift into a brown wall.
    j = min(i + 10, arrays["s"].size - 1)
    run = max(arrays["s"][j] - arrays["s"][i], 0.2)
    pitch = math.atan2(arrays["y"][j] - arrays["y"][i], run) * 0.38 - 0.11
    tun = float(arrays["tunnel"][i])
    img = paint_sky(pitch, tun)
    s0 = float(arrays["s"][i])
    i_end = min(arrays["s"].size - 1, i + int(DRAW_AHEAD / DS))

    # Side dirt ribbons + pale track bed, far to near.
    prev = None
    rail_l: list[tuple[float, float]] = []
    rail_r: list[tuple[float, float]] = []
    for k in range(i_end, i, -1):
        d = arrays["s"][k] - s0
        if d < 1.05:
            continue
        xl, zl = lateral(arrays, k, -TRACK_W)
        xr, zr = lateral(arrays, k, TRACK_W)
        p_l = project(arrays, i, xl, arrays["y"][k], zl, pitch)
        p_r = project(arrays, i, xr, arrays["y"][k], zr, pitch)
        # Thin dirt ribbons beside the deck — not a ground plane that can wipe the frame.
        dlx, dlz = lateral(arrays, k, -3.2)
        drx, drz = lateral(arrays, k, 3.2)
        g_l = project(arrays, i, dlx, arrays["y"][k] - 0.12, dlz, pitch)
        g_r = project(arrays, i, drx, arrays["y"][k] - 0.12, drz, pitch)
        if p_l is None or p_r is None:
            prev = None
            continue
        fog = min(d / DRAW_AHEAD, 1.0)
        dirt = DIRT * (1 - 0.35 * fog)
        wood = WOOD * (1 - 0.28 * fog)
        if tun > 0.5:
            wood = wood * 0.28
            dirt = dirt * 0.18
        if prev is not None:
            if dirt_ok(prev[2], prev[0], g_l, p_l):
                fill_trap(img, prev[2][1], prev[2][0], prev[0][0], g_l[1], g_l[0], p_l[0], dirt)
            if dirt_ok(prev[1], prev[3], p_r, g_r):
                fill_trap(img, prev[3][1], prev[1][0], prev[3][0], g_r[1], p_r[0], g_r[0], dirt)
            if bed_ok(prev[0], prev[1], p_l, p_r):
                fill_trap(img, prev[0][1], prev[0][0], prev[1][0], p_l[1], p_l[0], p_r[0], wood)
        prev = (p_l, p_r, g_l, g_r)

        rlx, rlz = lateral(arrays, k, -RAIL_IN)
        rrx, rrz = lateral(arrays, k, RAIL_IN)
        pl = project(arrays, i, rlx, arrays["y"][k] + 0.08, rlz, pitch)
        pr = project(arrays, i, rrx, arrays["y"][k] + 0.08, rrz, pitch)
        if pl:
            rail_l.append((pl[0], pl[1]))
        if pr:
            rail_r.append((pr[0], pr[1]))

        if arrays["lift"][k] > 0.5 and abs((arrays["s"][k] % 0.38) - 0.19) < DS * 0.7:
            pc = project(arrays, i, arrays["x"][k], arrays["y"][k] + 0.05, arrays["z"][k], pitch)
            if pc is not None:
                tw = max(2, int(7 * (2.2 / max(d, 1.0))))
                x0 = int(np.clip(pc[0] - tw, 0, W - 1))
                y0 = int(np.clip(pc[1] - 1, 0, H - 1))
                img[y0 : min(y0 + tw, H), x0 : min(x0 + tw * 2, W)] = CHAIN

    # World-locked ties: dark rungs that translate toward the lens every frame.
    t_far = int((s0 + DRAW_AHEAD) / TIE_STEP)
    t_near = int((s0 + 0.4) / TIE_STEP)
    for ti in range(t_far, t_near - 1, -1):
        ts = ti * TIE_STEP
        k = sample_idx(arrays, ts)
        d = ts - s0
        if d < 0.4:
            continue
        k2 = sample_idx(arrays, ts + TIE_DEPTH)
        xl, zl = lateral(arrays, k, -TRACK_W * 0.96)
        xr, zr = lateral(arrays, k, TRACK_W * 0.96)
        xl2, zl2 = lateral(arrays, k2, -TRACK_W * 0.96)
        xr2, zr2 = lateral(arrays, k2, TRACK_W * 0.96)
        a = project(arrays, i, xl, arrays["y"][k] + 0.03, zl, pitch)
        b = project(arrays, i, xr, arrays["y"][k] + 0.03, zr, pitch)
        c = project(arrays, i, xr2, arrays["y"][k2] + 0.03, zr2, pitch)
        e = project(arrays, i, xl2, arrays["y"][k2] + 0.03, zl2, pitch)
        if a and b and onish(a) and onish(b) and abs(a[0] - b[0]) < W * 0.92:
            fog = min(d / DRAW_AHEAD, 1.0)
            col = TIE * (1 - 0.25 * fog)
            # Stroke a rung so ties stay visible even when the plank quad is huge.
            thick = max(3.0, 16.0 * (2.2 / max(d, 0.9)))
            stroke(img, (a[0], a[1]), (b[0], b[1]), col, thick)
            if c and e and onish(c) and onish(e) and abs(a[1] - e[1]) < 70:
                fill_trap(img, a[1], a[0], b[0], e[1], e[0], c[0], col)
            if d < 16:
                stroke(img, (a[0], a[1]), (b[0], b[1]), TIE_HI * (1 - 0.2 * fog), max(1.5, thick * 0.35))

    # Center catwalk so the bed is not a featureless ramp.
    prev_w = None
    for k in range(i_end, i, -1):
        d = arrays["s"][k] - s0
        if d < 0.5:
            continue
        wl, zl = lateral(arrays, k, -0.20)
        wr, zr = lateral(arrays, k, 0.20)
        a = project(arrays, i, wl, arrays["y"][k] + 0.02, zl, pitch)
        b = project(arrays, i, wr, arrays["y"][k] + 0.02, zr, pitch)
        if a is None or b is None:
            prev_w = None
            continue
        if prev_w is not None and bed_ok(prev_w[0], prev_w[1], a, b):
            fill_trap(img, prev_w[0][1], prev_w[0][0], prev_w[1][0], a[1], a[0], b[0], WALK * (1 - 0.3 * min(d / DRAW_AHEAD, 1)))
        prev_w = (a, b)

    # Continuous steel rails — connected segments, not dotted samples.
    for pts in (rail_l, rail_r):
        for a, b in zip(pts, pts[1:]):
            stroke(img, a, b, RAIL_SHADOW, 6.0)
            stroke(img, a, b, RAIL, 3.4)

    # Posts + bulbs stream past at world stations.
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
            base = project(arrays, i, bx, arrays["y"][k] - 0.05, bz, pitch)
            top = project(arrays, i, bx, arrays["y"][k] + 1.35, bz, pitch)
            if base is None or top is None:
                continue
            stroke(img, (base[0], base[1]), (top[0], top[1]), WOOD_DK, max(2.0, 7.5 * (2.2 / max(d, 1.1))))
            if d < 48:
                draw_disk(img, top[0], top[1], max(1.6, 6.2 * (2.2 / max(d, 1.2))), BULB * (1 - fog * 0.35))

    # Trees sit on the ground plane and stream past with true parallax.
    for px, py, pz, kind, ht in props:
        dx = px - arrays["x"][i]
        dz = pz - arrays["z"][i]
        if dx * dx + dz * dz > DRAW_AHEAD * DRAW_AHEAD:
            continue
        pr = project(arrays, i, px, py, pz, pitch)
        if pr is None:
            continue
        d = pr[2]
        if kind == "pine":
            draw_pine(img, pr[0], pr[1], (ht * 38) * (2.6 / max(d, 1.8)))
        else:
            top = project(arrays, i, px, py + ht, pz, pitch)
            if top:
                stroke(img, (pr[0], pr[1]), (top[0], top[1]), WOOD_DK, max(2.0, 6.0 * (2.2 / max(d, 1.2))))
                draw_disk(img, top[0], top[1], max(1.8, 5.5 * (2.2 / max(d, 1.2))), BULB)

    # Stable car / lap bar — no shake, no photo track kept under the bar.
    dash_mask = dash.sum(axis=2) > 12
    img[dash_mask] = dash[dash_mask]
    return np.clip(img, 0, 255).astype(np.uint8)


def synth_quiet(seconds: float, arrays: dict[str, np.ndarray], t0: float = 0.0) -> np.ndarray:
    """Placeholder only: lift clack + soft roar. No joy layers."""
    n = int(round(seconds * SR))
    t = np.arange(n, dtype=np.float32) / SR + t0
    # map time -> speed / lift
    cam = np.searchsorted(arrays["t"], t)
    cam = np.clip(cam, 0, arrays["speed"].size - 1)
    speed = arrays["speed"][cam].astype(np.float32)
    speed_n = np.clip(speed / 18.0, 0, 1)
    lift = arrays["lift"][cam].astype(np.float32)

    rng = np.random.default_rng(7)
    noise = rng.normal(0, 1, n).astype(np.float32)
    spec = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec *= ((freqs < 40) * 0.35 + ((freqs >= 40) & (freqs < 220)) * 0.8 + ((freqs >= 220) & (freqs < 600)) * 0.15)
    roar = np.fft.irfft(spec, n=n).astype(np.float32)
    roar *= 0.035 + speed_n * 0.075

    bed = np.zeros((2, n), dtype=np.float32)
    bed += roar

    # soft lift clack
    def click(freq: float, decay: float) -> np.ndarray:
        m = int(0.07 * SR)
        tt = np.arange(m, dtype=np.float32) / SR
        return (np.sin(2 * np.pi * freq * tt) * np.exp(-tt * decay)).astype(np.float32)

    t_clack = t0
    while t_clack < t0 + seconds:
        idx = int(np.clip(np.searchsorted(arrays["t"], t_clack), 0, arrays["lift"].size - 1))
        if arrays["lift"][idx] > 0.5:
            i0 = int(t_clack * SR)
            ck = click(1640, 40) * 0.22
            sl = ck[: max(0, n - i0)]
            if sl.size:
                bed[0, i0 : i0 + sl.size] += sl
                bed[1, i0 : i0 + sl.size] += sl * 0.9
            t_clack += 0.34
        else:
            t_clack += 0.2

    peak = float(np.max(np.abs(bed))) or 1.0
    return np.clip(bed * (0.55 / peak), -1, 1)


def write_wav(path: str, stereo: np.ndarray) -> None:
    interleaved = np.empty(stereo.shape[1] * 2, dtype=np.int16)
    interleaved[0::2] = (np.clip(stereo[0], -1, 1) * 32767).astype(np.int16)
    interleaved[1::2] = (np.clip(stereo[1], -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(interleaved.tobytes())


def dump_stills(arrays: dict[str, np.ndarray], props, dash: np.ndarray, times: list[float], dest_dir: str) -> None:
    os.makedirs(dest_dir, exist_ok=True)
    for t in times:
        i = cam_of_time(arrays, t)
        frame = render_frame(arrays, i, props, dash)
        path = f"{dest_dir}/t{t:.1f}.ppm"
        # tiny PPM then ffmpeg jpeg — keeps this script free of image libs
        with open(path, "wb") as f:
            f.write(f"P6\n{W} {H}\n255\n".encode())
            f.write(frame.tobytes())
        jpg = f"{dest_dir}/t{t:.1f}.jpg"
        subprocess.check_call(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", path, "-q:v", "3", jpg]
        )
        os.remove(path)
        print(f"dump {jpg} s={arrays['s'][i]:.1f} elev={arrays['y'][i]:.1f}", flush=True)


def main() -> None:
    preview = "--preview" in sys.argv
    dump_only = "--dump" in sys.argv
    _, arrays = section_path()
    raw_duration = float(arrays["t"][-1])
    start_t = 0.7
    duration = max(raw_duration - start_t, 1.0)
    print(f"full path {arrays['s'][-1]:.1f}m path_time={raw_duration:.2f}s film={duration:.2f}s", flush=True)
    rng = np.random.default_rng(11)
    props = make_side_props(arrays, rng)
    dash = load_dash()
    if dump_only:
        times = [start_t + dt for dt in (0.0, 0.4, 1.0, 2.5, 6.0, 12.0, 20.0, 42.0, 48.0, 55.0, 62.0, duration * 0.72, duration - 4.0)]
        times = [min(max(t, 0.0), raw_duration - 0.05) for t in times]
        dump_stills(arrays, props, dash, times, "/tmp/pov-dump")
        return
    if preview:
        duration = min(duration, 8.0)
    frames = int(duration * FPS)
    print(f"path {arrays['s'][-1]:.1f}m duration={duration:.2f}s frames={frames}", flush=True)

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
    for n in range(frames):
        t = n / FPS + start_t
        i = cam_of_time(arrays, min(t, raw_duration))
        frame = render_frame(arrays, i, props, dash)
        ff.stdin.write(frame.tobytes())
        if n % 48 == 0:
            print(f"frame {n}/{frames} s={arrays['s'][i]:.1f} elev={arrays['y'][i]:.1f} render={(n+1)/max(time.time()-t0,0.01):.1f}fps", flush=True)
    ff.stdin.close()
    if ff.wait() != 0:
        raise SystemExit("ffmpeg video failed")

    audio = "/tmp/ridge-pov.wav"
    write_wav(audio, synth_quiet(frames / FPS, arrays, t0=start_t))
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
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
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
