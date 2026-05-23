"""
AI Reel Agent v4.0 — Voice Generator
Premium voice engine: ElevenLabs → edge-tts fallback.
Topic-aware delivery, FFmpeg mastering, perfect subtitle sync.
"""
import asyncio
import json
import os
import random
import re
import shutil
import subprocess

import edge_tts

from config import (
    VOICES_DIR, TEMP_DIR,
    CAPTION_FONT_SIZE, CAPTION_ALIGNMENT, CAPTION_MARGIN_V,
    CAPTION_OUTLINE_WIDTH, CAPTION_WORDS_PER_CHUNK,
    ANIMATION_PRESETS, HIGHLIGHT_WORDS,
    VOICE_PROFILES,
    FFMPEG_PATH, AUDIO_MASTER_FILTER,
    ELEVENLABS_API_KEY, ELEVENLABS_VOICES, ELEVENLABS_MODEL,
    get_random_script, detect_topic,
)

# ── Optional ElevenLabs import ────────────────────────────────────
_ELEVEN_AVAILABLE = False
try:
    if ELEVENLABS_API_KEY:
        from elevenlabs.client import ElevenLabs
        from elevenlabs import save as eleven_save
        _eleven_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        _ELEVEN_AVAILABLE = True
except ImportError:
    pass


# ══════════════════════════════════════════════════════════════════
#  MAIN API
# ══════════════════════════════════════════════════════════════════

async def generate_voiceover(script=None, topic=None, output_name=None):
    """
    Generate a high-quality voiceover with topic-aware delivery.
    Tries ElevenLabs first → falls back to edge-tts.
    Returns dict with audio_path, subtitle_data, script, voice, topic, profile.
    """
    if script is None:
        entry = get_random_script()
        script = entry["text"]
        topic = entry.get("topic")
    if topic is None:
        topic = detect_topic(script)
    if output_name is None:
        output_name = f"voice_{random.randint(100000, 999999)}"

    profile = VOICE_PROFILES.get(topic, VOICE_PROFILES["_default"])
    profile_name = profile["style"]
    print(f"   Topic    : {topic} → {profile_name}")

    raw_path   = os.path.join(TEMP_DIR, f"{output_name}_raw.mp3")
    final_path = os.path.join(VOICES_DIR, f"{output_name}.mp3")
    subs_path  = os.path.join(TEMP_DIR, f"{output_name}_subs.json")

    voice_used = "unknown"
    all_words  = []
    audio_ok   = False

    # ── Tier 1: ElevenLabs (if available) ─────────────────────────
    if _ELEVEN_AVAILABLE:
        try:
            eleven_voice = profile.get("eleven_voice", "narrator_male")
            voice_id = ELEVENLABS_VOICES.get(eleven_voice, ELEVENLABS_VOICES["narrator_male"])
            print(f"   Engine   : ElevenLabs ({eleven_voice})")

            audio_gen = _eleven_client.generate(
                text=script, voice=voice_id,
                model=ELEVENLABS_MODEL,
            )
            eleven_save(audio_gen, raw_path)

            if os.path.exists(raw_path) and os.path.getsize(raw_path) > 500:
                voice_used = f"ElevenLabs:{eleven_voice}"
                audio_ok = True
                print(f"   ✅ ElevenLabs generated ({os.path.getsize(raw_path)} bytes)")
        except Exception as e:
            print(f"   ⚠️ ElevenLabs failed: {e}")

    # ── Tier 2: edge-tts two-pass (hook + body) ──────────────────
    if not audio_ok:
        voice_used, all_words, audio_ok = await _edgetts_generate(
            script, profile, output_name, raw_path,
        )

    if not audio_ok:
        raise RuntimeError("All voice generation attempts failed.")

    # ── Audio mastering ───────────────────────────────────────────
    print(f"   Mastering: compression + EQ + loudnorm")
    _master_audio(raw_path, final_path)

    # ── Build subtitle phrases ────────────────────────────────────
    if all_words:
        phrases = _build_phrases_from_words(all_words, CAPTION_WORDS_PER_CHUNK)
    else:
        audio_dur = _get_audio_duration(final_path)
        if audio_dur <= 0:
            audio_dur = _get_audio_duration(raw_path)
        if audio_dur > 0:
            phrases = _build_phrases_from_duration(script, audio_dur, CAPTION_WORDS_PER_CHUNK)
        else:
            phrases = _build_phrases_fallback(script, CAPTION_WORDS_PER_CHUNK)

    with open(subs_path, "w", encoding="utf-8") as f:
        json.dump(phrases, f, indent=2, ensure_ascii=False)

    print(f"   Audio    : {os.path.basename(final_path)}")
    print(f"   Phrases  : {len(phrases)} subtitle chunks")

    return {
        "audio_path": final_path,
        "subtitle_data": phrases,
        "script": script,
        "voice": voice_used,
        "topic": topic,
        "profile": profile_name,
    }


