#!/usr/bin/env python3
"""Original Ridge Runner ride bed — character of an on-ride yell reel, not a rip.

Lift: ratchet / anti-rollback clack.
Speed: wooden roar + wind zoom.
Drops: joyful women-screech / men-hoop, louder toward the bottom, quieter on climb-out.
Licensed Mixkit layers are gated by the same envelope. No YouTube audio.
"""

from __future__ import annotations

import math
import os
import subprocess
import sys
import wave

import numpy as np

# Reuse the same path clock the film was rendered with.
sys.path.insert(0, os.path.dirname(__file__))
from render_ridge_pov import SR, section_path  # type: ignore

START_T = 0.7
DEST = "/workspace/public/videos/carnival/coaster.mp4"
WAV = "/tmp/ridge-ride-bed.wav"
MIXKIT = "/tmp/mixkit-ride"

# Mixkit Free License — amusement-ride energy, not stadium beds.
STOCK = {
    "fair_scream": ("349", "Screaming people at mechanical game fair"),
    "girls_cheer": ("515", "Girls crowd cheer, scream, and applause"),
    "party_cheer": ("531", "Birthday crowd party cheer"),
    "male_cheer": ("476", "Male crowd cheering short"),
}


def load_mono(path: str) -> np.ndarray:
    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            path,
            "-ac",
            "1",
            "-ar",
            str(SR),
            "-f",
            "f32le",
            "pipe:1",
        ]
    )
    x = np.frombuffer(raw, dtype=np.float32).copy()
    peak = float(np.max(np.abs(x))) or 1.0
    return (x / peak).astype(np.float32)


def fetch_mixkit() -> dict[str, np.ndarray]:
    os.makedirs(MIXKIT, exist_ok=True)
    out: dict[str, np.ndarray] = {}
    for key, (num, _name) in STOCK.items():
        dest = os.path.join(MIXKIT, f"{num}.mp3")
        if not os.path.isfile(dest) or os.path.getsize(dest) < 1000:
            url = f"https://assets.mixkit.co/active_storage/sfx/{num}/{num}-preview.mp3"
            subprocess.check_call(["curl", "-fsSL", "-o", dest, url])
        out[key] = load_mono(dest)
    return out


def bandlimited_noise(n: int, rng: np.random.Generator, lo: float, hi: float) -> np.ndarray:
    noise = rng.normal(0, 1, n).astype(np.float32)
    spec = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec *= ((freqs >= lo) & (freqs <= hi)).astype(np.float32)
    y = np.fft.irfft(spec, n=n).astype(np.float32)
    peak = float(np.max(np.abs(y))) or 1.0
    return y / peak


def envelope_from_path(arrays: dict[str, np.ndarray], t: np.ndarray) -> dict[str, np.ndarray]:
    cam = np.clip(np.searchsorted(arrays["t"], t), 0, arrays["speed"].size - 1)
    speed = arrays["speed"][cam].astype(np.float32)
    elev = arrays["y"][cam].astype(np.float32)
    lift = arrays["lift"][cam].astype(np.float32)
    speed_n = np.clip(speed / 18.0, 0, 1)
    # How close we are to the ground — bottoms are loud, crests are thin.
    elev_n = np.clip(elev / 22.0, 0, 1)
    # Descending vs climbing: look a short window ahead.
    ahead = np.clip(np.searchsorted(arrays["t"], t + 0.35), 0, arrays["y"].size - 1)
    behind = np.clip(np.searchsorted(arrays["t"], t - 0.35), 0, arrays["y"].size - 1)
    falling = np.clip((arrays["y"][behind] - arrays["y"][ahead]) / 6.0, 0, 1).astype(np.float32)
    rising = np.clip((arrays["y"][ahead] - arrays["y"][behind]) / 6.0, 0, 1).astype(np.float32)
    # Approach the bottom: speed + low elev + falling. Climb-out ducks the same bed.
    proximity = np.clip(speed_n * (0.22 + 0.78 * (1 - elev_n)) * (0.45 + 0.80 * falling), 0, 1)
    proximity *= (1.0 - 0.55 * rising * (1 - falling))
    # Brakes / station: keep it quiet.
    proximity *= np.clip((speed - 3.2) / 8.0, 0.08, 1.0)
    return {
        "speed": speed,
        "speed_n": speed_n,
        "elev": elev,
        "lift": lift,
        "falling": falling,
        "rising": rising,
        "proximity": proximity,
    }


