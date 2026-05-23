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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        const res = await fetch(`${API_URL}/api/reels`);
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
              const existingIds = new Set(prev.map((p) => p.id));
              const filteredLoaded = loaded.filter((l) => !existingIds.has(l.id));
              return [...prev, ...filteredLoaded].sort((a, b) => b.timestamp - a.timestamp);
            });
            setApiError(null);
          }
        }
      } catch (err) {
        console.error("Backend offline:", API_URL, err);
        setApiError(`Backend Engine Offline // Cannot reach ${API_URL}`);
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
        const res = await fetch(`${API_URL}/api/jobs`);
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
      const res = await fetch(`${API_URL}/api/generate`, {
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
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Sidebar */}
      <StudioSidebar
        open={sidebarOpen}
        view={view}
        onViewChange={setView}
        reelCount={reels.length}
        activeCount={reels.filter((r) => r.status !== "done" && r.status !== "error").length}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <StudioTopbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Error banner */}
        {apiError && (
          <div className="bg-red/5 border-b border-red/15 px-5 py-2 flex items-center justify-between text-[10px] font-mono text-red uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red rounded-full animate-pulse" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="hover:text-text-primary transition-colors cursor-pointer text-[9px] uppercase tracking-wider font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {view === "generate" ? (
              <motion.div
                key="generate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full flex"
              >
                {/* Left: Workspace params */}
                <div className="w-[320px] xl:w-[360px] flex-shrink-0 overflow-y-auto border-r border-border-default p-5 bg-surface-0">
                  <GeneratePanel onGenerate={handleGenerate} />
                </div>

                {/* Center + Right: Preview + Monitor + Bottom panels */}
                <div className="flex-1 min-w-0 overflow-hidden">
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
                transition={{ duration: 0.15 }}
                className="h-full overflow-y-auto p-6 bg-surface-0"
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