# ══════════════════════════════════════════════════════════════════
#  EDGE-TTS ENGINE (with two-pass + single-pass fallback)
# ══════════════════════════════════════════════════════════════════

async def _edgetts_generate(script, profile, output_name, raw_path):
    """
    Generate voice via edge-tts. Returns (voice_name, word_data, success).
    Two-pass: hook with dramatic pacing + body with topic pacing.
    Falls back to single-pass if needed.
    """
    available_voices = list(profile["voices"])
    random.shuffle(available_voices)
    hook_text, body_text = _split_hook_body(script)

    hook_path = os.path.join(TEMP_DIR, f"{output_name}_hook.mp3")
    body_path = os.path.join(TEMP_DIR, f"{output_name}_body.mp3")

    voice_used = available_voices[0]
    all_words  = []

    # ── Two-pass attempt ──────────────────────────────────────────
    for attempt, voice in enumerate(available_voices):
        vname = voice.split("-")[-1].replace("Neural", "")
        print(f"   Engine   : edge-tts → {vname}" + (f" (retry)" if attempt > 0 else ""))
        print(f"   Hook     : {hook_text[:55]}...")

        try:
            hw, hb = await _generate_segment(
                hook_text, voice,
                rate=profile["hook_rate"], pitch=profile["hook_pitch"],
                output_path=hook_path,
            )
            if hb < 500:
                continue

            bw, bb = [], 0
            if body_text.strip():
                bw, bb = await _generate_segment(
                    body_text, voice,
                    rate=profile["rate"], pitch=profile["pitch"],
                    output_path=body_path,
                )

            if bb > 100 and os.path.exists(body_path):
                _concat_audio(hook_path, body_path, raw_path)
                hook_dur = _get_audio_duration(hook_path)
                for w in bw:
                    w["start"] += hook_dur
                    w["end"]   += hook_dur
                all_words = hw + bw
            else:
                shutil.copy2(hook_path, raw_path)
                all_words = hw

            voice_used = voice
            print(f"   ✅ Two-pass OK")
            return voice_used, all_words, True

        except Exception as e:
            print(f"   ⚠️ {vname} failed: {e}")

    # ── Single-pass fallback ──────────────────────────────────────
    print(f"   ⚠️ Two-pass failed → single-pass...")
    clean = script.replace("...", ".").replace("..", ".")
    fallback = list(available_voices)
    if "en-US-ChristopherNeural" not in fallback:
        fallback.insert(0, "en-US-ChristopherNeural")

    for fv in fallback:
        try:
            sw, sb = await _generate_segment(
                clean, fv, rate="+8%", pitch="+0Hz",
                output_path=raw_path,
            )
            if sb > 500:
                print(f"   ✅ Single-pass OK ({sb} bytes)")
                return fv, sw, True
        except Exception:
            pass

    return voice_used, [], False


