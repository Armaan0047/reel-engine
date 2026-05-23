# 🎬 Reel Engine — Complete Local Setup & Testing Playbook

This playbook provides the official, step-by-step instructions to configure, run, and verify the entire **Reel Engine** multi-style cinematic video synthesis system on a local development machine.

---

## 📂 System Architecture & Directory Topology

Before launching the system, confirm that the root repository contains the following structural components:

```
AI-Reel-Agent/ (Root)
├── api_server.py         # FastAPI Gateway Bridge (Port 8000)
├── main.py               # Core python orchestration pipeline CLI
├── config.py             # Topic profiles, script assets, paths config
├── voice_generator.py    # Vocal synthesizers (ElevenLabs ↔ edge-tts fallback)
├── video_renderer.py     # FFmpeg render pipeline, ASS subtitles, overlays
├── requirements.txt      # Core Python packages
├── fonts/                # Custom .ttf typography (e.g. Outfit, Montserrat)
├── music/                # Background atmospheric audio files (.mp3)
├── videos/               # Gameplay loop and visual scene video loops (.mp4)
├── voices/               # Stored audio outputs
├── reels/                # Rendered production-grade final outputs
├── temp/                 # Temporary compilation segments
└── web/                  # Next.js 16 Workspace Dashboard frontend
    ├── package.json
    └── src/
```

---

## ⚙️ Phase 1: Environment & Dependency Setup

### 1. Python Environment Setup
Launch a terminal in the root `AI-Reel-Agent/` folder and initialize a virtual environment:

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install core dependencies
pip install -r requirements.txt
```

### 2. Custom Cinematic Media Assets Setup
To render cinematic short-form reels, you must supply baseline media assets:
*   **Background Videos**: Store `.mp4` background files in the `/videos` directory.
    *   *Gaming mode background files*: Place Minecraft/GTA gameplay video clips here.
    *   *Luxury mode background files*: Place desaturated cityscapes/automotive assets here.
*   **Custom Fonts**: Ensure custom `.ttf` subtitles fonts (like Outfit or Montserrat) exist in the `/fonts` directory.
*   **Atmospheric Music**: Store audio overlays in `/music` (e.g. atmospheric ambient tracks).

### 3. Environment Variables Setup (Optional Premium Integration)
Create an `.env` file in the root directory to activate premium narration:

```env
# ElevenLabs API Key (Leave blank to use Microsoft edge-tts fallback seamlessly)
ELEVENLABS_API_KEY=your_elevenlabs_api_token
```

---

## 🚀 Phase 2: Orchestration Startup Sequence

Running the complete creative workspace requires **two active terminal consoles**:

```
 ┌────────────────────────────────────────────────────────┐
 │                   Orchestration Order                  │
 ├────────────────────────────────────────────────────────┤
 │                                                        │
 │  Terminal 1: Python API Server [FastAPI on Port 8000]   │
 │        python api_server.py                            │
 │                                                        │
 │                          ▼                             │
 │                                                        │
 │  Terminal 2: Next.js Studio Console [Port 3000/3001]   │
 │        cd web && npm run dev                           │
 │                                                        │
 └────────────────────────────────────────────────────────┘
```

### [CONSOLE 1] Launch the Backend Gateway
Navigate to the root directory, activate `venv`, and start the FastAPI uvicorn listener:

```powershell
# In root AI-Reel-Agent/
.\venv\Scripts\Activate.ps1
python api_server.py
```
*   **Active Port**: `http://localhost:8000`
*   **Expected Output Log**:
    ```text
    INFO:     Started server process [12876]
    INFO:     Waiting for application startup.
    INFO:     Application startup complete.
    INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
    ```

### [CONSOLE 2] Launch the Next.js Studio Frontend
Navigate to the `/web` subdirectory and start the Next.js Turbopack development client:

```powershell
# Navigate to frontend and start client
cd web
npm run dev
```
*   **Active Port**: `http://localhost:3000` (or `http://localhost:3001` if Port 3000 is occupied)
*   **Expected Output Log**:
    ```text
    ▲ Next.js 16.2.6 (Turbopack)
    - Local:         http://localhost:3001
    - Network:       http://10.164.21.207:3001
    ✓ Ready in 494ms
    ```

---

## 🔍 Phase 3: Verification & Diagnostics Checkpoints

### Checkpoint A: FFmpeg Verification
Reel Engine automates subtitles rendering, audio mixing, and desaturated visual overlays using FFmpeg. Ensure Python reads FFmpeg by testing a direct CLI generation run:

