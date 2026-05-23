"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReelJob } from "@/app/studio/page";

const statusLabels: Record<string, string> = {
  queued: "Queued",
  generating: "Vocal Synthesis",
  rendering: "Rendering Pipeline",
  done: "Complete",
  error: "Failed",
};

interface ReelPreviewProps {
  reels: ReelJob[];
  selectedReel: ReelJob | null;
  onSelectReel: (reel: ReelJob | null) => void;
}

export default function ReelPreview({ reels, selectedReel, onSelectReel }: ReelPreviewProps) {
  const activeReels = reels.filter((r) => r.status !== "done" && r.status !== "error");
  const completedReels = reels.filter((r) => r.status === "done");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const DISPLAY_HOST = API_URL.replace("https://", "").replace("http://", "");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error("Playback block:", err));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleVideoEnded = () => setIsPlaying(false);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("ended", handleVideoEnded);
    setIsPlaying(false);
    video.load();
    video.play().then(() => setIsPlaying(true)).catch(() => {});
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, [selectedReel?.videoUrl]);

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60).toString().padStart(2, "0");
    const s = Math.floor(time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const successRate = reels.length > 0 ? Math.round((completedReels.length / reels.length) * 100) : 0;

  // Pipeline step status derivation
  const pipelineSteps = selectedReel ? [
    { name: "Script Generation", status: "done" as const },
    { name: "Voice Generation", status: selectedReel.status === "queued" ? "pending" as const : "done" as const },
    { name: "Video Processing", status: ["queued", "generating"].includes(selectedReel.status) ? "pending" as const : "done" as const },
    { name: "Cinematic Rendering", status: selectedReel.status === "done" ? "done" as const : selectedReel.status === "error" ? "error" as const : ["rendering"].includes(selectedReel.status) ? "active" as const : "pending" as const },
    { name: "Finalizing Reel", status: selectedReel.status === "done" ? "done" as const : selectedReel.status === "error" ? "error" as const : "pending" as const },
  ] : [];

  return (
    <div className="flex flex-col h-full select-none">
      {/* ═══ TOP SECTION: Preview + Monitor ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ─── MIDDLE: Cinematic Preview ─── */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto border-r border-border-default">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="section-label">Cinematic Preview</span>
              <span className={`pill ${activeReels.length > 0 ? "pill-amber" : "pill-green"}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${activeReels.length > 0 ? "bg-accent-primary" : "bg-green"}`} />
                {activeReels.length > 0 ? "Rendering" : "Live"}
              </span>
            </div>
          </div>

          {/* Video Frame */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-[280px] aspect-[9/16] bg-surface-0 border border-border-default rounded-lg relative overflow-hidden group">
              {/* HUD corners */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-accent-primary/30 pointer-events-none z-10" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-accent-primary/30 pointer-events-none z-10" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-accent-primary/30 pointer-events-none z-10" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-accent-primary/30 pointer-events-none z-10" />

              {selectedReel?.status === "done" && selectedReel.videoUrl ? (
                <>
                  <video ref={videoRef} src={selectedReel.videoUrl} className="w-full h-full object-cover" playsInline muted={isMuted} controls={false} />
                  <div onClick={togglePlay} className="absolute inset-0 bg-surface-0/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer z-20">
                    <div className="w-12 h-12 rounded-full bg-surface-0/80 backdrop-blur-sm border border-accent-primary/50 flex items-center justify-center text-accent-primary">
                      {isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"/></svg>
                      )}
                    </div>
                  </div>
                  {/* Floating stats */}
                  <div className="absolute right-3 bottom-16 flex flex-col items-center gap-3 z-10">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-surface-0/60 backdrop-blur-sm flex items-center justify-center text-text-primary">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </div>
                      <span className="text-[9px] font-mono text-text-primary mt-1">12.4K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-surface-0/60 backdrop-blur-sm flex items-center justify-center text-text-primary">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </div>
                      <span className="text-[9px] font-mono text-text-primary mt-1">1.2K</span>
                    </div>
                  </div>
                </>
              ) : selectedReel?.status === "error" ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full border border-red/20 bg-red/5 flex items-center justify-center text-red mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-red">Pipeline Failed</span>
                  <span className="text-[10px] font-mono text-text-tertiary mt-1 uppercase">All Tiers Exhausted</span>
                </div>
              ) : selectedReel ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 relative flex items-center justify-center mb-4">
                    <div className="absolute inset-0 border-2 border-dashed border-accent-primary/30 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
                    <span className="text-[10px] font-mono font-bold text-accent-primary">{selectedReel.progress}%</span>
                  </div>
                  <span className="text-[11px] font-semibold text-accent-primary animate-pulse">{statusLabels[selectedReel.status]}</span>
                  <div className="mt-3 space-y-1 text-center">
                    <div className="text-[9px] font-mono text-text-tertiary uppercase">Stream: Live Render</div>
                    <div className="text-[9px] font-mono text-text-tertiary uppercase">FPS: 30 // CRF: 18</div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full border border-border-default bg-surface-2 flex items-center justify-center text-text-tertiary mb-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-text-tertiary">No Preview</span>
                  <span className="text-[10px] text-text-muted mt-1">Generate a reel to preview</span>
                </div>
              )}
            </div>

            {/* Player Controls */}
            {selectedReel?.status === "done" && (
              <div className="w-full max-w-[280px] mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 border border-border-default hover:border-accent-primary/40 text-text-primary transition-all cursor-pointer">
                    {isPlaying ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"/></svg>
                    )}
                  </button>
                  <input type="range" min="0" max={duration || 0} step="0.05" value={currentTime} onChange={handleTimeChange} className="flex-1" />
                  <span className="text-[9px] font-mono text-text-tertiary tabular-nums w-16 text-right">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  <button onClick={toggleMute} className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                    {isMuted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    )}
                  </button>
                </div>
                {/* Spec pills */}
                <div className="flex items-center justify-between gap-1.5">
                  {["9:16", "1080×1920", "60 FPS", "H.264"].map((spec) => (
                    <div key={spec} className="flex-1 text-center py-1.5 bg-surface-0 border border-border-subtle rounded text-[8px] font-mono text-text-tertiary uppercase tracking-wider">
                      {spec}
                    </div>
                  ))}
                </div>
                {/* Download */}
                <a
                  href={selectedReel.downloadUrl || selectedReel.videoUrl}
                  download
                  className="w-full flex items-center justify-center gap-2 py-2 bg-accent-primary/10 border border-accent-primary/20 rounded-md text-[11px] font-semibold text-accent-primary hover:bg-accent-primary/15 transition-colors cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Export MP4
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Render Monitor ─── */}
        <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex-col overflow-y-auto p-5 hidden lg:flex">
          <AnimatePresence mode="wait">
            {selectedReel ? (
              <motion.div key={selectedReel.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Monitor Header */}
                <div className="flex items-center justify-between">
                  <span className="section-label">Render Monitor // Reel {selectedReel.id?.slice(0, 8)}</span>
                  <button onClick={() => onSelectReel(null)} className="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors cursor-pointer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {/* Operation Info + Status */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider">[Active Operation]</span>
                    <h3 className="text-sm font-semibold text-text-primary mt-0.5 truncate">{selectedReel.name}</h3>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-tertiary">Pipeline Routing</span>
                        <span className="font-mono font-semibold text-text-primary">{selectedReel.topic}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-[100px] flex-shrink-0 rounded-md p-3 flex flex-col items-center justify-center text-center ${
                    selectedReel.status === "done" ? "bg-green/5 border border-green/20" :
                    selectedReel.status === "error" ? "bg-red/5 border border-red/20" :
                    "bg-accent-primary/5 border border-accent-primary/20"
                  }`}>
                    <span className="text-[9px] font-mono text-text-tertiary uppercase">Status</span>
                    <span className={`text-sm font-bold uppercase mt-0.5 ${
                      selectedReel.status === "done" ? "text-green" :
                      selectedReel.status === "error" ? "text-red" : "text-accent-primary"
                    }`}>
                      {selectedReel.status === "done" ? "Done" : selectedReel.status === "error" ? "Failed" : "Active"}
                    </span>
                    {selectedReel.status === "error" && <span className="text-[9px] text-red mt-0.5">⚠ All Tiers</span>}
                  </div>
                </div>

                {/* File Metric */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="section-label">File Metric</span>
                    <span className="text-[10px] font-mono text-text-secondary">{selectedReel.sizeMB ? `${selectedReel.sizeMB} MB` : "Measuring..."}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${selectedReel.progress}%` }} /></div>
                  <span className="text-[9px] font-mono text-accent-primary mt-1 block text-right">{selectedReel.progress}%</span>
                </div>

                {/* Engine Telemetry */}
                <div>
                  <span className="section-label block mb-2">Engine Telemetry</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "CPU Usage", value: "36%", bars: [40, 65, 50, 80, 55, 70] },
                      { label: "RAM Usage", value: "2.1GB / 7.8GB", bars: [60, 45, 70, 55, 80, 65] },
                      { label: "Temp", value: "62°C", bars: [30, 50, 45, 60, 40, 55] },
                    ].map((t) => (
                      <div key={t.label} className="stat-card">
                        <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-wider block">{t.label}</span>
                        <span className="text-xs font-semibold text-text-primary block mt-1">{t.value}</span>
                        <div className="mini-chart mt-2">
                          {t.bars.map((h, i) => (
                            <div key={i} className="mini-chart-bar" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pipeline Steps */}
                <div>
                  <span className="section-label block mb-2">Pipeline Steps</span>
                  <div className="space-y-1">
                    {pipelineSteps.map((step, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            step.status === "done" ? "bg-green" :
                            step.status === "error" ? "bg-red" :
                            step.status === "active" ? "bg-accent-primary animate-pulse" : "bg-surface-4"
                          }`} />
                          <span className="text-text-secondary">{step.name}</span>
                        </div>
                        <span className={`font-mono text-[9px] font-semibold ${
                          step.status === "done" ? "text-green" :
                          step.status === "error" ? "text-red" :
                          step.status === "active" ? "text-accent-primary" : "text-text-muted"
                        }`}>
                          {step.status === "done" ? "Completed ✓" :
                           step.status === "error" ? "Failed ⚠" :
                           step.status === "active" ? "Active..." : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Console Logs */}
                <div>
                  <span className="section-label block mb-2">Console Logs</span>
                  <div className="console-log text-[9px]">
                    <div><span className="log-sys">[SYS]</span> Pipeline Started</div>
                    <div><span className="log-sys">[SYS]</span> Content Pipeline: {selectedReel.topic}</div>
                    <div><span className="log-sys">[SYS]</span> Batch Quantity: 1 Reel</div>
                    <div><span className="log-time">[00:28:31]</span> <span className="log-ok">Script Generation... OK</span></div>
                    <div><span className="log-time">[00:28:41]</span> <span className="log-ok">Voice Generation... OK</span></div>
                    <div><span className="log-time">[00:29:17]</span> <span className="log-ok">Video Processing... OK</span></div>
                    {selectedReel.status === "done" && (
                      <>
                        <div><span className="log-time">[00:30:33]</span> <span className="log-ok">Rendering Tier 1/3... OK</span></div>
                        <div><span className="log-time">[00:31:02]</span> <span className="log-ok">Reel finalized successfully</span></div>
                      </>
                    )}
                    {selectedReel.status === "error" && (
                      <>
                        <div><span className="log-time">[00:30:33]</span> <span className="log-warn">Rendering Tier 1/3...</span></div>
                        <div><span className="log-err">Error: Fontconfig error. Cannot load default config file</span></div>
                        <div><span className="log-time">[00:31:03]</span> <span className="log-warn">Rendering Tier 2/3...</span></div>
                        <div><span className="log-err">Error: subtitle render failed</span></div>
                        <div><span className="log-time">[00:31:33]</span> <span className="log-warn">Rendering Tier 3/3...</span></div>
                        <div><span className="log-err">Still failed</span></div>
                        <div><span className="log-time">[00:32:03]</span> <span className="log-err">✗ ALL TIERS FAILED!</span></div>
                      </>
                    )}
                    {selectedReel.status !== "done" && selectedReel.status !== "error" && (
                      <div><span className="log-time">[00:30:33]</span> <span className="log-warn">Rendering in progress...</span></div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="section-label">Render Monitor</span>
                  <span className="text-[9px] font-mono text-text-muted uppercase tracking-wider">Idle</span>
                </div>
                <div className="panel-inset p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border border-border-default bg-surface-2 flex items-center justify-center text-text-tertiary mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="12" x="2" y="3" rx="2"/><path d="M12 17v4M8 21h8"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">Ready for Generation</span>
                  <p className="text-[11px] text-text-tertiary mt-1 max-w-[200px] leading-relaxed">Trigger a pipeline to see live render telemetry here.</p>
                </div>

                <div>
                  <span className="section-label block mb-2">Render Architecture</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: "✍️", name: "Script", sub: "Automated" },
                      { icon: "🎙️", name: "Voice", sub: "ElevenLabs" },
                      { icon: "🎬", name: "FFmpeg", sub: "Faststart" },
                      { icon: "🚀", name: "Publish", sub: "Ready" },
                    ].map((s) => (
                      <div key={s.name} className="panel-inset p-3 text-center">
                        <span className="text-lg block mb-1">{s.icon}</span>
                        <span className="text-[10px] font-semibold text-text-secondary block">{s.name}</span>
                        <span className="text-[8px] font-mono text-text-muted uppercase tracking-wider block mt-0.5">{s.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[9px] font-mono text-text-tertiary block">Active Host</span>
                    <span className="text-[10px] font-semibold text-text-secondary mt-0.5 block truncate">{DISPLAY_HOST}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-text-tertiary block">Voice Engine</span>
                    <span className="text-[10px] font-semibold text-accent-primary mt-0.5 block">Active</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ BOTTOM SECTION: 3 Panels ═══ */}
      <div className="h-[220px] flex-shrink-0 border-t border-border-default flex">

        {/* Panel 1: Active Jobs */}
        <div className="flex-1 border-r border-border-default p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="section-label">Active Jobs</span>
              {activeReels.length > 0 && <span className="badge text-accent-primary bg-accent-primary/10 border-accent-primary/20">{activeReels.length}</span>}
            </div>
          </div>

          {activeReels.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-2 text-[8px] font-mono text-text-muted uppercase tracking-wider pb-1 border-b border-border-subtle">
                <span>Job ID</span><span>Topic</span><span>Status</span><span>Progress</span><span>ETA</span>
              </div>
              {activeReels.map((reel) => (
                <div key={reel.id} onClick={() => onSelectReel(reel)} className="grid grid-cols-5 gap-2 items-center py-1.5 text-[10px] cursor-pointer hover:bg-surface-2/50 rounded px-1 transition-colors">
                  <span className="font-mono text-text-secondary truncate">{reel.id.slice(0, 8)}</span>
                  <span className="text-text-secondary truncate">{reel.topic}</span>
                  <span className={`pill text-[8px] py-0 px-1.5 ${reel.status === "error" ? "pill-red" : "pill-amber"}`}>
                    <span className={`w-1 h-1 rounded-full ${reel.status === "error" ? "bg-red" : "bg-accent-primary"}`} />
                    {statusLabels[reel.status]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 progress-bar h-1"><div className="progress-bar-fill h-1" style={{ width: `${reel.progress}%` }} /></div>
                    <span className="text-[9px] font-mono text-text-tertiary">{reel.progress}%</span>
                  </div>
                  <span className="font-mono text-text-tertiary">{reel.status === "rendering" ? "00:01:24" : "--:--"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[10px] text-text-muted font-mono">No active jobs</span>
            </div>
          )}

          <button className="mt-2 text-[10px] font-mono text-accent-primary/70 hover:text-accent-primary transition-colors cursor-pointer text-left">
            View All Jobs →
          </button>
        </div>

        {/* Panel 2: System Activity */}
        <div className="flex-1 border-r border-border-default p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">System Activity</span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-3 w-full">
              {[
                { label: "Reels Generated", value: completedReels.length, sub: `+${Math.min(completedReels.length, 12)} Today`, color: "text-text-primary" },
                { label: "Success Rate", value: `${successRate}%`, sub: `+${Math.max(0, successRate - 60)}%`, color: "text-accent-primary" },
                { label: "Total Renders", value: reels.length, sub: `+${reels.length} Total`, color: "text-text-primary" },
                { label: "GPU Renders", value: completedReels.length, sub: `△ ${successRate > 0 ? "26" : "0"}%`, color: "text-text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`stat-number text-xl ${stat.color}`}>{stat.value}</div>
                  <div className="text-[8px] font-mono text-text-muted uppercase tracking-wider mt-0.5">{stat.label}</div>
                  <div className="text-[9px] font-mono text-green mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Recent Reels */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label">Recent Reels</span>
            <button className="text-[9px] font-mono text-accent-primary/70 hover:text-accent-primary transition-colors cursor-pointer">
              View All →
            </button>
          </div>

          {completedReels.length > 0 ? (
            <div className="flex-1 flex gap-2.5 overflow-x-auto pb-1">
              {completedReels.slice(0, 5).map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => onSelectReel(reel)}
                  className="w-[120px] flex-shrink-0 aspect-[9/16] bg-surface-2 rounded-md overflow-hidden relative cursor-pointer group border border-border-default hover:border-accent-primary/40 transition-all"
                >
                  {reel.videoUrl && (
                    <video src={reel.videoUrl + "#t=0.1"} className="w-full h-full object-cover pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity" preload="metadata" playsInline muted />
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/20 to-transparent" />
                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
                    <div className="text-[9px] font-semibold text-text-primary uppercase tracking-wide leading-tight line-clamp-2">{reel.name}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[8px] font-mono text-text-tertiary">
                      <span>{timeAgo(reel.timestamp)}</span>
                      <span>·</span>
                      <span>⊙ {reel.sizeMB ? `${(reel.sizeMB * 1000).toFixed(0)}` : "—"}</span>
                    </div>
                  </div>
                  {/* Duration badge */}
                  {reel.duration && (
                    <div className="absolute top-2 right-2 bg-surface-0/80 backdrop-blur-sm text-[8px] font-mono text-text-primary px-1.5 py-0.5 rounded z-10">
                      {reel.duration > 60 ? `${Math.floor(reel.duration / 60)}:${(reel.duration % 60).toString().padStart(2, "0")}` : `0:${reel.duration.toString().padStart(2, "0")}`}
                    </div>
                  )}
                  {/* Hover play icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="w-8 h-8 rounded-full bg-surface-0/70 backdrop-blur-sm border border-accent-primary/40 flex items-center justify-center text-accent-primary">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"/></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[10px] text-text-muted font-mono">No completed reels</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