def ratchet(seconds: float, env: dict[str, np.ndarray], t: np.ndarray) -> np.ndarray:
    """Anti-rollback dogs + chain clatter on the lift only."""
    n = t.size
    bed = np.zeros((2, n), dtype=np.float32)
    rng = np.random.default_rng(3)

    def click(kind: str) -> np.ndarray:
        m = int(0.085 * SR)
        tt = np.arange(m, dtype=np.float32) / SR
        if kind == "dog":
            # Metallic dog + wood thunk.
            y = 0.72 * np.sin(2 * np.pi * 1480 * tt) * np.exp(-tt * 42)
            y += 0.38 * np.sin(2 * np.pi * 620 * tt) * np.exp(-tt * 28)
            y += 0.18 * rng.normal(0, 1, m).astype(np.float32) * np.exp(-tt * 55)
        else:
            y = 0.55 * np.sin(2 * np.pi * 210 * tt) * np.exp(-tt * 18)
            y += 0.25 * rng.normal(0, 1, m).astype(np.float32) * np.exp(-tt * 30)
        return y.astype(np.float32)

    t_clack = float(t[0])
    end = float(t[-1])
    while t_clack < end:
        i = int(np.clip((t_clack - float(t[0])) * SR, 0, n - 1))
        if env["lift"][i] > 0.5:
            ck = click("dog") * 0.48
            sl = ck[: max(0, n - i)]
            if sl.size:
                bed[0, i : i + sl.size] += sl
                bed[1, i : i + sl.size] += sl * 0.92
            # Softer chain clatter between dogs.
            i2 = min(i + int(0.16 * SR), n - 1)
            ck2 = click("chain") * 0.28
            sl2 = ck2[: max(0, n - i2)]
            if sl2.size:
                bed[0, i2 : i2 + sl2.size] += sl2 * 0.9
                bed[1, i2 : i2 + sl2.size] += sl2
            t_clack += 0.27
        else:
            t_clack += 0.2
    return bed


def synth_yell(rng: np.random.Generator, kind: str) -> np.ndarray:
    """Original joyful park yell — not a horror scream, not a YouTube rip."""
    dur = rng.uniform(0.38, 0.92) if kind == "she" else rng.uniform(0.28, 0.62)
    m = int(dur * SR)
    tt = np.arange(m, dtype=np.float32) / SR
    env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.15
    env *= np.exp(-tt * rng.uniform(1.4, 2.6))
    if kind == "she":
        f0 = rng.uniform(720, 980)
        f1 = f0 * rng.uniform(1.18, 1.42)
        vib = 1 + 0.035 * np.sin(2 * np.pi * 6.5 * tt)
        carr = np.sin(2 * np.pi * (f0 + (f1 - f0) * (tt / dur)) * tt * vib)
        form = np.sin(2 * np.pi * rng.uniform(2100, 2800) * tt)
        noise = rng.normal(0, 1, m).astype(np.float32)
        y = 0.62 * carr + 0.28 * form * carr + 0.18 * noise
        y *= 0.55
    else:
        f0 = rng.uniform(220, 340)
        f1 = f0 * rng.uniform(1.35, 1.85)
        carr = np.sin(2 * np.pi * (f0 + (f1 - f0) * (tt / dur) ** 0.7) * tt)
        y = 0.70 * carr + 0.22 * np.sin(2 * np.pi * f0 * 2 * tt)
        y *= 0.48
    return (y * env).astype(np.float32)


def stamp(dst: np.ndarray, src: np.ndarray, at: float, t0: float, gain: float, pan: float) -> None:
    i0 = int((at - t0) * SR)
    if i0 >= dst.shape[1] or i0 < 0:
        return
    sl = src[: max(0, dst.shape[1] - i0)]
    if sl.size == 0:
        return
    dst[0, i0 : i0 + sl.size] += sl * gain * (0.55 - 0.45 * pan)
    dst[1, i0 : i0 + sl.size] += sl * gain * (0.55 + 0.45 * pan)


