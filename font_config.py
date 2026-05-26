"""
Font configuration for headless Linux (Railway/Docker).

Strategy:
  1. ALWAYS set FONTCONFIG_FILE to our committed fonts/fonts.conf
  2. Use bundled font (fonts/bundled_font.ttf) as primary — no system dependency
  3. If system fonts exist (DejaVu from apt), prefer those but don't require them
  4. Export FONT_NAME (for ASS styles) and FONT_PATH (for fontsdir/fontfile)

This module is imported at startup by api_server.py and video_renderer.py.
"""
import os
import subprocess
import shutil

# ─── Project paths ────────────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(PROJECT_ROOT, "fonts")
BUNDLED_FONT = os.path.join(FONTS_DIR, "bundled_font.ttf")
FONTS_CONF = os.path.join(FONTS_DIR, "fonts.conf")


def _is_linux():
    return os.name == "posix"


def _setup_fontconfig():
    """
    Point FONTCONFIG_FILE to our committed fonts.conf.
    This MUST happen before any FFmpeg/libass call.
    """
    if os.path.isfile(FONTS_CONF):
        os.environ["FONTCONFIG_FILE"] = FONTS_CONF
        os.environ["FONTCONFIG_PATH"] = FONTS_DIR
        print(f"[FONTS] FONTCONFIG_FILE = {FONTS_CONF}")
    else:
        print(f"[FONTS] WARNING: fonts.conf not found at {FONTS_CONF}")

    # Ensure cache dir exists
    try:
        os.makedirs("/tmp/fontconfig-cache", exist_ok=True)
    except OSError:
        pass


def _find_best_font():
    """
    Find the best available font. Priority:
      1. System DejaVuSans-Bold.ttf (installed by nixpacks apt)
      2. Bundled font from repo (fonts/bundled_font.ttf)
      3. Any .ttf on the system
    Returns (font_path, font_name_for_ass).
    """
    # Priority 1: System DejaVu (best quality, matches ASS font name perfectly)
    system_candidates = [
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "DejaVu Sans"),
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVu Sans"),
        ("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", "Liberation Sans"),
        ("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", "Liberation Sans"),
    ]
    for path, name in system_candidates:
        if os.path.isfile(path):
            print(f"[FONTS] Found system font: {path}")
            # Copy to project dir so fontsdir always works
            local = os.path.join(FONTS_DIR, os.path.basename(path))
            if not os.path.isfile(local):
                try:
                    shutil.copy2(path, local)
                    print(f"[FONTS] Copied to project: {local}")
                except Exception:
                    local = path
            return local, name

    # Priority 2: Bundled font (committed to repo)
    if os.path.isfile(BUNDLED_FONT) and os.path.getsize(BUNDLED_FONT) > 10000:
        print(f"[FONTS] Using bundled font: {BUNDLED_FONT}")
        return BUNDLED_FONT, "Arial"

    # Priority 3: Walk system font directories
    for search_dir in ["/usr/share/fonts", "/usr/local/share/fonts"]:
        if not os.path.isdir(search_dir):
            continue
        for root, _, files in os.walk(search_dir):
            for f in files:
                if f.lower().endswith(".ttf"):
                    full = os.path.join(root, f)
                    base = os.path.splitext(f)[0]
                    print(f"[FONTS] Found fallback font: {full}")
                    return full, base

    print("[FONTS] ⚠ No fonts found anywhere!")
    return None, "DejaVu Sans"


def _run_fc_cache():
    """Rebuild fontconfig cache if fc-cache is available."""
    try:
        r = subprocess.run(
            ["fc-cache", "-f", FONTS_DIR],
            capture_output=True, text=True, timeout=15,
        )
        if r.returncode == 0:
            print("[FONTS] fc-cache OK")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass  # Not critical — fontsdir handles font lookup


def init_fonts():
    """
    Initialize font system. Called once at module import.
    Returns (font_name_for_ass, absolute_font_path_or_none).
    """
    if not _is_linux():
        return "Arial Black", None

    print("[FONTS] ═══════════════════════════════════════")
    print("[FONTS] Initializing for Linux/Railway...")

    # Step 1: Set up fontconfig env vars (critical — must be first)
    _setup_fontconfig()

    # Step 2: Find best available font
    font_path, ass_name = _find_best_font()

    if font_path:
        # Step 3: Rebuild font cache pointing to our fonts dir
        _run_fc_cache()

        print(f"[FONTS] ASS font name: {ass_name}")
        print(f"[FONTS] Font file:     {font_path}")
        print(f"[FONTS] Fonts dir:     {FONTS_DIR}")
        print("[FONTS] ═══════════════════════════════════════")
        return ass_name, font_path

    print("[FONTS] ═══════════════════════════════════════")
    return "DejaVu Sans", None


# ─── Module-level init (runs once on import) ──────────────────────
FONT_NAME, FONT_PATH = init_fonts()
