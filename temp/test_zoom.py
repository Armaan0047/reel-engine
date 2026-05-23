"""Quick test of the zoom filter with FFmpeg."""
import os, subprocess
from video_renderer import get_random_file, build_zoom_punch_filter
from voice_generator import generate_ass_subtitles
from config import *

video = get_random_file(VIDEOS_DIR, (".mp4",))
if not video:
    print("No video found")
    exit()

print(f"Video: {os.path.basename(video)}")

# Build a minimal test
test_data = [{"text": "TEST ZOOM", "start": 1.0, "end": 3.0, "highlight": False}]
zoom = build_zoom_punch_filter(test_data, 1, 0.05)
print(f"Zoom filter: {zoom[:200]}")

# Build subs
subs_path = os.path.join(TEMP_DIR, "test_zoom.ass")
generate_ass_subtitles(test_data, subs_path)
subs_escaped = subs_path.replace("\\", "/").replace(":", "\\:")

# Full filter with zoom
filter_str = (
    f"[0:v]scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,"
    f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT},"
    f"fps={OUTPUT_FPS},"
    + zoom + ","
    f"eq=contrast=1.05:saturation=1.1,"
    f"ass='{subs_escaped}',"
    f"vignette=PI/3[vout]"
)

out_path = os.path.join(TEMP_DIR, "test_zoom.mp4")
cmd = [
    FFMPEG_PATH, "-y", "-i", video,
    "-filter_complex", filter_str,
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "ultrafast",
    "-t", "5", "-pix_fmt", "yuv420p",
    "-an",
    out_path,
]

print(f"\nRunning FFmpeg test...")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"FAILED:")
    print(result.stderr[-800:])
    
    # Try without zoom
    print("\nTrying WITHOUT zoom...")
    filter_str2 = (
        f"[0:v]scale={OUTPUT_WIDTH}:{OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={OUTPUT_WIDTH}:{OUTPUT_HEIGHT},"
        f"fps={OUTPUT_FPS},"
        f"eq=contrast=1.05:saturation=1.1,"
        f"ass='{subs_escaped}',"
        f"vignette=PI/3[vout]"
    )
    cmd2 = [
        FFMPEG_PATH, "-y", "-i", video,
        "-filter_complex", filter_str2,
        "-map", "[vout]",
        "-c:v", "libx264", "-preset", "ultrafast",
        "-t", "5", "-pix_fmt", "yuv420p",
        "-an",
        out_path,
    ]
    result2 = subprocess.run(cmd2, capture_output=True, text=True)
    if result2.returncode != 0:
        print(f"ALSO FAILED (ASS issue?):")
        print(result2.stderr[-800:])
    else:
        print("SUCCESS without zoom (ASS works, zoom expression is the issue)")
        print(f"Output: {out_path}")
else:
    print(f"SUCCESS! Output: {out_path}")
    print(f"Size: {os.path.getsize(out_path) / (1024*1024):.1f} MB")