def build_bed(seconds: float, arrays: dict[str, np.ndarray], t0: float) -> np.ndarray:
    n = int(round(seconds * SR))
    t = np.arange(n, dtype=np.float32) / SR + t0
    env = envelope_from_path(arrays, t)
    rng = np.random.default_rng(21)

    roar = bandlimited_noise(n, rng, 40, 420)
    clatter = bandlimited_noise(n, rng, 400, 1600)
    wind = bandlimited_noise(n, rng, 900, 5200)

    bed = np.zeros((2, n), dtype=np.float32)
    # Wooden roar follows speed; extra weight as we fall toward a valley.
    roar_g = 0.028 + env["speed_n"] * 0.12 + env["proximity"] * 0.28
    wind_g = env["speed_n"] ** 1.25 * (0.05 + 0.28 * env["falling"]) + env["proximity"] * 0.12
    clat_g = env["speed_n"] * 0.04 * (1.0 - 0.35 * env["lift"]) + env["proximity"] * 0.06
    bed += roar * roar_g
    bed += clatter * clat_g
    bed += wind * wind_g

    bed += ratchet(seconds, env, t)

    # Original whoops / screeches, denser on drops and valleys.
    clock = t0 + 1.0
    end = t0 + seconds
    while clock < end:
        i = int(np.clip((clock - t0) * SR, 0, n - 1))
        prox = float(env["proximity"][i])
        lift = float(env["lift"][i])
        if lift > 0.5 or prox < 0.22:
            clock += 0.55
            continue
        kind = "she" if rng.random() < 0.62 else "he"
        yell = synth_yell(rng, kind)
        gain = (0.22 + 0.78 * prox) * (1.20 if kind == "she" else 1.00)
        stamp(bed, yell, clock, t0, gain, rng.uniform(-0.35, 0.35))
        # Second voice a beat later when we're in the loudest part.
        if prox > 0.55 and rng.random() < 0.7:
            kind2 = "he" if kind == "she" else "she"
            stamp(bed, synth_yell(rng, kind2), clock + rng.uniform(0.12, 0.28), t0, gain * 0.85, rng.uniform(-0.4, 0.4))
        clock += rng.uniform(0.38, 0.85) * (1.4 - 0.6 * prox)

    stock = fetch_mixkit()
    # Licensed ride-fair yells, only where the train is actually hauling.
    # Path-time stamps: crest hush, then swell through drop / valley / hills.
    for at_off, key, g, pan in (
        (48.55, "girls_cheer", 0.28, 0.12),
        (48.85, "fair_scream", 0.46, -0.10),
        (49.15, "male_cheer", 0.34, 0.14),
        (50.90, "fair_scream", 0.40, 0.08),
        (51.20, "girls_cheer", 0.36, -0.16),
        (52.80, "party_cheer", 0.16, 0.04),
        (54.55, "fair_scream", 0.30, -0.08),
        (56.10, "male_cheer", 0.26, 0.12),
        (58.40, "girls_cheer", 0.22, -0.10),
        (60.40, "fair_scream", 0.18, 0.06),
    ):
        i = int(np.clip((at_off - t0) * SR, 0, n - 1))
        prox = float(env["proximity"][i])
        if prox < 0.18:
            continue
        stamp(bed, stock[key], at_off, t0, g * (0.55 + 0.85 * prox), pan)

    peak = float(np.max(np.abs(bed))) or 1.0
    return np.clip(bed * (0.86 / peak), -1, 1), env


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
    tmp = "/tmp/ridge-ride-mux.mp4"
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
            "-ac",
            "2",
            "-shortest",
            "-movflags",
            "+faststart",
            tmp,
        ]
    )
    os.replace(tmp, dest)


def report(env: dict[str, np.ndarray], t0: float, seconds: float) -> None:
    # RMS-ish of the proximity envelope in known windows (path time).
    def mean_at(a: float, b: float) -> float:
        i0 = int(max(a - t0, 0) * SR)
        i1 = int(min(b - t0, seconds) * SR)
        if i1 <= i0:
            return 0.0
        return float(np.mean(env["proximity"][i0:i1]))

    print(
        "proximity lift/drop/climbout "
        f"{mean_at(12, 36):.3f} / {mean_at(48.5, 52.5):.3f} / {mean_at(66, 70):.3f}",
        flush=True,
    )


def rms_windows(bed: np.ndarray, t0: float, seconds: float) -> None:
    def rms(a: float, b: float) -> float:
        i0 = int(max(a - t0, 0) * SR)
        i1 = int(min(b - t0, seconds) * SR)
        sl = bed[:, i0:i1]
        if sl.size == 0:
            return 0.0
        return float(np.sqrt(np.mean(sl * sl)))

    print(
        "rms lift/drop/climbout "
        f"{rms(12, 36):.4f} / {rms(48.5, 52.5):.4f} / {rms(66, 70):.4f}",
        flush=True,
    )


def main() -> None:
    _, arrays = section_path()
    raw = float(arrays["t"][-1])
    seconds = max(raw - START_T, 1.0)
    print(f"film {seconds:.2f}s start_t={START_T}", flush=True)
    bed, env = build_bed(seconds, arrays, START_T)
    report(env, START_T, seconds)
    rms_windows(bed, START_T, seconds)
    write_wav(WAV, bed)
    mux(DEST, WAV, DEST)
    print(f"muxed {DEST}", flush=True)


if __name__ == "__main__":
    main()