# ══════════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ══════════════════════════════════════════════════════════════════

def _split_hook_body(script):
    """Split into hook (first 1-2 sentences) + body."""
    parts = re.split(r'(?<=[.!?])\s+', script.strip())
    if not parts:
        return script, ""
    hook = parts[0]
    if len(hook.split()) < 8 and len(parts) > 1:
        hook = parts[0] + " " + parts[1]
        body = " ".join(parts[2:])
    else:
        body = " ".join(parts[1:])
    return hook.strip(), body.strip()


async def _generate_segment(text, voice, rate, pitch, output_path):
    """Generate audio segment. Returns (word_data, audio_bytes)."""
    comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
    word_data = []
    audio_bytes = 0
    with open(output_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
                audio_bytes += len(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                offset = chunk["offset"] / 10_000_000
                dur    = chunk["duration"] / 10_000_000
                word_data.append({"text": chunk["text"], "start": offset, "end": offset + dur})
    return word_data, audio_bytes


def _concat_audio(a, b, out):
    lst = out + ".txt"
    with open(lst, "w") as f:
        f.write(f"file '{a}'\nfile '{b}'\n")
    subprocess.run([FFMPEG_PATH, "-y", "-f", "concat", "-safe", "0",
                    "-i", lst, "-c", "copy", out], capture_output=True)
    try:
        os.remove(lst)
    except OSError:
        pass


def _get_audio_duration(path):
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


def _master_audio(inp, out):
    """Apply studio mastering: compression, EQ, loudnorm."""
    r = subprocess.run([
        FFMPEG_PATH, "-y", "-i", inp,
        "-af", AUDIO_MASTER_FILTER,
        "-ar", "44100", "-b:a", "192k", out,
    ], capture_output=True, text=True)

    if r.returncode != 0:
        r2 = subprocess.run([
            FFMPEG_PATH, "-y", "-i", inp,
            "-af", "loudnorm=I=-14:TP=-1:LRA=11",
            "-ar", "44100", "-b:a", "192k", out,
        ], capture_output=True, text=True)
        if r2.returncode != 0:
            shutil.copy2(inp, out)


# ══════════════════════════════════════════════════════════════════
#  SUBTITLE PHRASE BUILDERS
# ══════════════════════════════════════════════════════════════════

def _build_phrases_from_words(word_data, default_wpc=3):
    phrases = []
    i = 0
    while i < len(word_data):
        # Retention hook: use 1-2 words for the first 3 seconds for fast-paced intro
        if word_data[i]["start"] < 3.0:
            wpc = random.choice([1, 2])
        else:
            wpc = default_wpc
        
        chunk = word_data[i:i+wpc]
        i += wpc

        text = " ".join(w["text"] for w in chunk).upper()
        has_hl = any(w["text"].strip(".,!?;:'\"").upper() in HIGHLIGHT_WORDS for w in chunk)
        phrases.append({
            "text": text,
            "start": round(chunk[0]["start"], 3),
            "end":   round(chunk[-1]["end"], 3),
            "highlight": has_hl,
        })
    return phrases


def _build_phrases_from_duration(script, duration, default_wpc=3):
    """Distribute phrases proportionally across audio duration."""
    clean = script.replace("...", " ").replace("..", " ")
    words = clean.split()
    if not words:
        return []
    tpw = (duration * 0.95) / len(words)
    gap = 0.03
    phrases = []
    t = 0.1
    i = 0
    while i < len(words):
        # Retention hook: fast pace for first 3 seconds
        if t < 3.0:
            wpc = random.choice([1, 2])
        else:
            wpc = default_wpc
            
        chunk = words[i:i+wpc]
        i += wpc
        
        text = " ".join(chunk).upper()
        dur  = len(chunk) * tpw
        has_hl = any(w.strip(".,!?;:'\"").upper() in HIGHLIGHT_WORDS for w in chunk)
        phrases.append({"text": text, "start": round(t, 3),
                        "end": round(t + dur, 3), "highlight": has_hl})
        t += dur + gap
    return phrases


def _build_phrases_fallback(script, default_wpc=3):
    words = script.split()
    tpw = 0.35
    phrases = []
    i = 0
    t = 0
    while i < len(words):
        if t < 3.0:
            wpc = random.choice([1, 2])
        else:
            wpc = default_wpc
            
        chunk = words[i:i+wpc]
        i += wpc
        
        text = " ".join(chunk).upper()
        has_hl = any(w.strip(".,!?;:'\"").upper() in HIGHLIGHT_WORDS for w in chunk)
        phrases.append({"text": text, "start": round(t, 3),
                        "end": round(t + (len(chunk)*tpw), 3), "highlight": has_hl})
        t += len(chunk) * tpw
    return phrases


# ══════════════════════════════════════════════════════════════════
#  ASS SUBTITLE FILE GENERATION
# ══════════════════════════════════════════════════════════════════

def pick_random_animation():
    p = random.choice(ANIMATION_PRESETS)
    return {
        "name":       p["name"],
        "fade_in":    random.randint(*p["fade_in"]),
        "fade_out":   random.randint(*p["fade_out"]),
        "scale_up":   random.randint(*p["scale_up"]),
        "scale_time": random.randint(*p["scale_time"]),
    }


def generate_ass_subtitles(phrases, output_path, font_size=None, margin_v=None, is_luxury=False):
    """Generate ASS subtitle file with viral-style animations."""
    fs = font_size or CAPTION_FONT_SIZE
    mv = margin_v  or CAPTION_MARGIN_V
    ow = CAPTION_OUTLINE_WIDTH
    al = CAPTION_ALIGNMENT

    anim = pick_random_animation()
    # Luxury reels prefer slower, smoother subtitle animations
    if is_luxury and anim["name"] not in ("luxury_fade", "smooth_breathe"):
        for p in ANIMATION_PRESETS:
            if p["name"] == "luxury_fade":
                anim = {
                    "name": "luxury_fade",
                    "fade_in":    random.randint(*p["fade_in"]),
                    "fade_out":   random.randint(*p["fade_out"]),
                    "scale_up":   random.randint(*p["scale_up"]),
                    "scale_time": random.randint(*p["scale_time"]),
                }
                break

    print(f"   Subtitle animation: {anim['name']}")

    # Luxury gets gold accent instead of yellow
    hook_color = "&H0001D7FF" if is_luxury else "&H0000FFFF"
    hl_color   = "&H0000CCFF" if is_luxury else "&H0000DDFF"

    ass = f"""[Script Info]
Title: AI Reel Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,{fs},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,3,0,1,{ow},3,{al},40,40,{mv},1
Style: Hook,Arial Black,{fs+14},{hook_color},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,4,0,1,{ow+2},4,{al},40,40,{mv},1
Style: Highlight,Arial Black,{fs+6},{hl_color},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,3,0,1,{ow},3,{al},40,40,{mv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    fi, fo, su, st = anim["fade_in"], anim["fade_out"], anim["scale_up"], anim["scale_time"]

    for i, p in enumerate(phrases):
        s_ts = _fmt_ass(p["start"])
        e_ts = _fmt_ass(p["end"])
        style = "Hook" if i < 2 else ("Highlight" if p.get("highlight") else "Default")
        fx = (r"{\fad(" + str(fi) + "," + str(fo) + ")"
              r"\t(0," + str(st) + r",\fscx" + str(su) + r"\fscy" + str(su) + ")"
              r"\t(" + str(st) + "," + str(st*2) + r",\fscx100\fscy100)}"
              + p["text"])
        ass += f"Dialogue: 0,{s_ts},{e_ts},{style},,0,0,0,,{fx}\n"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(ass)
    return output_path


def _fmt_ass(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int((sec % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"
