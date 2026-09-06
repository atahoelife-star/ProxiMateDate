#!/usr/bin/env python3
"""Wire a later themed Grok Ridge Runner mp4 as Board now. No encode from stills.

Never wire the first study clip (assets.grok.com …88f3b53b… / that generated_video).
Wait until Gregory says the next themed clip is the one to ship.

Usage:
  python3 scripts/wire_ridge_grok.py /path/to/generated_video.mp4

Looks in common drop spots if no path is given. Pads portrait (e.g. 448x672)
into 1280x720 so the midway player can show the whole frame. Draft PR #25 only.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys

DEST = "/workspace/public/videos/carnival/coaster.mp4"
# Gregory's first Grok clip: motion study only. Do not ship as Board now.
BLOCKED = (
    "88f3b53b-b4ac-45c3-9273-b1b3946dfb54",
    "aa467dc3-c5f6-412f-aa1b-eefdab225b1f/generated/88f3b53b",
)
# Themed clip Gregory said IS the ride.
ALLOWED = ("8dbd1804-38f3-47e2-8ea2-561195fc52a4",)
DATA = "/workspace/src/data/carnival.ts"
CREDITS = "/workspace/public/audio/CREDITS.txt"
CANDIDATES = [
    "/workspace/generated_video.mp4",
    "/workspace/Downloads/generated_video.mp4",
    "/home/ubuntu/Downloads/generated_video.mp4",
    "/home/ubuntu/generated_video.mp4",
    "/tmp/generated_video.mp4",
    "/tmp/ridge-grok-themed.mp4",
    "/tmp/grok.mp4",
    "/workspace/public/videos/carnival/ridge-runner-grok.mp4",
    "/opt/cursor/artifacts/generated_video.mp4",
    "/opt/cursor/artifacts/ridge-runner-grok.mp4",
]


def probe(path: str) -> dict:
    raw = subprocess.check_output(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", path]
    )
    return json.loads(raw)


def find_src() -> str:
    if len(sys.argv) > 1:
        path = os.path.abspath(sys.argv[1])
        if not os.path.isfile(path):
            raise SystemExit(f"missing {path}")
        return path
    for path in CANDIDATES:
        if os.path.isfile(path):
            return path
    raise SystemExit("no Grok mp4 yet — pass the file path when it arrives")


def refuse_first_study_clip(src: str) -> None:
    blob = src.lower()
    if any(token.lower() in blob for token in BLOCKED):
        raise SystemExit("refusing first Grok clip (88f3b53b) — motion study only, not Board footage")


def transcode(src: str, dest: str) -> float:
    refuse_first_study_clip(src)
    info = probe(src)
    video = next(s for s in info["streams"] if s.get("codec_type") == "video")
    has_audio = any(s.get("codec_type") == "audio" for s in info["streams"])
    w, h = int(video["width"]), int(video["height"])
    duration = float(info["format"].get("duration") or 0)
    print(f"src {src} {w}x{h} duration={duration:.3f}s audio={has_audio}", flush=True)
    tmp = "/tmp/ridge-grok-wired.mp4"
    vf = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x120C0E,fps=24"
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-i",
        src,
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
    ]
    if has_audio:
        cmd += ["-c:a", "aac", "-b:a", "96k", "-ac", "2"]
    else:
        cmd += ["-an"]
    cmd.append(tmp)
    subprocess.check_call(cmd)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    os.replace(tmp, dest)
    out = probe(dest)
    out_dur = float(out["format"]["duration"])
    print(f"wrote {dest} duration={out_dur:.3f}s", flush=True)
    return out_dur


def patch_carnival(seconds: float) -> None:
    ms = int(round(seconds * 1000))
    text = open(DATA, encoding="utf-8").read()
    # Coaster attraction duration only (first durationMs after Ridge Runner block).
    text, n = re.subn(
        r"(id: 'coaster',\n    name: 'The Ridge Runner',[\s\S]*?durationMs: )\d+",
        rf"\g<1>{ms}",
        text,
        count=1,
    )
    if n != 1:
        raise SystemExit("failed to patch ride durationMs")
    text = text.replace(
        "30-second motion test: the train runs the track — hang, drop, more hills, a bank. Continuous frames, not stills.",
        "Grok look+motion test: a short photoreal run down the track.",
    )
    text = text.replace(
        "You wait on the timber ramp. 30-second motion test — board to see the train run the track.",
        "You wait on the timber ramp. Short Grok look+motion test — board to see the train run.",
    )
    text = text.replace(
        "The train is moving. Hang, then down the hill — valley, climb, drop again, a bank, home.",
        "The train is moving. Photoreal woodie — watch the track travel.",
    )
    text = text.replace("title: '30s motion test'", "title: 'Look+motion test'")
    text = text.replace(
        "Board for a 30-second run down the track. Continuous frames, not a slideshow.",
        "Board for a short photoreal run down the track.",
    )
    text = text.replace("film: '/videos/carnival/coaster.mp4'", "film: '/videos/carnival/coaster.mp4?v=grok1'")
    # Collapse leftover beat clock to the real film length.
    lift, drop, turn, tunnel, home = 1500, max(ms - 3500, 2000), 800, 600, 600
    drift = ms - (lift + drop + turn + tunnel + home)
    drop += drift
    text = re.sub(
        r"(id: 'coaster',[\s\S]*?beats: \[[\s\S]*?id: 'lift',[\s\S]*?durationMs: )\d+",
        rf"\g<1>{lift}",
        text,
        count=1,
    )
    for beat_id, val in (("drop", drop), ("turn", turn), ("tunnel", tunnel), ("home", home)):
        text = re.sub(
            rf"(id: 'coaster',[\s\S]*?id: '{beat_id}',[\s\S]*?durationMs: )\d+",
            rf"\g<1>{val}",
            text,
            count=1,
        )
    open(DATA, "w", encoding="utf-8").write(text)
    print(f"patched {DATA} durationMs={ms}", flush=True)


def patch_credits() -> None:
    text = open(CREDITS, encoding="utf-8").read()
    block = (
        "ridge-runner ride bed (muxed into /videos/carnival/coaster.mp4)\n"
        "  Gregory’s Grok / xAI image-to-video from the photoreal dispatch still.\n"
        "  Wired as-is (padded to 1280×720). No cartoon encode. No still dissolve.\n"
        "  Room mute still silences the ride if the clip has audio.\n"
    )
    if "Gregory’s Grok" in text:
        return
    text = re.sub(
        r"ridge-runner ride bed \(muxed into /videos/carnival/coaster\.mp4\)\n(?:  .*\n)+",
        block,
        text,
        count=1,
    )
    open(CREDITS, "w", encoding="utf-8").write(text)


def main() -> None:
    src = find_src()
    refuse_first_study_clip(src)
    seconds = transcode(src, DEST)
    patch_carnival(seconds)
    patch_credits()
    print("ready — commit, push, hard-refresh Board now", flush=True)


if __name__ == "__main__":
    main()
