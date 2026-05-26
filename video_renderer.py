"""
AI Reel Agent v4.2 — Video Renderer
Multi-style cinematic engine with topic-aware visuals & background music.

Features:
  - Dual video routing: Minecraft gameplay vs Luxury.mp4
  - Landscape-aware scaling (fixes black screen on 16:9 sources)
  - FFmpeg-synthesized ambient background music per topic
  - Music + voice ducking (voice always crystal clear)
  - Render validation (detects black frames, auto-retries)
  - 4-tier render fallback (full → simplified → drawtext → emergency)
  - Every tier wrapped in try/except — fallback chain NEVER aborts
"""
import os
import random
import subprocess
import time
import traceback

from config import (
    VIDEOS_DIR, REELS_DIR, TEMP_DIR, MUSIC_DIR,
    OUTPUT_WIDTH, OUTPUT_HEIGHT, OUTPUT_FPS, MAX_DURATION_SEC,
    VIDEO_BITRATE, AUDIO_BITRATE,
    FFMPEG_PATH,
    LUXURY_TOPICS,
    RENDER_STYLE_MINECRAFT, RENDER_STYLE_LUXURY,
    MUSIC_SYNTH_PARAMS, MUSIC_MIX_VOLUME,
)
from voice_generator import generate_ass_subtitles
import font_config  # ensures fontconfig is initialized on import


# ══════════════════════════════════════════════════════════════════
#  TOPIC-AWARE VIDEO SELECTION
# ══════════════════════════════════════════════════════════════════

