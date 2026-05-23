"""
Font configuration for headless Linux (Railway/Docker).
Ensures fontconfig is properly initialized and a usable font is available
for FFmpeg's ASS subtitle filter.

This module MUST be imported before any FFmpeg subprocess calls.
"""
import os
import subprocess

# ─── Detect project paths ────────────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(PROJECT_ROOT, "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)


def _is_linux():
    return os.name == "posix"


def _find_system_font():
    """Find a usable bold sans-serif font on the system."""
    search_paths = [
        "/usr/share/fonts",
        "/usr/local/share/fonts",
        os.path.join(PROJECT_ROOT, "fonts"),
    ]

    preferred = [
        "DejaVuSans-Bold.ttf",
        "DejaVuSans.ttf",
        "LiberationSans-Bold.ttf",
        "LiberationSans-Regular.ttf",
        "FreeSansBold.ttf",
        "NotoSans-Bold.ttf",
        "NotoSans-Regular.ttf",
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
    Sets env vars so FFmpeg subprocess inherits them.
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

    # Set env vars — these are inherited by subprocess (FFmpeg)
    os.environ["FONTCONFIG_FILE"] = conf_path
    os.environ["FONTCONFIG_PATH"] = conf_dir
    os.environ["FC_CONFIG_DIR"] = conf_dir

    # Ensure cache dir exists
    try:
        os.makedirs("/tmp/fontconfig-cache", exist_ok=True)
    except OSError:
        pass

    print(f"[FONTS] fontconfig → {conf_path}")
    print(f"[FONTS] FONTCONFIG_FILE = {conf_path}")
    return conf_path


def _run_fc_cache():
    """Run fc-cache to rebuild font index."""
    try:
        r = subprocess.run(
            ["fc-cache", "-fv"],
            capture_output=True, text=True, timeout=30,
        )
        if r.returncode == 0:
            print("[FONTS] fc-cache completed OK")
        else:
            print(f"[FONTS] fc-cache returned {r.returncode}")
    except FileNotFoundError:
        print("[FONTS] fc-cache not found — fontconfig may not be installed")
    except subprocess.TimeoutExpired:
        print("[FONTS] fc-cache timed out")


def _copy_font_to_project(font_path):
    """
    Copy the system font into the project fonts/ directory.
    This ensures the font is always findable even if system paths change.
    """
    dest = os.path.join(FONTS_DIR, os.path.basename(font_path))
    if os.path.isfile(dest):
        return dest
    try:
        import shutil
        shutil.copy2(font_path, dest)
        print(f"[FONTS] Copied font to project: {dest}")
        return dest
    except Exception as e:
        print(f"[FONTS] Could not copy font: {e}")
        return font_path


def init_fonts():
    """
    Initialize font system for production.
    Returns (font_name_for_ass, font_path_or_none).

    On Windows/dev: returns ("Arial Black", None)
    On Linux/Railway: sets up fontconfig, finds font, copies to project dir
    """
    if not _is_linux():
        return "Arial Black", None

    print("[FONTS] ═══════════════════════════════════════")
    print("[FONTS] Initializing font system for Linux...")

    font_path = _find_system_font()
    if font_path:
        # Copy to project dir for guaranteed access
        local_path = _copy_font_to_project(font_path)

        font_name = os.path.splitext(os.path.basename(local_path))[0]
        name_map = {
            "DejaVuSans-Bold": "DejaVu Sans",
            "DejaVuSans": "DejaVu Sans",
            "LiberationSans-Bold": "Liberation Sans",
            "LiberationSans-Regular": "Liberation Sans",
            "FreeSansBold": "FreeSans",
            "NotoSans-Bold": "Noto Sans",
            "NotoSans-Regular": "Noto Sans",
        }
        ass_name = name_map.get(font_name, font_name)
        print(f"[FONTS] System font: {font_path}")
        print(f"[FONTS] Local copy:  {local_path}")
        print(f"[FONTS] ASS name:    {ass_name}")

        _create_fontconfig(local_path)
        _run_fc_cache()

        print(f"[FONTS] Font dir:    {os.path.dirname(local_path)}")
        print("[FONTS] ═══════════════════════════════════════")
        return ass_name, local_path
    else:
        print("[FONTS] ⚠️ No system fonts found!")
        print("[FONTS] Subtitle rendering will be SKIPPED")
        print("[FONTS] ═══════════════════════════════════════")
        return "DejaVu Sans", None


# ─── Module-level initialization ──────────────────────────────────
FONT_NAME, FONT_PATH = init_fonts()
