"""
AI Reel Agent v4.0 — Configuration
Multi-style cinematic viral reel engine.
Topic-aware visuals, premium voices, background music.
"""
import os
import random

# ─── Project Paths ────────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
VIDEOS_DIR   = os.path.join(PROJECT_ROOT, "videos")
VOICES_DIR   = os.path.join(PROJECT_ROOT, "voices")
REELS_DIR    = os.path.join(PROJECT_ROOT, "reels")
TEMP_DIR     = os.path.join(PROJECT_ROOT, "temp")
MUSIC_DIR    = os.path.join(PROJECT_ROOT, "music")

for d in [VIDEOS_DIR, VOICES_DIR, REELS_DIR, TEMP_DIR, MUSIC_DIR]:
    os.makedirs(d, exist_ok=True)

# ─── Music Categories ─────────────────────────────────────────────
MUSIC_CATEGORIES_MAP = {
    "ai_tech": "ai",
    "cybersecurity": "ai",
    "motivation": "motivation",
    "money": "motivation",
    "sigma": "motivation",
    "dark_psych": "dark",
    "harsh_truth": "dark",
    "society": "genz",
    "student": "genz",
    "pov": "genz",
    "luxury": "luxury",
    "sigma_luxury": "luxury",
}

for cat in set(MUSIC_CATEGORIES_MAP.values()):
    os.makedirs(os.path.join(MUSIC_DIR, cat), exist_ok=True)

# ─── FFmpeg ───────────────────────────────────────────────────────
from imageio_ffmpeg import get_ffmpeg_exe
FFMPEG_PATH = get_ffmpeg_exe()

# ─── Video Rendering ─────────────────────────────────────────────
OUTPUT_WIDTH  = 1080
OUTPUT_HEIGHT = 1920
OUTPUT_FPS    = 30
MAX_DURATION_SEC = 30
VIDEO_BITRATE = "5M"
AUDIO_BITRATE = "192k"

# ─── ElevenLabs (Premium Voice — optional) ────────────────────────
# Set environment variable ELEVENLABS_API_KEY to enable.
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICES = {
    "narrator_male":   "pNInz6obpgDQGcFmaJgB",   # Adam
    "narrator_deep":   "VR6AewLTigWG4xSOukaG",   # Arnold
    "narrator_calm":   "EXAVITQu4vr4xnSDxMaL",   # Bella
}
ELEVENLABS_MODEL = "eleven_multilingual_v2"

# ─── Subtitle / Caption Style ────────────────────────────────────
CAPTION_FONT_SIZE    = 82
CAPTION_OUTLINE_WIDTH = 7
CAPTION_ALIGNMENT    = 5        # Center-center
CAPTION_MARGIN_V     = 180
CAPTION_WORDS_PER_CHUNK = 3

ANIMATION_PRESETS = [
    {"name": "hard_snap",      "fade_in": (15, 40),  "fade_out": (15, 35),  "scale_up": (118, 135), "scale_time": (35, 65)},
    {"name": "pop_punch",      "fade_in": (50, 90),  "fade_out": (35, 70),  "scale_up": (108, 120), "scale_time": (55, 90)},
    {"name": "slam",           "fade_in": (10, 25),  "fade_out": (10, 20),  "scale_up": (125, 145), "scale_time": (25, 50)},
    {"name": "smooth_breathe", "fade_in": (80, 130), "fade_out": (60, 100), "scale_up": (104, 112), "scale_time": (90, 140)},
    {"name": "luxury_fade",    "fade_in": (120, 180),"fade_out": (100, 150),"scale_up": (102, 108), "scale_time": (120, 200)},
    {"name": "bouncy_pop",     "fade_in": (15, 30),  "fade_out": (15, 30),  "scale_up": (125, 140), "scale_time": (30, 45)},
    {"name": "kinetic_whip",   "fade_in": (10, 20),  "fade_out": (10, 20),  "scale_up": (115, 125), "scale_time": (20, 30)},
]

