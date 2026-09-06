#!/usr/bin/env python3
"""Layer cleared Mixkit joy beds onto the original Ridge Runner synth."""

from __future__ import annotations

import os
import subprocess
import wave

import numpy as np

SR = 44100
SYNTH = "/tmp/ridge-runner-audio.wav"
OUT = "/tmp/ridge-runner-audio-mixed.wav"
VIDEO = "/tmp/ridge-runner-video-final.mp4"
DEST = "/workspace/public/videos/carnival/coaster.mp4"

# Mixkit Free License previews (active_storage). Joyful park energy only.
STOCK = {
    "fair": "/tmp/mixkit/424.mp3",  # people in fair ambience and laughter
    "joy": "/tmp/mixkit/441.mp3",  # stadium joy shouting crowd
    "cheer": "/tmp/mixkit/476.mp3",  # male crowd cheering
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


def load_wav_stereo(path: str) -> np.ndarray:
    with wave.open(path, "rb") as wf:
        assert wf.getnchannels() == 2 and wf.getsampwidth() == 2
        frames = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32767.0
    return frames.reshape(-1, 2).T


def stamp(dst: np.ndarray, src: np.ndarray, at: float, gain: float, pan: float = 0.0) -> None:
    i0 = int(at * SR)
    if i0 >= dst.shape[1]:
        return
    sl = src[: max(0, dst.shape[1] - i0)]
    if sl.size == 0:
        return
    dst[0, i0 : i0 + sl.size] += sl * gain * (0.5 - 0.5 * pan)
    dst[1, i0 : i0 + sl.size] += sl * gain * (0.5 + 0.5 * pan)


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


def main() -> None:
    bed = load_wav_stereo(SYNTH)
    fair = load_mono(STOCK["fair"])
    joy = load_mono(STOCK["joy"])
    cheer = load_mono(STOCK["cheer"])

    # Quiet laughter between hills; bigger joy on the drops.
    for at, g, pan in (
        (6.5, 0.10, -0.1),
        (14.0, 0.08, 0.12),
        (32.8, 0.18, 0.05),
        (39.2, 0.16, -0.12),
        (44.6, 0.14, 0.1),
        (50.4, 0.13, -0.05),
        (59.8, 0.12, 0.0),
        (68.5, 0.10, 0.08),
    ):
        stamp(bed, fair, at, g, pan)

    for at, g, pan in (
        (26.10, 0.46, -0.15),
        (27.4, 0.40, 0.2),
        (29.0, 0.32, -0.05),
        (36.3, 0.30, 0.12),
        (42.5, 0.28, -0.18),
        (47.0, 0.26, 0.1),
        (53.7, 0.24, -0.08),
    ):
        stamp(bed, joy, at, g, pan)

    for at, g, pan in (
        (26.25, 0.40, 0.18),
        (30.4, 0.30, -0.2),
        (36.6, 0.24, 0.08),
        (42.8, 0.26, -0.12),
        (47.2, 0.22, 0.16),
        (54.0, 0.20, -0.06),
    ):
        stamp(bed, cheer, at, g, pan)

    peak = float(np.max(np.abs(bed))) or 1.0
    bed = np.clip(bed * (0.84 / peak), -1.0, 1.0)
    write_wav(OUT, bed)

    tmp = "/tmp/ridge-runner-mux.mp4"
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-i",
            VIDEO if os.path.isfile(VIDEO) else DEST,
            "-i",
            OUT,
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
    os.makedirs(os.path.dirname(DEST), exist_ok=True)
    os.replace(tmp, DEST)
    print(f"mixed {DEST}")


if __name__ == "__main__":
    main()
