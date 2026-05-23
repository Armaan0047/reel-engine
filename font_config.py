"""
Font configuration for headless Linux (Railway/Docker).
Ensures fontconfig is properly initialized and a usable font is available
for FFmpeg's ASS subtitle filter.
"""
import os
import subprocess
import shutil

# ─── Detect project paths ────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(PROJECT_ROOT, "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)


def _is_linux():
    return os.name == "posix"


def _find_system_font():
    """Find a usable bold sans-serif font on the system."""
    # Priority search paths for Linux containers
    search_paths = [
        "/usr/share/fonts",
        "/usr/local/share/fonts",
        os.path.join(PROJECT_ROOT, "fonts"),
    ]

    # Preferred font filenames (bold sans-serif for subtitle readability)
    preferred = [
        "DejaVuSans-Bold.ttf",
        "DejaVuSans.ttf",
        "LiberationSans-Bold.ttf",
        "FreeSansBold.ttf",
        "NotoSans-Bold.ttf",
        "arial.ttf",
        "Arial.ttf",
    ]

    for base in search_paths:
        if not os.path.isdir(base):
            continue
        for root, _dirs, files in os.walk(base):
            for pref in preferred:
                if pref in files:
                    return os.path.join(root, pref)

    # Last resort: find ANY .ttf file
    for base in search_paths:
        if not os.path.isdir(base):
            continue
        for root, _dirs, files in os.walk(base):
            for f in files:
                if f.lower().endswith(".ttf"):
                    return os.path.join(root, f)

    return None


def _create_fontconfig(font_path):
    """
    Create a minimal fonts.conf that fontconfig can load.
    Points to the directory containing our known-good font.
    """
    conf_dir = os.path.join(PROJECT_ROOT, "fonts")
    os.makedirs(conf_dir, exist_ok=True)
    conf_path = os.path.join(conf_dir, "fonts.conf")

    font_dir = os.path.dirname(font_path)

    conf_content = f"""<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>{font_dir}</dir>
  <dir>{conf_dir}</dir>
  <dir>/usr/share/fonts</dir>
  <dir>/usr/local/share/fonts</dir>
  <cachedir>/tmp/fontconfig-cache</cachedir>
  <match target="pattern">
    <test qual="any" name="family"><string>Arial Black</string></test>
    <edit name="family" mode="assign" binding="same"><string>DejaVu Sans</string></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>Arial</string></test>
    <edit name="family" mode="assign" binding="same"><string>DejaVu Sans</string></edit>
  </match>
</fontconfig>
"""
    with open(conf_path, "w") as f:
        f.write(conf_content)

    # Set the env var so fontconfig finds our config
    os.environ["FONTCONFIG_FILE"] = conf_path
    os.environ["FONTCONFIG_PATH"] = conf_dir
    os.environ["FC_CONFIG_DIR"] = conf_dir

    # Create cache dir
    os.makedirs("/tmp/fontconfig-cache", exist_ok=True)

    return conf_path


def _run_fc_cache():
    """Run fc-cache to rebuild font index."""
    try:
        subprocess.run(
            ["fc-cache", "-fv"],
            capture_output=True, text=True, timeout=30,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass


def init_fonts():
    """
    Initialize font system for production.
    Returns (font_name_for_ass, font_path_or_none).

    Call this once at startup. On Windows/dev, returns defaults.
    On Linux/Railway, sets up fontconfig and finds a real font.
    """
    if not _is_linux():
        # Windows/macOS — Arial Black is typically available
        return "Arial Black", None

    print("[FONTS] Initializing font system for Linux...")

    font_path = _find_system_font()
    if font_path:
        font_name = os.path.splitext(os.path.basename(font_path))[0]
        # Map filename to ASS-compatible font name
        name_map = {
            "DejaVuSans-Bold": "DejaVu Sans",
            "DejaVuSans": "DejaVu Sans",
            "LiberationSans-Bold": "Liberation Sans",
            "FreeSansBold": "FreeSans",
            "NotoSans-Bold": "Noto Sans",
        }
        ass_name = name_map.get(font_name, font_name)
        print(f"[FONTS] Found: {font_path}")
        print(f"[FONTS] ASS font name: {ass_name}")

        _create_fontconfig(font_path)
        _run_fc_cache()

        return ass_name, font_path
    else:
        print("[FONTS] ⚠️ No system fonts found — subtitles may fail")
        return "DejaVu Sans", None


# ─── Module-level initialization ──────────────────────────────────
# Run once on import; other modules read FONT_NAME and FONT_PATH
FONT_NAME, FONT_PATH = init_fonts()