HIGHLIGHT_WORDS = {
    "AI", "NEVER", "ALWAYS", "EVERYTHING", "NOBODY", "EVERYONE",
    "REPLACE", "DESTROY", "CREATE", "BUILD", "FUTURE", "SECRET",
    "CRAZY", "INSANE", "SCARY", "MIND", "CHANGE", "CONTROL",
    "STOP", "WAIT", "LISTEN", "WATCH", "NOW", "TODAY",
    "IMPOSSIBLE", "INCREDIBLE", "POWERFUL", "BEHIND", "TRAPPED",
    "MONEY", "RICH", "BROKE", "SLAVE", "FREE", "SYSTEM",
    "DESIGNED", "PURPOSE", "DISTRACTED", "MANIPULATED",
    "COOKED", "DOOMED", "WINNING", "LOSING", "WAKE",
    "MATRIX", "ESCAPE", "RAT", "RACE", "GRIND", "HUSTLE",
    "DISCIPLINE", "WEAK", "STRONG", "AVERAGE", "ELITE",
    "GENERATION", "BRAIN", "ADDICTED", "PROGRAMMED",
    "BILLIONS", "MILLIONS", "REPLACED", "AUTOMATED",
    "DANGEROUS", "SILENT", "INVISIBLE", "HIDDEN",
    "LUXURY", "WEALTH", "EMPIRE", "PRIVATE", "BILLIONAIRE",
    "LAMBO", "YACHT", "PENTHOUSE", "FERRARI", "ROLEX",
    "JET", "MILLION", "DOLLAR", "SUCCESS", "LEGACY",
    "FR", "NGL", "LITERALLY", "WTF", "BRO", "FACTS",
    "OBSESSED", "HACK", "CHEAT", "CODE", "UNFAIR", "ADVANTAGE",
}


# ══════════════════════════════════════════════════════════════════
#  TOPIC SYSTEM — Dual-style routing
# ══════════════════════════════════════════════════════════════════

# Topics that use Luxury.mp4 background
LUXURY_TOPICS = {"luxury", "sigma_luxury"}

# Topics that use Minecraft gameplay background
MINECRAFT_TOPICS = {
    "ai_tech", "cybersecurity", "motivation", "dark_psych",
    "money", "society", "sigma", "student", "pov", "harsh_truth",
}

TOPIC_KEYWORDS = {
    "ai_tech":       ["AI", "robot", "automat", "code", "program", "technology", "machine", "algorithm"],
    "cybersecurity": ["hack", "dark web", "password", "data", "privacy", "tracking", "leaked"],
    "motivation":    ["grind", "discipline", "hustle", "empire", "comfort zone", "sacrifice", "dream"],
    "dark_psych":    ["manipulat", "psychology", "dopamine", "exploit", "programmed", "obedience"],
    "money":         ["money", "rich", "rat race", "nine to five", "financial", "debt"],
    "society":       ["generation", "cooked", "attention span", "social media", "distract"],
    "sigma":         ["sigma", "silence", "results", "dangerous", "alone", "chase"],
    "student":       ["classmate", "study", "school", "student", "boss", "boring"],
    "pov":           ["POV", "pov", "realize", "stopped caring", "deleted the apps"],
    "harsh_truth":   ["harsh", "truth", "owe", "degree", "talent", "loneliness"],
    "luxury":        ["luxury", "lambo", "yacht", "penthouse", "billionaire", "private jet",
                      "ferrari", "rolex", "lifestyle", "mansion", "supercar", "wealth",
                      "expensive", "first class", "champagne"],
    "sigma_luxury":  ["sigma billionaire", "luxury sigma", "rich mindset", "wealthy discipline"],
}

