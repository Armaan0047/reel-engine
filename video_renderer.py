"""
AI Reel Agent v4.1 — Video Renderer
Multi-style cinematic engine with topic-aware visuals & background music.

Features:
  - Dual video routing: Minecraft gameplay vs Luxury.mp4
  - Landscape-aware scaling (fixes black screen on 16:9 sources)
  - FFmpeg-synthesized ambient background music per topic
  - Music + voice ducking (voice always crystal clear)
  - Render validation (detects black frames, auto-retries)
  - 4-tier render fallback (full → simplified → drawtext → emergency)
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
    """
    Generate a synthetic background video via FFmpeg when no real
    footage is available (e.g., Railway production).
    Creates a 35-second animated gradient that looks acceptable.
    Cached so it's only generated once per container lifetime.
    """
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
        # Dark gold/amber gradient — luxury vibe
        src = (
            f"color=c=0x0A0A0A:s={w}x{h}:d={dur}:r=30[bg];"
            f"color=c=0x1A0F00:s={w}x{h}:d={dur}:r=30,"
            f"geq=r='clip(p(X\\,Y)+2*sin(2*PI*T/8+X/200),0,255)'"
            f":g='clip(p(X\\,Y)+1*sin(2*PI*T/10+Y/300),0,255)'"
            f":b='p(X\\,Y)'[fg];"
            f"[bg][fg]blend=all_mode=screen[out]"
        )
    else:
        # Dark blue/teal animated noise — minecraft/gaming vibe
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
        # Fallback: even simpler — just a solid color video
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
    """
    Select background video based on topic.
    Luxury topics → Luxury.mp4 (if exists)
    Everything else → random Minecraft gameplay
    Falls back to synthetic video generation for production (Railway).
    """
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
                and not f.startswith("synth_")  # prefer real videos
                and os.path.getsize(fp) > 10_000):
                valid.append(fp)

    if valid:
        return random.choice(valid)

    # No real videos available — generate synthetic (production mode)
    print("   ⚠️ No background videos found → generating synthetic video")
    return _generate_synthetic_video(topic=topic)


def is_luxury_topic(topic: str) -> bool:
    return topic in LUXURY_TOPICS


# ══════════════════════════════════════════════════════════════════
#  SOURCE VIDEO INSPECTION
# ══════════════════════════════════════════════════════════════════

def _get_video_dimensions(path):
    """Get (width, height) of a video file. Returns (0, 0) on failure."""
    cmd = [FFMPEG_PATH, "-i", path]
    r = subprocess.run(cmd, capture_output=True, text=True)
    import re
    m = re.search(r'(\d{2,5})x(\d{2,5})', r.stderr)
    if m:
        return int(m.group(1)), int(m.group(2))
    return 0, 0


def _is_landscape(path):
    """Check if a video source is landscape (width > height)."""
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
    
    # 1. Try category-specific folder
    cat_dir = os.path.join(MUSIC_DIR, category)
    if os.path.isdir(cat_dir):
        files = [f for f in os.listdir(cat_dir)
                 if f.lower().endswith((".mp3", ".wav", ".m4a", ".ogg"))]
        if files:
            return os.path.join(cat_dir, random.choice(files))
            
    # 2. Try root music folder as fallback
    if os.path.isdir(MUSIC_DIR):
        files = [f for f in os.listdir(MUSIC_DIR)
                 if os.path.isfile(os.path.join(MUSIC_DIR, f))
                 and f.lower().endswith((".mp3", ".wav", ".m4a", ".ogg"))]
        if files:
            return os.path.join(MUSIC_DIR, random.choice(files))
    return None

def _master_user_music(input_path):
    """
    Applies professional mastering (loudnorm + compression) to user music
    and caches the result so we don't re-encode multiple times.
    """
    import hashlib
    # Simple hash of filepath so cache hits correctly
    file_hash = hashlib.md5(input_path.encode('utf-8')).hexdigest()[:8]
    basename = os.path.basename(input_path)
    
    cache_dir = os.path.join(TEMP_DIR, "music_cache")
    os.makedirs(cache_dir, exist_ok=True)
    cached_path = os.path.join(cache_dir, f"mastered_{file_hash}_{basename}")
    
    if os.path.exists(cached_path) and os.path.getsize(cached_path) > 1000:
        return cached_path
        
    print(f"   Music    : Mastering and caching '{basename}'...")
    # Professional mastering: normalize loudness and compress dynamic range
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
    return input_path  # Fallback to original if mastering fails


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
    """
    Validate rendered reel is not a black screen.
    Extracts a frame from 2s in and checks if it has non-zero pixel data.
    Returns True if render looks valid.
    """
    if not os.path.exists(path):
        return False
    file_size = os.path.getsize(path)
    if file_size < 50_000:
        print(f"   ⚠️ Validation: file too small ({file_size} bytes)")
        return False

    # Extract a frame at 2 seconds, get average brightness
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
        # Can't probe — assume OK if file size is reasonable
        return file_size > 200_000

    probe_size = os.path.getsize(probe_path)
    if probe_size == 0:
        _cleanup(probe_path)
        return False

    # Read raw pixel bytes and check average brightness
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
# ══════════════════════════════════════════════════════════════════

def render_reel(video_path, audio_path, subtitle_data, output_name,
                topic="motivation"):
    """
    Render a complete viral reel with visuals, voice, music, and subtitles.
    Detects source orientation and applies correct scaling strategy.
    Uses a 4-tier fallback: full → simplified → drawtext → emergency.
    """
    luxury = is_luxury_topic(topic)
    style  = RENDER_STYLE_LUXURY if luxury else RENDER_STYLE_MINECRAFT
    landscape = _is_landscape(video_path)

    # Gather parameters
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

    generate_ass_subtitles(subtitle_data, ass_path, is_luxury=luxury)
    music_path = _get_music_for_topic(topic, reel_dur)

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
    print(f"   Zoom       : {zoom}")
    print(f"   Color      : contrast={contrast} sat={saturation}")
    print(f"   Music      : {os.path.basename(music_path)} @ {int(MUSIC_MIX_VOLUME*100)}%")
    print(f"   Output     : {output_name}.mp4")
    print(f"   Font       : {font_config.FONT_NAME} → {font_config.FONT_PATH or 'system'}")
    print(f"   ASS file   : {ass_path} (exists={os.path.isfile(ass_path)})")

    # ── Tier 1: Full effects + ASS subtitles ──
    ok = _render_tier1(video_path, audio_path, music_path, ass_path,
                       reel_path, reel_dur, offset, zoom,
                       contrast, saturation, brightness, vignette, sharpen,
                       luxury, landscape)

    if ok and not _validate_render(reel_path):
        print(f"   ⚠️ Tier 1 rendered but FAILED validation → retrying Tier 2")
        ok = False

    # ── Tier 2: Simplified + ASS subtitles ──
    if not ok:
        ok = _render_tier2(video_path, audio_path, music_path, ass_path,
                           reel_path, reel_dur, offset, luxury, landscape)

    if ok and not _validate_render(reel_path):
        print(f"   ⚠️ Tier 2 rendered but FAILED validation → retrying Tier 3")
        ok = False

    # ── Tier 3: drawtext subtitles (bypasses libass/fontconfig entirely) ──
    if not ok:
        ok = _render_tier3_drawtext(video_path, audio_path, music_path,
                                     subtitle_data, reel_path, reel_dur,
                                     offset, landscape)

    # ── Tier 4: Emergency — no subtitles, no music, just video+voice ──
    if not ok:
        ok = _render_tier4_emergency(video_path, audio_path, reel_path,
                                      reel_dur, offset, landscape)

    if ok:
        size_mb = os.path.getsize(reel_path) / (1024 * 1024)
        print(f"   Output     : {output_name}.mp4 — {size_mb:.1f} MB")

    return reel_path if ok else None


# ══════════════════════════════════════════════════════════════════
#  SCALING HELPERS
# ══════════════════════════════════════════════════════════════════

def _build_scale_filter(w, h, landscape):
    """
    Build the correct scaling + crop chain for portrait output.
    Landscape sources (16:9): scale height to 1920, crop width to 1080.
    Portrait/square sources: scale width to 1080, crop height to 1920.
    """
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
    """
    Tier 1: Full effects — zoom, color grade, vignette, sharpen,
    ASS subtitles, background music.
    """
    tier_label = "luxury cinematic" if luxury else "full effects"
    print(f"\n   Rendering (Tier 1: {tier_label})...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    fps = OUTPUT_FPS
    total_frames = int(dur * fps)

    zoom_per_frame = zoom / total_frames
    zoom_dir = "in" if random.random() < 0.7 else "out"
    if zoom_dir == "in":
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

    # Build subtitle filter
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
        "-stream_loop", "-1", "-ss", str(offset), "-i", video,
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

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 1 ({tier_label}): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 1")
    print(f"   ⚠️ Tier 1 failed → trying Tier 2...")
    return False


def _render_tier2(video, audio, music, ass, out, dur, offset, luxury, landscape):
    """
    Tier 2: Simplified — proper scaling + crop, ASS subtitles, music.
    No zoom or color grading effects.
    """
    print(f"   Rendering (Tier 2: simplified + ASS subs)...")

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
        "-stream_loop", "-1", "-ss", str(offset), "-i", video,
        "-i", audio,
        "-stream_loop", "-1", "-i", music,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 2 (simplified): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 2")
    print(f"   ⚠️ Tier 2 failed → trying Tier 3 (drawtext)...")
    return False


def _render_tier3_drawtext(video, audio, music, subtitle_data, out, dur, offset, landscape):
    """
    Tier 3: Uses drawtext filter with fontfile= parameter.
    Completely bypasses libass and fontconfig.
    Renders subtitle text directly using FFmpeg's built-in drawtext.
    """
    print(f"   Rendering (Tier 3: drawtext, no libass)...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    scale = _build_scale_filter(w, h, landscape)

    # Build drawtext filter chain from subtitle data
    dt_filter = _build_drawtext_filter(subtitle_data, dur)

    if dt_filter:
        vf = f"{scale},fps={OUTPUT_FPS},{dt_filter}"
    else:
        vf = f"{scale},fps={OUTPUT_FPS}"

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
        "-stream_loop", "-1", "-ss", str(offset), "-i", video,
        "-i", audio,
        "-stream_loop", "-1", "-i", music,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 3 (drawtext): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 3")
    print(f"   ⚠️ Tier 3 failed → trying Tier 4 (emergency)...")
    return False


def _render_tier4_emergency(video, audio, out, dur, offset, landscape):
    """
    Tier 4: ABSOLUTE LAST RESORT.
    No subtitles, no music, no filter_complex.
    Uses simple -vf and direct stream mapping.
    This MUST succeed if FFmpeg and the inputs are valid.
    """
    print(f"   Rendering (Tier 4: emergency, no subs, no music)...")

    w, h = OUTPUT_WIDTH, OUTPUT_HEIGHT
    scale = _build_scale_filter(w, h, landscape)
    vf = f"{scale},fps={OUTPUT_FPS}"

    cmd = [
        FFMPEG_PATH, "-y",
        "-stream_loop", "-1", "-ss", str(offset), "-i", video,
        "-i", audio,
        "-vf", vf,
        "-map", "0:v", "-map", "1:a",
        "-t", str(dur),
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-shortest", out,
    ]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 10_000:
        sz = os.path.getsize(out) / (1024 * 1024)
        print(f"   ✅ Tier 4 (emergency): {sz:.1f} MB")
        return True

    _log_ffmpeg_error(r, "Tier 4")
    print(f"   ❌ ALL RENDER TIERS FAILED!")
    print(f"   Video: {video} (exists={os.path.isfile(video)}, size={os.path.getsize(video) if os.path.isfile(video) else 0})")
    print(f"   Audio: {audio} (exists={os.path.isfile(audio)}, size={os.path.getsize(audio) if os.path.isfile(audio) else 0})")
    return False


# ══════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════

def _get_duration(path):
    if not os.path.exists(path):
        return 0
    r = subprocess.run([FFMPEG_PATH, "-i", path, "-f", "null", "-"],
                       capture_output=True, text=True)
    for line in r.stderr.split("\n"):
        if "Duration:" in line:
            p = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = p.split(":")
            return float(h)*3600 + float(m)*60 + float(s)
    return 0


def _esc(path):
    """Escape path for FFmpeg filter strings (no quotes needed)."""
    return path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")


def _build_ass_filter(ass_path):
    """
    Build FFmpeg ASS subtitle filter.
    Uses fontsdir= to point libass at our fonts directory.
    Returns: ass=/path/to/file.ass:fontsdir=/path/to/fonts
    """
    if not os.path.isfile(ass_path):
        print(f"   ⚠️ ASS file not found: {ass_path}")
        return "null"

    escaped = _esc(ass_path)
    fonts_dir = _esc(font_config.FONTS_DIR)

    filt = f"ass={escaped}:fontsdir={fonts_dir}"
    print(f"   [ASS] {filt[:90]}...")
    return filt


def _build_drawtext_filter(subtitle_data, total_dur):
    """
    Build a drawtext filter chain from subtitle phrase data.
    Uses fontfile= parameter — completely bypasses fontconfig/libass.
    
    This is the fontconfig-proof subtitle method.
    """
    # Find a font file to use with drawtext
    font_file = _find_drawtext_font()
    if not font_file:
        print("   [DRAWTEXT] No font file found — skipping subtitles")
        return None

    escaped_font = _esc(font_file)

    if not subtitle_data or not isinstance(subtitle_data, list):
        return None

    # Build chained drawtext filters for each phrase
    parts = []
    for i, phrase in enumerate(subtitle_data):
        if not isinstance(phrase, dict):
            continue
        text = phrase.get("text", "").replace("'", "\\'").replace(":", "\\:")
        start = phrase.get("start", 0)
        end = phrase.get("end", start + 2)
        if not text:
            continue

        # Enable/disable based on timestamp
        enable_expr = f"between(t,{start:.2f},{end:.2f})"
        dt = (
            f"drawtext=fontfile={escaped_font}"
            f":text='{text}'"
            f":fontsize=52"
            f":fontcolor=white"
            f":borderw=3"
            f":bordercolor=black"
            f":x=(w-text_w)/2"
            f":y=h*0.75"
            f":enable='{enable_expr}'"
        )
        parts.append(dt)

    if not parts:
        return None

    return ",".join(parts)


def _find_drawtext_font():
    """Find a .ttf font file for drawtext. Returns absolute path or None."""
    # 1. Bundled font (always available if committed to repo)
    bundled = font_config.BUNDLED_FONT
    if os.path.isfile(bundled) and os.path.getsize(bundled) > 10000:
        return bundled

    # 2. Font from font_config init
    if font_config.FONT_PATH and os.path.isfile(font_config.FONT_PATH):
        return font_config.FONT_PATH

    # 3. Any .ttf in our fonts dir
    fonts_dir = font_config.FONTS_DIR
    if os.path.isdir(fonts_dir):
        for f in os.listdir(fonts_dir):
            if f.lower().endswith(".ttf"):
                return os.path.join(fonts_dir, f)

    # 4. System fonts
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if os.path.isfile(p):
            return p

    return None


def _log_ffmpeg_error(result, tier_name):
    """Log FFmpeg stderr for debugging render failures."""
    if not result.stderr:
        print(f"   [{tier_name}] No stderr output")
        return

    lines = result.stderr.strip().split("\n")
    err_lines = [l for l in lines
                 if any(k in l.lower() for k in ["error", "fail", "cannot", "invalid", "no such", "fontconfig"])]

    if err_lines:
        print(f"   [{tier_name}] FFmpeg errors ({len(err_lines)}):")
        for el in err_lines[:10]:
            print(f"     {el.strip()}")
    else:
        print(f"   [{tier_name}] FFmpeg stderr (last 5 lines):")
        for el in lines[-5:]:
            if el.strip():
                print(f"     {el.strip()}")
