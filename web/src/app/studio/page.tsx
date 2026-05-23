"use client";

import { useState, useEffect } from "react";
import StudioSidebar from "@/components/studio/StudioSidebar";
import StudioTopbar from "@/components/studio/StudioTopbar";
import GeneratePanel from "@/components/studio/GeneratePanel";
import ReelPreview from "@/components/studio/ReelPreview";
import ReelHistory from "@/components/studio/ReelHistory";
import { AnimatePresence, motion } from "framer-motion";

export type ReelJob = {
  id: string;
  topic: string;
  status: "queued" | "generating" | "rendering" | "done" | "error";
  progress: number;
  name: string;
  timestamp: number;
  style: string;
  duration?: number;
  sizeMB?: number;
  videoUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
};

export type StudioView = "generate" | "history";

export default function StudioPage() {
  const [view, setView] = useState<StudioView>("generate");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reels, setReels] = useState<ReelJob[]>([]);
  const [selectedReel, setSelectedReel] = useState<ReelJob | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // 1. Initial Load of Completed Reels from local disk via API
  useEffect(() => {
    async function loadReels() {
      try {
        const res = await fetch("http://localhost:8000/api/reels");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.reels)) {
            const loaded: ReelJob[] = data.reels.map((r: any) => ({
              id: r.id || r.name.replace(".mp4", ""),
              topic: r.topic || "motivation",
              status: "done" as const,
              progress: 100,
              name: r.name,
              timestamp: r.created * 1000,
              style: "auto",
              duration: r.duration || 15,
              sizeMB: r.sizeMB,
              videoUrl: r.videoUrl,
              downloadUrl: r.downloadUrl,
              thumbnailUrl: r.thumbnailUrl,
            }));
            setReels((prev) => {
              // De-duplicate loaded items against existing polling items
              const existingIds = new Set(prev.map((p) => p.id));
              const filteredLoaded = loaded.filter((l) => !existingIds.has(l.id));
              return [...prev, ...filteredLoaded].sort((a, b) => b.timestamp - a.timestamp);
            });
            setApiError(null);
          }
        }
      } catch (err) {
        console.error("Backend offline. Make sure api_server.py is running on port 8000", err);
        setApiError("Backend Engine Offline // Launch api_server.py on Port 8000");
      }
    }
    loadReels();
  }, []);

  // 2. Real-time Polling for Active Renders
  useEffect(() => {
    const activeJobs = reels.filter(
      (r) => r.status === "queued" || r.status === "generating" || r.status === "rendering"
    );

    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/jobs");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.jobs)) {
            const jobMap = new Map<string, any>();
            data.jobs.forEach((j: any) => jobMap.set(j.id, j));

            setReels((prev) =>
              prev.map((reel) => {
                const updated = jobMap.get(reel.id);
                if (updated) {
                  const updatedStatus = updated.status as ReelJob["status"];
                  
                  // If status transition just completed, auto-select it if nothing else is playing
                  if (reel.status !== "done" && updatedStatus === "done") {
                    const completeReel: ReelJob = {
                      ...reel,
                      status: "done",
                      progress: 100,
                      sizeMB: updated.size_mb || 4.2,
                      duration: updated.duration || 18,
                      videoUrl: updated.videoUrl,
                      downloadUrl: updated.downloadUrl,
                      thumbnailUrl: updated.thumbnailUrl,
                    };
                    setSelectedReel(completeReel);
                    return completeReel;
                  }

                  return {
                    ...reel,
                    status: updatedStatus,
                    progress: updated.progress ?? reel.progress,
                    sizeMB: updated.size_mb ?? reel.sizeMB,
                    duration: updated.duration ?? reel.duration,
                    videoUrl: updated.videoUrl ?? reel.videoUrl,
                    downloadUrl: updated.downloadUrl ?? reel.downloadUrl,
                    thumbnailUrl: updated.thumbnailUrl ?? reel.thumbnailUrl,
                  };
                }
                return reel;
              })
            );
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [reels]);

  // 3. Real Pipeline Trigger
  const handleGenerate = async (config: {
    topic: string;
    count: number;
    style: string;
  }) => {
    try {
      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: config.topic,
          count: config.count,
          style: config.style,
          voice_engine: "auto",
          resolution: "1080x1920",
          max_duration: 30,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.jobs)) {
          const newJobs: ReelJob[] = data.jobs.map((j: any) => ({
            id: j.id,
            topic: j.topic,
            status: j.status as ReelJob["status"],
            progress: j.progress,
            name: j.name,
            timestamp: j.timestamp * 1000,
            style: j.style,
            duration: undefined,
            sizeMB: undefined,
          }));
          setReels((prev) => [...newJobs, ...prev]);
          setApiError(null);
        }
      } else {
        setApiError("Render Server Comm Error // Pipeline Initialization Denied");
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setApiError("Backend Engine Disconnected // Render Pipeline Offline");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0 relative">
      {/* Tactical layout guides (fine border lines) */}
      <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none z-0" />

      {/* Sidebar */}
      <StudioSidebar
        open={sidebarOpen}
        view={view}
        onViewChange={setView}
        reelCount={reels.length}
        activeCount={reels.filter((r) => r.status !== "done" && r.status !== "error").length}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        <StudioTopbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Backend offline telemetry alert */}
        {apiError && (
          <div className="bg-accent-primary/10 border-b border-accent-primary/20 px-6 py-2.5 flex items-center justify-between text-[10px] font-mono text-accent-primary uppercase tracking-widest z-20">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
              <span>{apiError}</span>
            </div>
            <button 
              onClick={() => setApiError(null)} 
              className="hover:text-text-primary transition-colors cursor-pointer text-[9px] uppercase tracking-wider font-semibold font-mono"
            >
              Acknowledge
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex">
          <AnimatePresence mode="wait">
            {view === "generate" ? (
              <motion.div
                key="generate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex overflow-hidden"
              >
                {/* Left: Generate controls */}
                <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 overflow-y-auto border-r border-border-default p-6 bg-surface-0">
                  <GeneratePanel onGenerate={handleGenerate} />
                </div>

                {/* Right: Preview + active jobs */}
                <div className="hidden lg:flex flex-1 flex-col overflow-y-auto p-6 bg-surface-0">
                  <ReelPreview
                    reels={reels}
                    selectedReel={selectedReel}
                    onSelectReel={setSelectedReel}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-y-auto p-6 bg-surface-0"
              >
                <ReelHistory reels={reels} onSelect={(reel) => {
                  setSelectedReel(reel);
                  setView("generate");
                }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