def _generate_synthetic_video(topic: str = "motivation") -> str:
    os.makedirs(VIDEOS_DIR, exist_ok=True)
    is_luxury = topic in LUXURY_TOPICS
    label = "luxury" if is_luxury else "default"
    synth_path = os.path.join(VIDEOS_DIR, f"synth_{label}.mp4")

    if os.path.isfile(synth_path) and os.path.getsize(synth_path) > 50_000:
        print(f"   ♻️  Reusing cached synthetic video: {label}")
        return synth_path

    print(f"   🎬 Generating synthetic background ({label})...")
    dur = 40
    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT

    if is_luxury:
        src = (
            f"color=c=0x0A0A0A:s={w}x{h}:d={dur}:r=30[bg];"
            f"color=c=0x1A0F00:s={w}x{h}:d={dur}:r=30,"
            f"geq=r='clip(p(X\\,Y)+2*sin(2*PI*T/8+X/200),0,255)'"
            f":g='clip(p(X\\,Y)+1*sin(2*PI*T/10+Y/300),0,255)'"
            f":b='p(X\\,Y)'[fg];"
            f"[bg][fg]blend=all_mode=screen[out]"
        )
    else:
        src = (
            f"color=c=0x050A12:s={w}x{h}:d={dur}:r=30[bg];"
            f"color=c=0x001020:s={w}x{h}:d={dur}:r=30,"
            f"geq=r='clip(p(X\\,Y)+3*sin(2*PI*T/6+X/150),0,255)'"
            f":g='clip(p(X\\,Y)+4*sin(2*PI*T/7+Y/200),0,255)'"
            f":b='clip(p(X\\,Y)+6*sin(2*PI*T/5+X/100),0,255)'[fg];"
            f"[bg][fg]blend=all_mode=screen[out]"
        )

    cmd = [
        FFMPEG_PATH, "-y",
        "-filter_complex", src,
        "-map", "[out]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
        "-pix_fmt", "yuv420p",
        synth_path,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        print(f"   ⚠️ Complex synth failed, using solid color fallback")
        fallback_color = "0x1A0F00" if is_luxury else "0x050A12"
        cmd2 = [
            FFMPEG_PATH, "-y",
            "-f", "lavfi", "-i", f"color=c={fallback_color}:s={w}x{h}:d={dur}:r=30",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
            "-pix_fmt", "yuv420p",
            synth_path,
        ]
        r2 = subprocess.run(cmd2, capture_output=True, text=True, timeout=60)
        if r2.returncode != 0:
            print(f"   ❌ Synthetic video generation failed: {r2.stderr[-300:]}")
            return None

    if os.path.isfile(synth_path) and os.path.getsize(synth_path) > 10_000:
        sz = os.path.getsize(synth_path) / (1024 * 1024)
        print(f"   ✅ Synthetic video ready: {sz:.1f} MB")
        return synth_path

    return None


def get_random_video(topic: str = None) -> str:
    is_luxury = topic in LUXURY_TOPICS

    if is_luxury:
        luxury_path = os.path.join(VIDEOS_DIR, "Luxury.mp4")
        if os.path.isfile(luxury_path) and os.path.getsize(luxury_path) > 10_000:
            return luxury_path
        print("   ⚠️ Luxury.mp4 not found → trying other videos")

    valid = []
    if os.path.isdir(VIDEOS_DIR):
        for f in os.listdir(VIDEOS_DIR):
            fp = os.path.join(VIDEOS_DIR, f)
            if (os.path.isfile(fp)
                and f.lower().endswith((".mp4", ".mov", ".avi", ".mkv", ".webm"))
                and not f.lower().endswith(".crswap")
                and not f.startswith("synth_")
                and os.path.getsize(fp) > 10_000):
                valid.append(fp)

    if valid:
        return random.choice(valid)

    print("   ⚠️ No background videos found → generating synthetic video")
    return _generate_synthetic_video(topic=topic)


def is_luxury_topic(topic: str) -> bool:
    return topic in LUXURY_TOPICS


# ══════════════════════════════════════════════════════════════════
#  SOURCE VIDEO INSPECTION
# ══════════════════════════════════════════════════════════════════

def _get_video_dimensions(path):
    cmd = [FFMPEG_PATH, "-i", path]
    r = subprocess.run(cmd, capture_output=True, text=True)
    import re
    m = re.search(r'(\d{2,5})x(\d{2,5})', r.stderr)
    if m:
        return int(m.group(1)), int(m.group(2))
    return 0, 0


def _is_landscape(path):
    w, h = _get_video_dimensions(path)
    return w > h


# ══════════════════════════════════════════════════════════════════
#  AMBIENT MUSIC GENERATION
# ══════════════════════════════════════════════════════════════════

def _get_music_for_topic(topic, duration):
    user_music = _find_user_music(topic)
    if user_music:
        return _master_user_music(user_music)

    cache_dir = os.path.join(TEMP_DIR, "music_cache")
    os.makedirs(cache_dir, exist_ok=True)
    cache_path = os.path.join(cache_dir, f"ambient_{topic}.mp3")

    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 1000:
        return cache_path

    params = MUSIC_SYNTH_PARAMS.get(topic, MUSIC_SYNTH_PARAMS["_default"])
    pad_duration = max(duration + 5, 35)
    print(f"   Music    : generating {params['label']} ambient pad...")
    _synthesize_ambient_pad(params, pad_duration, cache_path)
    return cache_path


def _find_user_music(topic):
    from config import MUSIC_CATEGORIES_MAP
    category = MUSIC_CATEGORIES_MAP.get(topic, "motivation")

    cat_dir = os.path.join(MUSIC_DIR, category)
    if os.path.isdir(cat_dir):
        files = [f for f in os.listdir(cat_dir)
                 if f.lower().endswith((".mp3", ".wav", ".m4a", ".ogg"))]
        if files:
            return os.path.join(cat_dir, random.choice(files))

    if os.path.isdir(MUSIC_DIR):
        files = [f for f in os.listdir(MUSIC_DIR)
                 if os.path.isfile(os.path.join(MUSIC_DIR, f))
                 and f.lower().endswith((".mp3", ".wav", ".m4a", ".ogg"))]
        if files:
            return os.path.join(MUSIC_DIR, random.choice(files))
    return None


def _master_user_music(input_path):
    import hashlib
    file_hash = hashlib.md5(input_path.encode('utf-8')).hexdigest()[:8]
    basename = os.path.basename(input_path)

    cache_dir = os.path.join(TEMP_DIR, "music_cache")
    os.makedirs(cache_dir, exist_ok=True)
    cached_path = os.path.join(cache_dir, f"mastered_{file_hash}_{basename}")

    if os.path.exists(cached_path) and os.path.getsize(cached_path) > 1000:
        return cached_path

    print(f"   Music    : Mastering and caching '{basename}'...")
    af = "loudnorm=I=-22:LRA=11:TP=-1.5,acompressor=threshold=-15dB:ratio=3:attack=10:release=100"

    cmd = [
        FFMPEG_PATH, "-y", "-i", input_path,
        "-af", af,
        "-ar", "44100", "-b:a", "128k",
        cached_path
    ]
    subprocess.run(cmd, capture_output=True)

    if os.path.exists(cached_path) and os.path.getsize(cached_path) > 1000:
        return cached_path
    return input_path


def _synthesize_ambient_pad(params, duration, output_path):
    f1, f2 = params["freq1"], params["freq2"]
    nc, na = params["noise"], params["noise_amp"]
    sv = params["sine_vol"]
    hp, lp = params["hp"], params["lp"]
    dur = int(duration)
    fd = min(3, dur // 4)

    fc = (
        f"sine=frequency={f1}:duration={dur}[s1];"
        f"sine=frequency={f2}:duration={dur}[s2];"
        f"anoisesrc=duration={dur}:color={nc}:amplitude={na}[n];"
        f"[s1]volume={sv}[sv1];"
        f"[s2]volume={sv * 0.7}[sv2];"
        f"[n]highpass=f={hp}:poles=2,lowpass=f={lp}:poles=2[nf];"
        f"[sv1][sv2][nf]amix=inputs=3:duration=first,"
        f"afade=t=in:d={fd},afade=t=out:st={dur - fd}:d={fd},"
        f"loudnorm=I=-25:TP=-5:LRA=11[out]"
    )
    subprocess.run([
        FFMPEG_PATH, "-y", "-filter_complex", fc,
        "-map", "[out]", "-ar", "44100", "-b:a", "128k", output_path,
    ], capture_output=True, text=True)


# ══════════════════════════════════════════════════════════════════
#  RENDER VALIDATION
# ══════════════════════════════════════════════════════════════════

def _validate_render(path):
    if not os.path.exists(path):
        return False
    file_size = os.path.getsize(path)
    if file_size < 50_000:
        print(f"   ⚠️ Validation: file too small ({file_size} bytes)")
        return False

    probe_path = path + ".probe.raw"
    cmd = [
        FFMPEG_PATH, "-y",
        "-ss", "2", "-i", path,
        "-frames:v", "1",
        "-vf", "scale=16:16",
        "-f", "rawvideo", "-pix_fmt", "gray",
        probe_path,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)

    if r.returncode != 0 or not os.path.exists(probe_path):
        return file_size > 200_000

    probe_size = os.path.getsize(probe_path)
    if probe_size == 0:
        _cleanup(probe_path)
        return False

    with open(probe_path, "rb") as f:
        data = f.read()
    _cleanup(probe_path)

    avg_brightness = sum(data) / len(data) if data else 0
    if avg_brightness < 5:
        print(f"   ⚠️ Validation: BLACK FRAME detected (avg brightness={avg_brightness:.0f})")
        return False

    return True


def _cleanup(path):
    try:
        os.remove(path)
    except OSError:
        pass


# ══════════════════════════════════════════════════════════════════
#  MAIN RENDER PIPELINE
#
#  CRITICAL: Every tier call is wrapped in try/except.
#  The fallback chain NEVER aborts — an uncaught exception in any
#  tier simply logs and falls through to the next tier.
# ══════════════════════════════════════════════════════════════════

def render_reel(video_path, audio_path, subtitle_data, output_name,
                topic="motivation"):
    """
    Render a complete viral reel with visuals, voice, music, and subtitles.
    Uses a 4-tier fallback: full → simplified → drawtext → emergency.
    Every tier is wrapped in try/except — the chain NEVER breaks.
    """
    luxury = is_luxury_topic(topic)
    style  = RENDER_STYLE_LUXURY if luxury else RENDER_STYLE_MINECRAFT
    landscape = _is_landscape(video_path)

    audio_dur = _get_duration(audio_path)
    if audio_dur <= 0:
        audio_dur = 15
    reel_dur = min(audio_dur + 0.5, MAX_DURATION_SEC)

    video_dur = _get_duration(video_path)
    max_offset = max(0, video_dur - reel_dur - 5)
    offset = random.uniform(0, max_offset) if max_offset > 0 else 0

    zoom       = round(random.uniform(*style["zoom"]), 4)
    contrast   = round(random.uniform(*style["contrast"]), 2)
    saturation = round(random.uniform(*style["saturation"]), 2)
    brightness = round(random.uniform(*style["brightness"]), 3)
    vignette   = round(random.uniform(*style["vignette"]), 1)
    sharpen    = round(random.uniform(*style["sharpen"]), 2)

    reel_path = os.path.join(REELS_DIR, f"{output_name}.mp4")
    ass_path  = os.path.join(TEMP_DIR, f"{output_name}.ass")

    # Generate ASS subtitles (safe — errors caught by caller in api_server)
    try:
        generate_ass_subtitles(subtitle_data, ass_path, is_luxury=luxury)
    except Exception as e:
        print(f"   ⚠️ ASS subtitle generation failed: {e} — continuing without subs")
        ass_path = None

    # Generate background music
    try:
        music_path = _get_music_for_topic(topic, reel_dur)
    except Exception as e:
        print(f"   ⚠️ Music generation failed: {e} — continuing without music")
        music_path = None

    # Print render info
    style_label = "LUXURY CINEMATIC" if luxury else "MINECRAFT VIRAL"
    src_label = "landscape 16:9" if landscape else "portrait/square"
    print(f"\n{'=' * 60}")
    print(f"  RENDERING {style_label} REEL")
    print(f"{'=' * 60}")
    print(f"   Source     : {os.path.basename(video_path)} ({src_label})")
    print(f"   Audio      : {os.path.basename(audio_path)}")
    print(f"   Duration   : {reel_dur:.1f}s")
    print(f"   Resolution : {OUTPUT_WIDTH}x{OUTPUT_HEIGHT} @ {OUTPUT_FPS}fps")
    print(f"   Music      : {os.path.basename(music_path) if music_path else 'NONE'}")
    print(f"   Font       : {font_config.FONT_NAME} → {font_config.FONT_PATH or 'system'}")
    print(f"   Fonts dir  : {font_config.FONTS_DIR} (exists={os.path.isdir(font_config.FONTS_DIR)})")
    if ass_path:
        print(f"   ASS file   : {ass_path} (exists={os.path.isfile(ass_path)})")

    ok = False

    # ══════════════════════════════════════════════════════
    # TIER 1: Full effects + ASS subtitles + music
    # ══════════════════════════════════════════════════════
    if not ok and ass_path and music_path:
        try:
            print(f"\n   ── TIER 1: Full effects + ASS subtitles ──")
            ok = _render_tier1(video_path, audio_path, music_path, ass_path,
                               reel_path, reel_dur, offset, zoom,
                               contrast, saturation, brightness, vignette, sharpen,
                               luxury, landscape)
            if ok and not _validate_render(reel_path):
                print(f"   ⚠️ Tier 1 FAILED validation → next tier")
                ok = False
        except Exception as e:
            print(f"   ❌ Tier 1 EXCEPTION: {e}")
            traceback.print_exc()
            ok = False

    # ══════════════════════════════════════════════════════
    # TIER 2: Simplified + ASS subtitles + music
    # ══════════════════════════════════════════════════════
    if not ok and ass_path and music_path:
        try:
            print(f"\n   ── TIER 2: Simplified + ASS subtitles ──")
            ok = _render_tier2(video_path, audio_path, music_path, ass_path,
                               reel_path, reel_dur, offset, luxury, landscape)
            if ok and not _validate_render(reel_path):
                print(f"   ⚠️ Tier 2 FAILED validation → next tier")
                ok = False
        except Exception as e:
            print(f"   ❌ Tier 2 EXCEPTION: {e}")
            traceback.print_exc()
            ok = False

    # ══════════════════════════════════════════════════════
    # TIER 3: drawtext subtitles (BYPASSES libass/fontconfig)
    # ══════════════════════════════════════════════════════
    if not ok and music_path:
        try:
            print(f"\n   ── TIER 3: drawtext subtitles (no libass) ──")
            ok = _render_tier3_drawtext(video_path, audio_path, music_path,
                                         subtitle_data, reel_path, reel_dur,
                                         offset, landscape)
        except Exception as e:
            print(f"   ❌ Tier 3 EXCEPTION: {e}")
            traceback.print_exc()
            ok = False

    # ══════════════════════════════════════════════════════
    # TIER 3b: drawtext WITHOUT music (in case music is the problem)
    # ══════════════════════════════════════════════════════
    if not ok:
        try:
            print(f"\n   ── TIER 3b: drawtext + voice only (no music) ──")
            ok = _render_tier3b_drawtext_no_music(video_path, audio_path,
                                                   subtitle_data, reel_path,
                                                   reel_dur, offset, landscape)
        except Exception as e:
            print(f"   ❌ Tier 3b EXCEPTION: {e}")
            traceback.print_exc()
            ok = False

    # ══════════════════════════════════════════════════════
    # TIER 4: Emergency — NO subtitles, NO music, just video+voice
    # ══════════════════════════════════════════════════════
    if not ok:
        try:
            print(f"\n   ── TIER 4: Emergency (video + voice only) ──")
            ok = _render_tier4_emergency(video_path, audio_path, reel_path,
                                          reel_dur, offset, landscape)
        except Exception as e:
            print(f"   ❌ Tier 4 EXCEPTION: {e}")
            traceback.print_exc()
            ok = False

    # Final result
    if ok:
        size_mb = os.path.getsize(reel_path) / (1024 * 1024)
        print(f"\n   ✅ RENDER COMPLETE: {output_name}.mp4 — {size_mb:.1f} MB")
    else:
        print(f"\n   ❌ ALL TIERS FAILED — no output produced")
        print(f"   Debug: video={os.path.isfile(video_path)}, audio={os.path.isfile(audio_path)}")
        print(f"   Debug: ffmpeg={FFMPEG_PATH}")

    return reel_path if ok else None


# ══════════════════════════════════════════════════════════════════
#  SCALING HELPERS
# ══════════════════════════════════════════════════════════════════

def _build_scale_filter(w, h, landscape):
    if landscape:
        return f"scale=-2:{h}:flags=lanczos,crop={w}:{h}"
    else:
        return f"scale={w}:-2:flags=lanczos,crop={w}:{h}"


# ══════════════════════════════════════════════════════════════════
#  RENDER TIERS
# ══════════════════════════════════════════════════════════════════

def _render_tier1(video, audio, music, ass, out, dur, offset,
                  zoom, contrast, sat, bright, vignette, sharpen,
                  luxury, landscape):
    """Tier 1: Full effects — zoom, color grade, vignette, sharpen, ASS subs, music."""
    tier_label = "luxury cinematic" if luxury else "full effects"
    print(f"   Rendering (Tier 1: {tier_label})...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    fps = OUTPUT_FPS
    total_frames = max(int(dur * fps), 1)

    zoom_per_frame = zoom / total_frames
    if random.random() < 0.7:
        zexpr = f"1+(on*{zoom_per_frame})"
    else:
        zexpr = f"(1+{zoom})-(on*{zoom_per_frame})"

    pan_x = random.uniform(-1.0, 1.0)
    pan_y = random.uniform(-1.0, 1.0)

    scale_factor = 1.5
    sw, sh = int(w * scale_factor), int(h * scale_factor)

    if landscape:
        pre_scale = f"scale=-2:{sh}:flags=lanczos,crop={sw}:{sh}"
    else:
        pre_scale = f"scale={sw}:-2:flags=lanczos,crop={sw}:{sh}"

    xexpr = f"min(max(iw/2-(iw/zoom/2)+(on*{pan_x}),0),iw-iw/zoom)"
    yexpr = f"min(max(ih/2-(ih/zoom/2)+(on*{pan_y}),0),ih-ih/zoom)"

    sub_filter = _build_ass_filter(ass)

    vf = (
        f"{pre_scale},"
        f"zoompan=z='{zexpr}':x='{xexpr}':y='{yexpr}'"
        f":d=1:s={w}x{h}:fps={fps},"
        f"fps={fps},"
        f"eq=contrast={contrast}:saturation={sat}:brightness={bright},"
        f"unsharp=5:5:{sharpen}:5:5:0,"
        f"vignette=PI/{vignette},"
        f"{sub_filter}"
    )

    mv = round(random.uniform(0.06, 0.10), 3)
    af = (
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo[voice];"
        f"[2:a]aformat=sample_rates=44100:channel_layouts=stereo,"
        f"volume={mv},"
        f"afade=t=in:d=1.5,"
        f"afade=t=out:st={max(0, dur - 2.5)}:d=2.5[bgm];"
        f"[voice][bgm]amix=inputs=2:duration=first:dropout_transition=0[aout]"
    )

    fc = f"[0:v]{vf}[vout];{af}"

    cmd = [
        FFMPEG_PATH, "-y",
        "-ss", str(offset), "-stream_loop", "-1", "-i", video,
        "-i", audio,
        "-stream_loop", "-1", "-i", music,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-b:v", VIDEO_BITRATE, "-maxrate", VIDEO_BITRATE, "-bufsize", "10M",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 1 ({tier_label}): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 1")
    return False


def _render_tier2(video, audio, music, ass, out, dur, offset, luxury, landscape):
    """Tier 2: Simplified — scale+crop, ASS subtitles, music. No effects."""
    print(f"   Rendering (Tier 2: simplified + ASS)...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    scale = _build_scale_filter(w, h, landscape)
    sub_filter = _build_ass_filter(ass)
    vf = f"{scale},fps={OUTPUT_FPS},{sub_filter}"

    mv = round(random.uniform(0.06, 0.10), 3)
    af = (
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo[voice];"
        f"[2:a]aformat=sample_rates=44100:channel_layouts=stereo,"
        f"volume={mv},afade=t=in:d=1,afade=t=out:st={max(0, dur-2)}:d=2[bgm];"
        f"[voice][bgm]amix=inputs=2:duration=first[aout]"
    )

    fc = f"[0:v]{vf}[vout];{af}"

    cmd = [
        FFMPEG_PATH, "-y",
        "-ss", str(offset), "-stream_loop", "-1", "-i", video,
        "-i", audio,
        "-stream_loop", "-1", "-i", music,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 2 (simplified): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 2")
    return False


def _render_tier3_drawtext(video, audio, music, subtitle_data, out, dur, offset, landscape):
    """
    Tier 3: drawtext with fontfile= — completely bypasses libass/fontconfig.
    Uses a unified filter_complex for both video and audio.
    """
    print(f"   Rendering (Tier 3: drawtext, no libass)...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    scale = _build_scale_filter(w, h, landscape)

    # Build drawtext — may return None if no font found
    dt_filter = _build_drawtext_filter(subtitle_data, dur)
    if dt_filter:
        vf = f"{scale},fps={OUTPUT_FPS},{dt_filter}"
    else:
        vf = f"{scale},fps={OUTPUT_FPS}"
    print(f"   [VF] {vf[:100]}...")

    # Audio: mix voice + music
    mv = round(random.uniform(0.06, 0.10), 3)

    # Unified filter_complex for both video and audio
    fc = (
        f"[0:v]{vf}[vout];"
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo[voice];"
        f"[2:a]aformat=sample_rates=44100:channel_layouts=stereo,"
        f"volume={mv},afade=t=in:d=1,afade=t=out:st={max(0, dur-2)}:d=2[bgm];"
        f"[voice][bgm]amix=inputs=2:duration=first[aout]"
    )

    cmd = [
        FFMPEG_PATH, "-y",
        "-stream_loop", "-1", "-i", video,
        "-i", audio,
        "-stream_loop", "-1", "-i", music,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 3 (drawtext): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 3")
    return False


def _render_tier3b_drawtext_no_music(video, audio, subtitle_data, out, dur, offset, landscape):
    """
    Tier 3b: drawtext with fontfile= + voice only. No music at all.
    Uses a unified filter_complex for both video and audio.
    """
    print(f"   Rendering (Tier 3b: drawtext + voice, no music)...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    scale = _build_scale_filter(w, h, landscape)

    dt_filter = _build_drawtext_filter(subtitle_data, dur)
    if dt_filter:
        vf = f"{scale},fps={OUTPUT_FPS},{dt_filter}"
    else:
        vf = f"{scale},fps={OUTPUT_FPS}"

    fc = (
        f"[0:v]{vf}[vout];"
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo[aout]"
    )

    cmd = [
        FFMPEG_PATH, "-y",
        "-stream_loop", "-1", "-i", video,
        "-i", audio,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 3b (drawtext, no music): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 3b")
    return False


def _render_tier4_emergency(video, audio, out, dur, offset, landscape):
    """
    Tier 4: ABSOLUTE LAST RESORT.
    No subtitles. No music.
    Uses a unified filter_complex for both video and audio.
    This MUST succeed if FFmpeg and the inputs exist.
    """
    print(f"   Rendering (Tier 4: emergency — video + voice only)...")
    print(f"   Video: {video} (exists={os.path.isfile(video)})")
    print(f"   Audio: {audio} (exists={os.path.isfile(audio)})")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT

    # Use the absolute simplest scale: just force to output size
    # No lanczos, no crop chain — just force it
    vf = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,fps={OUTPUT_FPS}"

    fc = (
        f"[0:v]{vf}[vout];"
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo[aout]"
    )

    cmd = [
        FFMPEG_PATH, "-y",
        "-stream_loop", "-1", "-i", video,
        "-i", audio,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out,
    ]

    print(f"   CMD: {' '.join(cmd[:6])}... [truncated]")

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 4 (emergency): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 4")
    print(f"   ❌ Tier 4 FAILED — this should not happen")
    print(f"   Full stderr: {r.stderr[-500:] if r.stderr else 'NONE'}")
    return False


# ══════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════

def _get_duration(path):
    if not os.path.exists(path):
        return 0
    try:
        r = subprocess.run([FFMPEG_PATH, "-i", path, "-f", "null", "-"],
                           capture_output=True, text=True, timeout=30)
        for line in r.stderr.split("\n"):
            if "Duration:" in line:
                p = line.split("Duration:")[1].split(",")[0].strip()
                h, m, s = p.split(":")
                return float(h)*3600 + float(m)*60 + float(s)
    except Exception:
        pass
    return 0


def _get_relative_path(path):
    try:
        from config import PROJECT_ROOT
        rel = os.path.relpath(path, PROJECT_ROOT)
        rel_clean = rel.replace("\\", "/")
        if not rel_clean.startswith(".."):
            return rel_clean
    except Exception:
        pass
    return path


def _esc_path(path):
    """Escape a filesystem path for FFmpeg filter option values."""
    path = _get_relative_path(path)
    p = path.replace("\\", "/")
    p = p.replace("'", "'\\''")
    p = p.replace(":", "\\:")
    return f"'{p}'"


def _esc_text(text):
    """
    Escape text content for FFmpeg drawtext filter inside single quotes.
    Must handle: single quotes, colons, backslashes, percent signs, semicolons.
    """
    t = str(text)
    t = t.replace("\\", "\\\\")
    t = t.replace("'", "\\'")        # FFmpeg-native quote escape inside single-quoted strings
    t = t.replace(":", "\\:")
    t = t.replace("%", "%%")         # % is special in drawtext
    t = t.replace(";", "")           # semicolons break filter_complex
    t = t.replace("\n", " ")
    t = t.replace("[", "(")          # brackets can break filter syntax
    t = t.replace("]", ")")
    return t


def _build_ass_filter(ass_path):
    """Build FFmpeg ASS subtitle filter. Returns filter string."""
    if not ass_path or not os.path.isfile(ass_path):
        print(f"   ⚠️ ASS file not found: {ass_path}")
        return "null"

    escaped = _esc_path(ass_path)
    fonts_dir = _esc_path(font_config.FONTS_DIR)

    filt = f"ass={escaped}:fontsdir={fonts_dir}"
    print(f"   [ASS] {filt[:90]}...")
    return filt


def _build_drawtext_filter(subtitle_data, total_dur):
    """
    Build drawtext filter chain from subtitle phrase data.
    Uses fontfile= — completely bypasses fontconfig/libass.
    
    Returns a comma-separated chain of drawtext filters, or None.
    """
    font_file = _find_drawtext_font()
    if not font_file:
        print("   [DRAWTEXT] No font file found — skipping subtitles")
        return None

    print(f"   [DRAWTEXT] Using font: {font_file}")
    escaped_font = _esc_path(font_file)

    if not subtitle_data or not isinstance(subtitle_data, list):
        print("   [DRAWTEXT] No subtitle data — skipping")
        return None

    # Build individual drawtext filters — limit to 30 to avoid command length issues
    parts = []
    for i, phrase in enumerate(subtitle_data[:30]):
        if not isinstance(phrase, dict):
            continue
        raw_text = phrase.get("text", "")
        if not raw_text:
            continue

        text = _esc_text(raw_text)
        start = float(phrase.get("start", 0))
        end = float(phrase.get("end", start + 2))

        # Use enable with between() — no commas inside single-quoted expression
        dt = (
            f"drawtext=fontfile={escaped_font}"
            f":text='{text}'"
            f":fontsize=52"
            f":fontcolor=white"
            f":borderw=3"
            f":bordercolor=black"
            f":x=(w-text_w)/2"
            f":y=h*3/4"
            f":enable='between(t\\,{start:.2f}\\,{end:.2f})'"
        )
        parts.append(dt)

    if not parts:
        print("   [DRAWTEXT] No valid phrases — skipping")
        return None

    print(f"   [DRAWTEXT] Built {len(parts)} text overlays")
    return ",".join(parts)


def _find_drawtext_font():
    """Find a .ttf font file for drawtext. Returns absolute path or None."""
    # 1. Bundled font (committed to repo)
    bundled = font_config.BUNDLED_FONT
    if os.path.isfile(bundled) and os.path.getsize(bundled) > 10000:
        return bundled

    # 2. Font found by font_config init
    if font_config.FONT_PATH and os.path.isfile(font_config.FONT_PATH):
        return font_config.FONT_PATH

    # 3. Any .ttf in fonts dir
    fonts_dir = font_config.FONTS_DIR
    if os.path.isdir(fonts_dir):
        for f in os.listdir(fonts_dir):
            if f.lower().endswith(".ttf"):
                return os.path.join(fonts_dir, f)

    # 4. System fonts
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.isfile(p):
            return p

    return None


def _log_ffmpeg_error(result, tier_name):
    """Log FFmpeg stderr for debugging render failures."""
    if not result.stderr:
        print(f"   [{tier_name}] No stderr output")
        return
    print(f"   [{tier_name}] FULL FFmpeg STDERR:")
    print(result.stderr)
