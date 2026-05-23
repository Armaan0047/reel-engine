"""
AI REEL AGENT v4.0 — Multi-Style Cinematic Viral Reel Engine

Features:
  - Topic-aware voice profiles (12 categories)
  - Premium AI voices (ElevenLabs → edge-tts fallback)
  - FFmpeg-synthesized background music per topic
  - Dual video routing (Minecraft ↔ Luxury.mp4)
  - Luxury cinematic color grading
  - Studio audio mastering
  - 3-tier render fallback
  - Every reel is unique

Usage:
    python main.py                 # Generate 1 reel
    python main.py --count 5       # Batch generate
    python main.py --voice-only    # Test voice only
    python main.py --topic luxury  # Force specific topic
    python main.py --help          # Show usage
"""
import sys
import io

if sys.stdout and hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "buffer"):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import asyncio
import os
import time

from config import PROJECT_ROOT, VIDEOS_DIR, REELS_DIR, MUSIC_DIR, get_random_script
from voice_generator import generate_voiceover
from video_renderer import get_random_video, render_reel


BANNER = r"""
     _    ___   ____  _____ _____ _
    / \  |_ _| |  _ \| ____| ____| |
   / _ \  | |  | |_) |  _| |  _| | |
  / ___ \ | |  |  _ <| |___| |___| |___
 /_/   \_\___| |_| \_\_____|_____|_____|

   █ CINEMATIC REEL ENGINE By Armaan █  v4.0
   Premium voices · Background music · Luxury mode
"""


def print_header():
    print(BANNER)
    print(f"   Project : {PROJECT_ROOT}")
    print(f"   Time    : {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Videos  : {VIDEOS_DIR}")
    print(f"   Music   : {MUSIC_DIR}")
    print("=" * 60)


async def generate_one_reel(force_topic=None) -> str:
    """Generate a single viral reel. Returns path to output."""

    # ── Step 1: Script + Voice ────────────────────────────────────
    print("\n" + "=" * 60)
    print("  STEP 1 — SCRIPT + AI VOICE (topic-aware)")
    print("=" * 60)

    entry = get_random_script()
    script_text  = entry["text"]
    script_topic = force_topic or entry.get("topic")

    voice_data = await generate_voiceover(
        script=script_text, topic=script_topic,
    )
    topic = voice_data["topic"]

    # ── Step 2: Select Background Video ───────────────────────────
    print("\n" + "=" * 60)
    print("  STEP 2 — SELECTING BACKGROUND VIDEO")
    print("=" * 60)

    video_path = get_random_video(topic=topic)
    if not video_path:
        print("   ERROR: No videos found in /videos!")
        return None

    from config import LUXURY_TOPICS
    style = "LUXURY" if topic in LUXURY_TOPICS else "MINECRAFT"
    print(f"   Style   : {style}")
    print(f"   Video   : {os.path.basename(video_path)}")

    # ── Step 3: Render with Music ─────────────────────────────────
    print("\n" + "=" * 60)
    print("  STEP 3 — RENDERING CINEMATIC REEL")
    print("=" * 60)

    reel_name = f"reel_{time.strftime('%Y%m%d_%H%M%S')}"
    reel_path = render_reel(
        video_path=video_path,
        audio_path=voice_data["audio_path"],
        subtitle_data=voice_data["subtitle_data"],
        output_name=reel_name,
        topic=topic,
    )

    return reel_path


async def generate_batch(count, force_topic=None):
    """Generate multiple reels."""
    print_header()
    print(f"   Generating {count} reel(s)..." +
          (f" [forced topic: {force_topic}]" if force_topic else ""))

    results = []
    start = time.time()

    for i in range(count):
        print(f"\n{'#' * 60}")
        print(f"  REEL {i + 1} / {count}")
        print(f"{'#' * 60}")

        try:
            path = await generate_one_reel(force_topic=force_topic)
            if path and os.path.exists(path):
                results.append(path)
                print(f"\n   ✅ Reel {i + 1} saved: {os.path.basename(path)}")
            else:
                print(f"\n   ❌ Reel {i + 1} failed")
        except Exception as e:
            print(f"\n   ❌ Reel {i + 1} error: {e}")

    elapsed = time.time() - start
    print(f"\n\n{'=' * 60}")
    print(f"  BATCH COMPLETE")
    print(f"{'=' * 60}")
    print(f"   Generated : {len(results)} / {count}")
    print(f"   Time      : {elapsed:.1f}s ({elapsed / max(len(results), 1):.1f}s per reel)")
    print(f"   Output    : {REELS_DIR}")
    for r in results:
        sz = os.path.getsize(r) / (1024 * 1024)
        print(f"     → {os.path.basename(r)} ({sz:.1f} MB)")
    print("=" * 60)


async def voice_only():
    """Test voice generation only."""
    print_header()
    print("   MODE: Voice generation only\n")
    entry = get_random_script()
    data = await generate_voiceover(script=entry["text"], topic=entry.get("topic"))
    print(f"\n   Audio   : {data['audio_path']}")
    print(f"   Voice   : {data['voice']}")
    print(f"   Topic   : {data['topic']} → {data['profile']}")
    print(f"   Phrases : {len(data['subtitle_data'])}")
    for p in data["subtitle_data"][:10]:
        hl = " ★" if p.get("highlight") else ""
        print(f"     [{p['start']:6.2f}s → {p['end']:6.2f}s] {p['text']}{hl}")
    if len(data["subtitle_data"]) > 10:
        print(f"     ... +{len(data['subtitle_data']) - 10} more")


def main():
    args = sys.argv[1:]

    if "--help" in args or "-h" in args:
        print(__doc__)
        return

    if "--voice-only" in args:
        asyncio.run(voice_only())
        return

    count = 1
    force_topic = None

    if "--count" in args:
        idx = args.index("--count")
        if idx + 1 < len(args):
            try:
                count = int(args[idx + 1])
            except ValueError:
                print("Error: --count must be a number")
                return

    if "--topic" in args:
        idx = args.index("--topic")
        if idx + 1 < len(args):
            force_topic = args[idx + 1]

    asyncio.run(generate_batch(count, force_topic=force_topic))


if __name__ == "__main__":
    main()
