"""
AI Reel Agent — FastAPI Bridge
Connects the Next.js frontend to the existing Python reel generation engine.

Endpoints:
  POST /api/generate       → Start reel generation job
  GET  /api/jobs            → List all jobs
  GET  /api/jobs/{id}       → Get job status
  GET  /api/reels           → List completed reels
  GET  /api/reels/{name}    → Download/stream a reel
  GET  /api/topics          → List available topics
"""
import asyncio
import os
import sys
import time
import uuid
from typing import Optional

# Ensure project root is on path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import (
    REELS_DIR, TOPIC_KEYWORDS, LUXURY_TOPICS,
    VOICE_PROFILES, VIRAL_SCRIPTS,
)

app = FastAPI(
    title="REEL ENGINE API",
    version="4.0",
    description="API bridge for the AI Reel Agent cinematic engine",
)

# CORS for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── In-memory job store ──────────────────────────────────────────
jobs: dict[str, dict] = {}


# ─── Models ───────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    topic: str = "motivation"
    count: int = 1
    style: str = "auto"
    voice_engine: str = "auto"
    resolution: str = "1080x1920"
    max_duration: int = 30


class JobStatus(BaseModel):
    id: str
    topic: str
    status: str  # queued | generating | rendering | done | error
    progress: int
    name: str
    timestamp: float
    style: str
    duration: Optional[float] = None
    size_mb: Optional[float] = None
    output_path: Optional[str] = None
    error: Optional[str] = None


# ─── Background worker ───────────────────────────────────────────
async def _run_generation(job_id: str, topic: str):
    """Run the actual reel generation in background."""
    try:
        jobs[job_id]["status"] = "generating"
        jobs[job_id]["progress"] = 15

        from main import generate_one_reel

        jobs[job_id]["progress"] = 30
        jobs[job_id]["status"] = "generating"

        reel_path = await generate_one_reel(force_topic=topic)

        if reel_path and os.path.exists(reel_path):
            filename = os.path.basename(reel_path)
            size_mb = round(os.path.getsize(reel_path) / (1024 * 1024), 1)
            jobs[job_id].update({
                "status": "done",
                "progress": 100,
                "output_path": reel_path,
                "size_mb": size_mb,
                "videoUrl": f"http://localhost:8000/api/reels/{filename}",
                "downloadUrl": f"http://localhost:8000/api/reels/{filename}",
                "thumbnailUrl": f"http://localhost:8000/api/reels/{filename}#t=0.1"
            })
        else:
            jobs[job_id].update({
                "status": "error",
                "progress": 0,
                "error": "Render failed — all tiers exhausted",
            })

    except Exception as e:
        jobs[job_id].update({
            "status": "error",
            "progress": 0,
            "error": str(e),
        })


# ─── Endpoints ────────────────────────────────────────────────────

@app.get("/api/topics")
def list_topics():
    """List all available topic categories with metadata."""
    topics = []
    for topic_id in TOPIC_KEYWORDS:
        profile = VOICE_PROFILES.get(topic_id, VOICE_PROFILES["_default"])
        script_count = sum(1 for s in VIRAL_SCRIPTS if s.get("topic") == topic_id)
        topics.append({
            "id": topic_id,
            "style": "CINEMATIC" if topic_id in LUXURY_TOPICS else "MINECRAFT",
            "voice_style": profile["style"],
            "script_count": script_count,
        })
    return {"topics": topics, "total": len(topics)}


@app.post("/api/generate")
async def generate_reels(req: GenerateRequest, bg: BackgroundTasks):
    """Start reel generation job(s)."""
    created = []
    for i in range(min(req.count, 20)):  # cap at 20
        job_id = str(uuid.uuid4())[:8]
        job = {
            "id": job_id,
            "topic": req.topic,
            "status": "queued",
            "progress": 0,
            "name": f"Reel {job_id}",
            "timestamp": time.time(),
            "style": req.style,
            "duration": None,
            "size_mb": None,
            "output_path": None,
            "error": None,
        }
        jobs[job_id] = job
        bg.add_task(_run_generation, job_id, req.topic)
        created.append(job)
    return {"jobs": created}


@app.get("/api/jobs")
def list_jobs():
    """List all generation jobs."""
    return {"jobs": list(jobs.values())}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str):
    """Get status of a specific job."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]


@app.get("/api/reels")
def list_reels():
    """List all completed reel files."""
    reels = []
    if os.path.isdir(REELS_DIR):
        for f in sorted(os.listdir(REELS_DIR), reverse=True):
            if f.endswith(".mp4"):
                fp = os.path.join(REELS_DIR, f)
                # Infer topic based on filename words if possible
                topic = "motivation"
                for t in LUXURY_TOPICS:
                    if t in f.lower():
                        topic = t
                        break
                reels.append({
                    "id": f.replace(".mp4", ""),
                    "name": f,
                    "topic": topic,
                    "status": "done",
                    "progress": 100,
                    "sizeMB": round(os.path.getsize(fp) / (1024 * 1024), 1),
                    "created": os.path.getctime(fp),
                    "videoUrl": f"http://localhost:8000/api/reels/{f}",
                    "downloadUrl": f"http://localhost:8000/api/reels/{f}",
                    "thumbnailUrl": f"http://localhost:8000/api/reels/{f}#t=0.1",
                })
    return {"reels": reels}


@app.get("/api/reels/{name}")
def download_reel(name: str):
    """Download/stream a reel file with range-request headers."""
    path = os.path.join(REELS_DIR, name)
    if not os.path.isfile(path):
        raise HTTPException(404, "Reel not found")
    return FileResponse(
        path, 
        media_type="video/mp4", 
        filename=name, 
        headers={"Accept-Ranges": "bytes"}
    )


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "4.0",
        "engine": "AI Reel Agent",
        "reels_dir": REELS_DIR,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