def detect_topic(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for topic, keywords in TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score > 0:
            scores[topic] = score
    return max(scores, key=scores.get) if scores else "motivation"


# ══════════════════════════════════════════════════════════════════
#  VOICE PROFILES — Topic-aware voice + pacing
# ══════════════════════════════════════════════════════════════════

VOICE_PROFILES = {
    "ai_tech":       {"voices": ["en-US-GuyNeural", "en-US-ChristopherNeural"],
                      "rate": "+8%",  "pitch": "+2Hz",  "hook_rate": "+2%",  "hook_pitch": "+4Hz",
                      "style": "futuristic_intense", "eleven_voice": "narrator_deep"},
    "cybersecurity": {"voices": ["en-US-GuyNeural", "en-US-ChristopherNeural"],
                      "rate": "+5%",  "pitch": "-2Hz",  "hook_rate": "+0%",  "hook_pitch": "-3Hz",
                      "style": "mysterious_smart",   "eleven_voice": "narrator_deep"},
    "motivation":    {"voices": ["en-US-ChristopherNeural", "en-US-GuyNeural"],
                      "rate": "+10%", "pitch": "+3Hz",  "hook_rate": "+5%",  "hook_pitch": "+5Hz",
                      "style": "inspiring_confident", "eleven_voice": "narrator_male"},
    "dark_psych":    {"voices": ["en-US-GuyNeural", "en-US-ChristopherNeural"],
                      "rate": "+3%",  "pitch": "-3Hz",  "hook_rate": "+0%",  "hook_pitch": "-4Hz",
                      "style": "creepy_calm",        "eleven_voice": "narrator_deep"},
    "money":         {"voices": ["en-US-ChristopherNeural", "en-US-GuyNeural"],
                      "rate": "+8%",  "pitch": "+1Hz",  "hook_rate": "+3%",  "hook_pitch": "+3Hz",
                      "style": "deep_emotional",     "eleven_voice": "narrator_male"},
    "society":       {"voices": ["en-US-GuyNeural", "en-US-AndrewNeural"],
                      "rate": "+12%", "pitch": "+2Hz",  "hook_rate": "+8%",  "hook_pitch": "+4Hz",
                      "style": "conversational_fast", "eleven_voice": "narrator_male"},
    "sigma":         {"voices": ["en-US-ChristopherNeural", "en-US-GuyNeural"],
                      "rate": "+5%",  "pitch": "-1Hz",  "hook_rate": "+0%",  "hook_pitch": "-2Hz",
                      "style": "commanding_cold",    "eleven_voice": "narrator_deep"},
    "student":       {"voices": ["en-US-GuyNeural", "en-US-AndrewNeural"],
                      "rate": "+10%", "pitch": "+3Hz",  "hook_rate": "+5%",  "hook_pitch": "+5Hz",
                      "style": "inspiring_confident", "eleven_voice": "narrator_male"},
    "pov":           {"voices": ["en-US-GuyNeural", "en-US-AndrewNeural"],
                      "rate": "+8%",  "pitch": "+1Hz",  "hook_rate": "+3%",  "hook_pitch": "+2Hz",
                      "style": "storytelling_natural","eleven_voice": "narrator_male"},
    "harsh_truth":   {"voices": ["en-US-ChristopherNeural", "en-US-GuyNeural"],
                      "rate": "+6%",  "pitch": "+0Hz",  "hook_rate": "+2%",  "hook_pitch": "+2Hz",
                      "style": "documentary_narrator","eleven_voice": "narrator_deep"},
    "luxury":        {"voices": ["en-US-ChristopherNeural", "en-US-GuyNeural"],
                      "rate": "+3%",  "pitch": "-2Hz",  "hook_rate": "+0%",  "hook_pitch": "-1Hz",
                      "style": "calm_billionaire",   "eleven_voice": "narrator_calm"},
    "sigma_luxury":  {"voices": ["en-US-ChristopherNeural", "en-US-GuyNeural"],
                      "rate": "+5%",  "pitch": "-1Hz",  "hook_rate": "+2%",  "hook_pitch": "-1Hz",
                      "style": "commanding_luxury",  "eleven_voice": "narrator_deep"},
    "_default":      {"voices": ["en-US-GuyNeural", "en-US-ChristopherNeural"],
                      "rate": "+8%",  "pitch": "+1Hz",  "hook_rate": "+3%",  "hook_pitch": "+3Hz",
                      "style": "documentary_narrator","eleven_voice": "narrator_male"},
}


# ══════════════════════════════════════════════════════════════════
#  RENDERING PROFILES — Visual style per topic category
# ══════════════════════════════════════════════════════════════════

# Minecraft topics: clean, satisfying, TikTok retention style
# Zoom: very subtle so gameplay stays clearly visible
# Vignette: light (higher PI/x = lighter). Sharpen: minimal
RENDER_STYLE_MINECRAFT = {
    "contrast":   (1.02, 1.08),
    "saturation": (1.05, 1.18),
    "brightness": (0.0, 0.03),
    "vignette":   (5.0, 8.0),     # Light vignette (PI/5 to PI/8)
    "sharpen":    (0.15, 0.35),   # Subtle clarity only
    "zoom":       (0.008, 0.018), # Barely noticeable drift
}

# Luxury topics: cinematic, slow, dark-rich, landscape-aware
RENDER_STYLE_LUXURY = {
    "contrast":   (1.06, 1.14),   # Cinematic but not crushed
    "saturation": (0.88, 1.05),   # Slightly desaturated = premium
    "brightness": (-0.01, 0.02),
    "vignette":   (3.5, 6.0),     # Moderate cinematic vignette
    "sharpen":    (0.2, 0.5),     # Clean sharpening
    "zoom":       (0.005, 0.02),  # Very slow, smooth drift
}


# ══════════════════════════════════════════════════════════════════
#  AMBIENT MUSIC SYNTHESIS — FFmpeg-generated per topic
# ══════════════════════════════════════════════════════════════════
# Each topic gets a unique ambient pad generated via FFmpeg synthesis.
# Parameters: base frequencies (Hz), noise type, filter range.

MUSIC_SYNTH_PARAMS = {
    "motivation": {
        "freq1": 261.63, "freq2": 329.63,   # C4, E4 — major, uplifting
        "noise": "pink", "noise_amp": 0.008,
        "hp": 150, "lp": 2000, "sine_vol": 0.012,
        "label": "cinematic_rise",
    },
    "luxury": {
        "freq1": 130.81, "freq2": 196.00,   # C3, G3 — warm, elegant
        "noise": "brown", "noise_amp": 0.005,
        "hp": 60, "lp": 800, "sine_vol": 0.015,
        "label": "luxury_ambient",
    },
    "ai_tech": {
        "freq1": 87.31, "freq2": 123.47,    # F2, B2 — dark, futuristic
        "noise": "brown", "noise_amp": 0.010,
        "hp": 40, "lp": 600, "sine_vol": 0.010,
        "label": "cyber_dark",
    },
    "cybersecurity": {
        "freq1": 92.50, "freq2": 130.81,    # Gb2, C3 — dissonant, mysterious
        "noise": "brown", "noise_amp": 0.012,
        "hp": 50, "lp": 500, "sine_vol": 0.008,
        "label": "cyber_dark",
    },
    "dark_psych": {
        "freq1": 110.00, "freq2": 146.83,   # A2, D3 — ominous
        "noise": "brown", "noise_amp": 0.010,
        "hp": 40, "lp": 700, "sine_vol": 0.010,
        "label": "dark_ambient",
    },
    "money": {
        "freq1": 220.00, "freq2": 261.63,   # A3, C4 — emotional minor
        "noise": "pink", "noise_amp": 0.006,
        "hp": 100, "lp": 1500, "sine_vol": 0.010,
        "label": "emotional_piano",
    },
    "sigma": {
        "freq1": 65.41, "freq2": 98.00,     # C2, G2 — heavy bass
        "noise": "brown", "noise_amp": 0.015,
        "hp": 30, "lp": 400, "sine_vol": 0.018,
        "label": "sigma_bass",
    },
    "sigma_luxury": {
        "freq1": 82.41, "freq2": 123.47,    # E2, B2 — dark luxury
        "noise": "brown", "noise_amp": 0.012,
        "hp": 40, "lp": 500, "sine_vol": 0.015,
        "label": "dark_luxury",
    },
    "_default": {
        "freq1": 196.00, "freq2": 261.63,   # G3, C4 — neutral ambient
        "noise": "pink", "noise_amp": 0.006,
        "hp": 80, "lp": 1200, "sine_vol": 0.010,
        "label": "ambient_pad",
    },
}

# Music volume in final mix (0.0 - 1.0). Voice stays at 1.0.
MUSIC_MIX_VOLUME = 0.08   # 8% — subtle, never overpowers voice


# ══════════════════════════════════════════════════════════════════
#  AUDIO MASTERING — FFmpeg filter chain for studio quality
# ══════════════════════════════════════════════════════════════════

AUDIO_MASTER_FILTER = (
    "highpass=f=80,"
    "acompressor=threshold=-18dB:ratio=4:attack=5:release=100:makeup=2dB,"
    "equalizer=f=200:t=q:w=1.0:g=-2,"
    "equalizer=f=3000:t=q:w=1.5:g=4,"
    "equalizer=f=8000:t=q:w=1.5:g=3,"
    "loudnorm=I=-14:TP=-1:LRA=11"
)


# ══════════════════════════════════════════════════════════════════
#  VIRAL SCRIPT LIBRARY — Tagged with topics
# ══════════════════════════════════════════════════════════════════

def get_random_script() -> dict:
    return random.choice(VIRAL_SCRIPTS)

VIRAL_SCRIPTS = [
    # ─── AI Revolution ───────────────────────────────────────────
    {"topic": "ai_tech", "text":
     "Nobody tells you this. AI is replacing jobs faster than you think. "
     "What took humans years... now takes seconds. "
     "And the scariest part? We are just getting started. "
     "Adapt or become irrelevant. There is no middle ground."},
    {"topic": "ai_tech", "text":
     "The system was designed to keep you busy. "
     "While you scroll... AI is learning everything. "
     "It writes code. Creates art. Builds companies. "
     "And it never sleeps. Wake up... before it's too late."},
    {"topic": "ai_tech", "text":
     "AI just did in five seconds... what took a team two weeks. "
     "Programmers are scared. Designers are worried. Writers are panicking. "
     "But here is the truth nobody wants to hear. "
     "The ones who learn AI... will control everything."},
    {"topic": "ai_tech", "text":
     "You are being replaced... right now. "
     "AI is studying your job. Your patterns. Your skills. "
     "In three years, half of today's jobs won't exist. "
     "This isn't fear. This is a fact. Choose wisely."},
    {"topic": "ai_tech", "text":
     "Stop scrolling. This AI cheat code is literally unfair. "
     "People are using this secret tool to do 50 hours of work in 5 minutes. "
     "And the best part? It's completely free. "
     "If you don't use this, you are actually throwing money away."},
    {"topic": "ai_tech", "text":
     "Everyone is sleeping on this AI hack. "
     "While they complain about the job market, smart people are automating everything. "
     "I literally built a business in 30 minutes using one prompt. "
     "Wake up before you get left completely behind."},

    # ─── Cybersecurity ───────────────────────────────────────────
    {"topic": "cybersecurity", "text":
     "Hackers can break into your phone... in under sixty seconds. "
     "Your password? Already leaked on the dark web. "
     "Every app you use is tracking everything you do. "
     "You are not the user. You are the product."},
    {"topic": "cybersecurity", "text":
     "The internet knows more about you... than your best friend does. "
     "Every search. Every click. Every pause on a video. "
     "Algorithms are building a digital version of you. "
     "And they are using it... to predict your next move."},

    # ─── Motivation ──────────────────────────────────────────────
    {"topic": "motivation", "text":
     "Everyone wants the lifestyle... but nobody wants the grind. "
     "They see the results but ignore the sacrifice. "
     "While you were sleeping, someone was building their empire. "
     "Discipline is choosing between what you want now... and what you want most."},
    {"topic": "motivation", "text":
     "Nobody is coming to save you. Read that again. "
     "Your parents can not guide you through a world they never experienced. "
     "School did not prepare you for this. "
     "The only person who can change your life... is staring at your screen right now."},
    {"topic": "motivation", "text":
     "Your comfort zone is the most dangerous place you can be. "
     "Every day you stay comfortable... someone hungry is catching up. "
     "Pain is temporary. Regret is forever. "
     "Choose the pain of discipline... over the pain of regret."},
    {"topic": "motivation", "text":
     "Bro, listen to me. 99% of people will watch this and do nothing. "
     "They will keep scrolling. Keep complaining. Keep making excuses. "
     "Be the 1% that actually takes action today. "
     "Your future self is literally begging you to start."},

    # ─── Dark Psychology ─────────────────────────────────────────
    {"topic": "dark_psych", "text":
     "You are being manipulated... every single day. "
     "Social media is designed to keep you addicted. "
     "Every notification is a dopamine hit... calculated by algorithms. "
     "They do not want you focused. They want you distracted."},
    {"topic": "dark_psych", "text":
     "They programmed you to be average. "
     "School taught you to follow rules... not break them. "
     "Society rewards obedience, not intelligence. "
     "The moment you realize this... everything changes."},

    # ─── Sigma Mindset ───────────────────────────────────────────
    {"topic": "sigma", "text":
     "Discipline is not motivation. Motivation disappears. "
     "Discipline is doing what needs to be done... when you feel nothing. "
     "The world belongs to those who show up every single day. "
     "No excuses. No breaks. No mercy."},
    {"topic": "sigma", "text":
     "Stop telling people your plans. "
     "Show them your results instead. "
     "The silent ones are always the most dangerous. "
     "Build in the dark. Shine in the light."},

    # ─── Money / Rat Race ────────────────────────────────────────
    {"topic": "money", "text":
     "Smart people are leaving the rat race. "
     "They realized working nine to five... makes someone else rich. "
     "Your time is being traded for pennies. "
     "The system was designed to keep you just comfortable enough... to never leave."},
    {"topic": "money", "text":
     "You were born into a system that profits from your confusion. "
     "They want you in debt. They want you consuming. "
     "Financial freedom starts with one simple truth. "
     "If you do not build your own dream... someone will hire you to build theirs."},
    {"topic": "money", "text":
     "The biggest lie you've been sold is that saving money makes you rich. "
     "Inflation is literally eating your bank account alive. "
     "Rich people don't save money. They buy assets that print money. "
     "Stop playing the game by their rules, because you are designed to lose."},

    # ─── Society ─────────────────────────────────────────────────
    {"topic": "society", "text":
     "This generation is cooked. And I mean that seriously. "
     "Attention spans shorter than goldfish. "
     "Everyone wants success but nobody can focus for ten minutes. "
     "You are competing against people... who deleted social media."},
    {"topic": "society", "text":
     "You are being distracted on purpose. "
     "While you watch reels... someone your age is learning skills. "
     "While you argue online... someone is building a business. "
     "Time is the only thing... you can never get back."},

    # ─── Student / Self-Improvement ──────────────────────────────
    {"topic": "student", "text":
     "While your classmates party... you study. "
     "While they sleep... you grind. "
     "They will call you boring now. "
     "They will call you boss... in five years."},
    {"topic": "student", "text":
     "The best investment you will ever make... is in yourself. "
     "Not stocks. Not crypto. Not real estate. "
     "A sharp mind and relentless discipline will outperform everything. "
     "Invest in skills that can not be taken away."},

    # ─── POV Style ───────────────────────────────────────────────
    {"topic": "pov", "text":
     "POV: You stopped caring what people think. "
     "You deleted the apps that wasted your time. "
     "You started waking up at five AM. "
     "And slowly... everything in your life started changing."},
    {"topic": "pov", "text":
     "POV: You realize your parents sacrificed everything for you. "
     "They worked jobs they hated... so you could dream. "
     "And you are sitting here... wasting the opportunity. "
     "This is your sign to make it count."},

    # ─── Harsh Truth ─────────────────────────────────────────────
    {"topic": "harsh_truth", "text":
     "Harsh truth. Most people will never achieve their dreams. "
     "Not because they can not. But because they will not. "
     "Talent is common. Discipline is rare. "
     "The gap between dreaming and doing... is called action."},
    {"topic": "harsh_truth", "text":
     "Loneliness is not being alone. "
     "Loneliness is being surrounded by people who do not understand you. "
     "The path to greatness is walked alone. "
     "Embrace the silence. That is where growth lives."},

    # ═══ LUXURY / BILLIONAIRE ════════════════════════════════════
    {"topic": "luxury", "text":
     "While they argue about prices... you compare private jets. "
     "While they save for shoes... you invest in assets. "
     "Luxury is not a dream. It is a decision. "
     "And that decision starts... right now."},
    {"topic": "luxury", "text":
     "Most people will never sit in a first class seat. "
     "Most people will never drive a car worth six figures. "
     "Not because they can not afford it... "
     "but because they were never taught to think that big."},
    {"topic": "luxury", "text":
     "The billionaire mindset is simple. "
     "Buy assets. Build systems. Protect your time. "
     "While everyone is chasing trends... "
     "the wealthy are building generational empires in silence."},
    {"topic": "luxury", "text":
     "Look at this. This isn't luck. This is obsession. "
     "You don't get this lifestyle by working 9 to 5 and hoping for a raise. "
     "You get this by taking insane risks and outworking everybody else. "
     "The choice is literally yours."},
    {"topic": "luxury", "text":
     "Your environment determines your net worth. "
     "Surround yourself with people who talk about investments... not gossip. "
     "Luxury is not about showing off. "
     "Luxury is about freedom. And freedom... is the ultimate currency."},
    {"topic": "luxury", "text":
     "They laughed when you said you would be rich. "
     "They stopped laughing when you pulled up in a Lamborghini. "
     "Success is the best revenge. "
     "Let your lifestyle do the talking."},
    {"topic": "sigma_luxury", "text":
     "A sigma does not flex. A sigma lets results speak. "
     "The penthouse. The watch. The portfolio. "
     "All built in silence while everyone was busy being loud. "
     "Discipline plus patience... equals wealth."},
    {"topic": "sigma_luxury", "text":
     "They ask how you afford it. You do not answer. "
     "Sigma rule. Never reveal your income. "
     "Let them wonder while you build your empire. "
     "The quiet ones always win."},
    {"topic": "luxury", "text":
     "Five AM. Empty roads. You and your goals. "
     "While the world sleeps... you compound your wealth. "
     "Every hour before sunrise is an investment. "
     "The rich understand what the poor never will... time is money."},
]