```powershell
# Generate a test reel directly from CLI inside Root directory
python main.py --count 1 --topic motivation
```
*   **Pass Condition**: Script runs successfully, mixes the audio overlay, processes subtitles, outputs an MP4 file to `/reels`, and logs a complete execution banner.
*   **Fail Condition**: Throws a `FileNotFoundError` for `ffmpeg` or `ffprobe`. (See Troubleshooting below).

### Checkpoint B: FastAPI Server Verification
Open your browser and navigate to `http://localhost:8000/api/health` to confirm the backend bridge is responsive:

*   **Expected JSON Response**:
    ```json
    {
      "status": "ok",
      "version": "4.0",
      "engine": "AI Reel Agent",
      "reels_dir": "...\\reels"
    }
    ```

### Checkpoint C: Connected Live Polling Verification
Launch the Studio console at `http://localhost:3001/studio`:
*   **Acknowledge offline errors**: If the backend is running properly on Port 8000, the offline header banner at the top of the Studio console will disappear automatically.
*   **Polling Logs check**: Open Browser Developer Tools (`F12` ➜ Network tab). You should see live polling request cycles fetching `GET http://localhost:8000/api/reels` and `GET http://localhost:8000/api/jobs` at intervals.

---

## 🧪 Phase 4: Testing Real Reel Generation End-to-End

Once both terminals are live and verify successfully, execute a complete production reel generation:

1.  **Initialize Parameters**:
    *   Navigate to **Initialize** tab in the Studio console.
    *   **Step 1**: Choose a Category Pipeline (e.g. *Money & Finance* or *Luxury*) and set target yield to `1 Reel`. Click *Continue to Profile*.
    *   **Step 2**: Select a Visual Mode (e.g., *Cinematic Mode* for desaturated filters, or *Minimalist Mode* for text traces). Click *Next Step*.
    *   **Step 3**: Review the dynamic deployment ticket parameters and click **Trigger Pipeline**.
2.  **Monitor the Render Flow**:
    *   The console automatically transitions to Step 3, triggering the background render job.
    *   The **Active Operations** column logs the initialization steps (`Generating...` ➜ progress bar advancement).
    *   The python console (`Terminal 1`) starts processing: generating AI voiceover narration, locating raw gameplay video segments, calculating subtitle timestamps, mixing audio tracks, and compiling the video composition.
3.  **Review the Completed Output**:
    *   Upon completion, the active item transitions to the **Reel Repository** logs list.
    *   Click on the newly minted reel row in the repository list to launch the **Workstation Player**.
    *   **Play/Pause Verification**: Tap `Play` or drag the timeline slider to view the overlay and hear the narration.
    *   **Export Verification**: Tap the **Export MP4** button to download the synthesized clip directly to your local downloads folder.

---

## 🛠️ Phase 5: Troubleshooting & Dependency Fixes

### 1. Port Conflicts (FastAPI Port 8000 or Next.js Port 3000 in use)
*   **Next.js automatic fallback**: Next.js automatically switches to Port `3001` or `3002` if `3000` is active. Check the Terminal output for the active URL.
*   **Terminating active port processes on Windows**:
    ```powershell
    # Find process ID (PID) occupying Port 8000
    netstat -ano | findstr :8000
    
    # Force stop the blocking task (Replace PID_NUMBER with netstat outcome ID)
    taskkill /PID PID_NUMBER /F
    ```

### 2. Missing FFmpeg / Broken Executables
*   **Resolution**: Reel Engine uses the `imageio-ffmpeg` package to locate local executables automatically. If your operating system fails to read it:
    1.  Download official binary release packages from [ffmpeg.org](https://ffmpeg.org).
    2.  Extract the archive and locate the `/bin` directory.
    3.  Add the absolute path to your User environment variable `PATH`.
    4.  Restart your consoles.

### 3. Voice Generation Falls Back or Fails
*   **Reason**: You are calling ElevenLabs vox engines without an active API token.
*   **Fix**: The engine automatically catches ElevenLabs API authentication errors and falls back to Microsoft's `edge-tts` API dynamically, preventing pipeline failures.

### 4. Background Videos Missing
*   **Reason**: Rendering pipelines require raw mp4 sequences in `/videos` to cut clips.
*   **Fix**: Place at least one baseline background `.mp4` video in the `/videos` directory.
