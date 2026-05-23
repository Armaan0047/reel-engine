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

export default function ReelPreview({
  reels,
  selectedReel,
  onSelectReel,
}: ReelPreviewProps) {
  const activeReels = reels.filter(
    (r) => r.status !== "done" && r.status !== "error"
  );
  const completedReels = reels.filter((r) => r.status === "done");

  // Custom Video Player States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Sync state on play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error("Playback block:", err));
    }
  };

  // Sync state on mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle timeline slider change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Keep progress bar in sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handleVideoEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("ended", handleVideoEnded);

    // Auto-play when video changes
    setIsPlaying(false);
    video.load();
    video.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Autoplay blocked fallback
    });

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, [selectedReel?.videoUrl]);

  // Format time (e.g. 00:12)
  const formatTime = (time: number) => {
    const m = Math.floor(time / 60).toString().padStart(2, "0");
    const s = Math.floor(time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-8 select-none">
      {/* ─── 1. SELECTED RENDER MONITOR CONSOLE ─── */}
      <AnimatePresence mode="wait">
        {selectedReel ? (
          <motion.div
            key={selectedReel.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-surface-1 border border-border-default/40 p-4.5 rounded-lg relative"
          >
            {/* Header Telemetry bar */}
            <div className="flex items-center justify-between border-b border-border-default/20 pb-3 mb-4 text-[10px] text-text-secondary font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
                <span>Render Monitor // {selectedReel.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="opacity-75">ID: {selectedReel.id}</span>
                <button
                  onClick={() => onSelectReel(null)}
                  className="text-text-tertiary hover:text-accent-primary transition-colors cursor-pointer text-[9px] uppercase tracking-wider font-semibold"
                >
                  Disconnect Monitor
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: Rigid Video Display Screen */}
              <div className="w-full md:w-[240px] aspect-[9/16] bg-surface-0 border border-border-strong/40 relative flex items-center justify-center overflow-hidden flex-shrink-0 group rounded-md">
                {/* HUD Corner Margins */}
                <div className="absolute top-2.5 left-2.5 w-2 h-2 border-t border-l border-accent-primary/40 pointer-events-none" />
                <div className="absolute top-2.5 right-2.5 w-2 h-2 border-t border-r border-accent-primary/40 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 w-2 h-2 border-b border-l border-accent-primary/40 pointer-events-none" />
                <div className="absolute bottom-2.5 right-2.5 w-2 h-2 border-b border-r border-accent-primary/40 pointer-events-none" />

                {selectedReel.status === "done" && selectedReel.videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={selectedReel.videoUrl}
                      className="w-full h-full object-cover"
                      playsInline
                      muted={isMuted}
                      controls={false}
                    />
                    {/* Hover playback overlay */}
                    <div 
                      onClick={togglePlay}
                      className="absolute inset-0 bg-surface-0/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer z-10"
                    >
                      <div className="w-10 h-10 rounded-full border border-accent-primary/80 bg-surface-0 flex items-center justify-center text-accent-primary text-[9px] font-mono tracking-widest font-bold shadow-lg">
                        {isPlaying ? "PAUSE" : "PLAY"}
                      </div>
                    </div>
                  </>
                ) : selectedReel.status === "error" ? (
                  <div className="text-center p-4">
                    <div className="w-10 h-10 mx-auto mb-3 border border-red-500/20 bg-red-950/20 flex items-center justify-center text-red-500 rounded-full text-sm">
                      ⚠
                    </div>
                    <div className="text-[10px] font-sans text-red-500 font-bold tracking-wider">
                      Pipeline Failed
                    </div>
                    <div className="text-[9px] font-mono text-text-tertiary uppercase mt-1 opacity-80">
                      {selectedReel.duration ? "RENDER_CRASH" : "ALL TIERS EXHAUSTED"}
                    </div>
                  </div>
                ) : (
                  // Live Rendering Console Loading HUD
                  <div className="text-center p-4">
                    <div className="w-10 h-10 mx-auto mb-4 relative flex items-center justify-center">
                      <div className="absolute inset-0 border border-dashed border-accent-primary/30 animate-spin rounded-full" />
                      <div className="w-6 h-6 border border-accent-primary/60 flex items-center justify-center text-accent-primary font-mono text-[8px] font-bold rounded-full bg-surface-1">
                        {selectedReel.progress}%
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-accent-primary font-bold uppercase tracking-widest animate-pulse">
                      {statusLabels[selectedReel.status]}
                    </div>
                    <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider mt-3 space-y-1 opacity-80">
                      <div>STREAM: LIVE_RENDER</div>
                      <div>FPS: 30 // CRF: 18</div>
                      <div>TIER: TIER_1_EFFECTS</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Workstation Controls & Parameters Metadata */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider">[Active Operation]</span>
                    <h3 className="text-base font-sans font-bold text-text-primary mt-0.5">
                      {selectedReel.name}
                    </h3>
                  </div>

                  {/* Telemetry log grid */}
                  <div className="grid grid-cols-2 gap-3 border-t border-b border-border-default/20 py-3 text-[10px] text-text-secondary font-mono">
                    <div>
                      <span className="text-text-tertiary block text-[9px] font-light">Pipeline Routing</span>
                      <span className="font-bold text-text-primary mt-0.5 block">{selectedReel.topic}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[9px] font-light">Status Telemetry</span>
                      <span className={`font-bold mt-0.5 block ${selectedReel.status === "done" ? "text-accent-primary" : "text-amber-500 animate-pulse"}`}>
                        {statusLabels[selectedReel.status]}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[9px] font-light">File Metric</span>
                      <span className="font-bold text-text-primary mt-0.5 block">
                        {selectedReel.sizeMB ? `${selectedReel.sizeMB} MB` : "MEASURING..."}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[9px] font-light">Duration Limit</span>
                      <span className="font-bold text-text-primary mt-0.5 block">
                        {selectedReel.duration ? `${selectedReel.duration} Seconds` : "ESTIMATING..."}
                      </span>
                    </div>
                  </div>

                  <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-widest leading-relaxed opacity-80">
                    <div>[SYS] VOX_PROFILES: ELEVENLABS_API_LOADED</div>
                    <div>[SYS] FFMPEG: FASTSTART_FLAGS_ENFORCED // YUV420P</div>
                    <div>[SYS] AUDIO: DUALLY_MASTERED_STEREO_128K</div>
                  </div>
                </div>

                {/* Industrial Custom Controller Console Interface */}
                {selectedReel.status === "done" && (
                  <div className="space-y-4 pt-4 md:pt-0">
                    {/* Custom timeline bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-text-tertiary w-8 text-left">{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.05"
                        value={currentTime}
                        onChange={handleTimeChange}
                        className="flex-1 accent-accent-primary h-1 bg-surface-2 cursor-ew-resize rounded-full"
                      />
                      <span className="text-[9px] font-mono text-text-tertiary w-8 text-right">{formatTime(duration)}</span>
                    </div>

                    {/* Mechanical Switches Deck */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={togglePlay}
                        className="px-3.5 py-2 border border-border-default/40 hover:border-accent-primary/60 bg-surface-0 hover:bg-surface-2/60 font-mono text-[9px] font-bold text-text-primary uppercase tracking-wider transition-all cursor-pointer rounded-md flex items-center gap-1.5"
                      >
                        {isPlaying ? (
                          <>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                            Pause
                          </>
                        ) : (
                          <>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Play
                          </>
                        )}
                      </button>

                      <button
                        onClick={toggleMute}
                        className="px-3.5 py-2 border border-border-default/40 hover:border-accent-primary/60 bg-surface-0 hover:bg-surface-2/60 font-mono text-[9px] font-bold text-text-primary uppercase tracking-wider transition-all cursor-pointer rounded-md flex items-center gap-1.5"
                      >
                        {isMuted ? (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <line x1="23" y1="9" x2="17" y2="15" />
                              <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                            Unmute
                          </>
                        ) : (
                          <>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                            Mute
                          </>
                        )}
                      </button>

                      <a
                        href={selectedReel.downloadUrl || selectedReel.videoUrl}
                        download
                        className="px-3.5 py-2 border border-accent-primary bg-accent-primary hover:bg-accent-primary/80 font-mono text-[9px] font-bold text-surface-0 uppercase tracking-wider transition-all cursor-pointer ml-auto rounded-md flex items-center gap-1.5"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                        Export MP4
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workspace-telemetry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-surface-1 border border-border-default/40 p-6 rounded-lg select-none relative"
          >
            {/* Header Telemetry bar */}
            <div className="flex items-center justify-between border-b border-border-default/20 pb-3.5 mb-6 text-[10px] text-text-secondary font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full" />
                <span>Creative Workstation // Diagnostics</span>
              </div>
              <span className="text-[8px] tracking-wider uppercase opacity-75">Platform Node Status: ONLINE</span>
            </div>

            <div className="space-y-6">
              {/* Atmospheric visual splash */}
              <div className="relative border border-border-default/30 bg-surface-0/60 p-5 rounded-md text-center overflow-hidden">
                {/* HUD corners */}
                <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 border-t border-l border-accent-primary/30" />
                <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 border-t border-r border-accent-primary/30" />
                <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 border-b border-l border-accent-primary/30" />
                <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 border-b border-r border-accent-primary/30" />

                <div className="w-10 h-10 mx-auto mb-3 border border-accent-primary/20 bg-accent-primary/5 flex items-center justify-center rounded-full text-accent-primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="12" x="2" y="3" rx="2" />
                    <path d="M12 17v4M8 21h8" />
                  </svg>
                </div>
                <h4 className="font-sans font-bold text-xs text-text-secondary mb-1">
                  Ready for Generation
                </h4>
                <p className="text-text-tertiary font-sans text-[11px] font-light max-w-sm mx-auto leading-relaxed">
                  Trigger automated synthesis from the workspace parameter console to launch dynamic post-production rendering.
                </p>
              </div>

              {/* Interactive pipeline flow indicator */}
              <div>
                <label className="block text-[9px] font-mono text-text-tertiary uppercase tracking-widest mb-3">
                  Autonomous Render Architecture
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="bg-surface-0 border border-border-default/30 p-2.5 rounded-md text-center">
                    <span className="text-[14px] mb-1.5 block">✍️</span>
                    <span className="text-[9px] font-sans font-semibold block text-text-secondary">Script Spec</span>
                    <span className="text-[7px] font-mono block text-text-tertiary uppercase tracking-wider mt-0.5">Automated</span>
                  </div>
                  <div className="bg-surface-0 border border-border-default/30 p-2.5 rounded-md text-center">
                    <span className="text-[14px] mb-1.5 block">🎙️</span>
                    <span className="text-[9px] font-sans font-semibold block text-text-secondary">Voice Synthesis</span>
                    <span className="text-[7px] font-mono block text-text-tertiary uppercase tracking-wider mt-0.5">ElevenLabs</span>
                  </div>
                  <div className="bg-surface-0 border border-border-default/30 p-2.5 rounded-md text-center">
                    <span className="text-[14px] mb-1.5 block">🎬</span>
                    <span className="text-[9px] font-sans font-semibold block text-text-secondary">FFmpeg Comps</span>
                    <span className="text-[7px] font-mono block text-text-tertiary uppercase tracking-wider mt-0.5">Faststart</span>
                  </div>
                  <div className="bg-surface-0 border border-border-default/30 p-2.5 rounded-md text-center">
                    <span className="text-[14px] mb-1.5 block">🚀</span>
                    <span className="text-[9px] font-sans font-semibold block text-text-secondary">Publish</span>
                    <span className="text-[7px] font-mono block text-text-tertiary uppercase tracking-wider mt-0.5">Done</span>
                  </div>
                </div>
              </div>

              {/* Core engine logs and loaded state indicators */}
              <div className="border-t border-border-default/15 pt-4.5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-mono text-text-tertiary block">Active Synthesis Host</span>
                  <span className="text-[10px] font-sans font-bold text-text-secondary mt-0.5 block">Local Node // api_server:8000</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-text-tertiary block">VOX ducking master</span>
                  <span className="text-[10px] font-sans font-bold text-accent-primary mt-0.5 block">Active (Eleventh Vox Core)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. ACTIVE RENDER OPERATIONS ─── */}
      {activeReels.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
            <h3 className="font-sans font-bold text-xs text-text-primary">
              Active Operations ({activeReels.length})
            </h3>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {activeReels.map((reel) => (
                <motion.div
                  key={reel.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onSelectReel(reel)}
                  className={`glass-card p-4 border transition-all duration-300 rounded-md cursor-pointer ${
                    selectedReel?.id === reel.id
                      ? "border-accent-primary bg-surface-2 shadow-sm"
                      : "border-border-default/40 hover:border-accent-primary/60 hover:bg-surface-2/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Mini rendering spinner box */}
                      <div className="w-8 h-12 bg-surface-2 border border-border-default/30 flex-shrink-0 relative overflow-hidden flex items-center justify-center rounded">
                        <div className="w-3.5 h-3.5 border border-t-accent-primary border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full" />
                      </div>

                      <div>
                        <div className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">{reel.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-mono text-accent-primary uppercase font-semibold">
                            Pipeline: {reel.topic}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="badge badge-amber text-[8px] animate-pulse">
                      {statusLabels[reel.status]}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar rounded-full overflow-hidden">
                    <div
                      className="progress-bar-fill rounded-full"
                      style={{ width: `${reel.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-mono text-text-tertiary uppercase">
                      {reel.status === "generating" ? "VOX_SYNTHESIS_STAGE" : "FFMPEG_RENDER_FILTER"}
                    </span>
                    <span className="text-[9px] font-mono text-accent-primary font-bold">
                      {reel.progress}.0%
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ─── 3. RECENTLY COMPLETED GRID ─── */}
      {completedReels.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-text-secondary rounded-full" />
            <h3 className="font-sans font-bold text-xs text-text-primary">
              Completed Render Pipelines ({completedReels.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {completedReels.slice(0, 6).map((reel) => (
              <div
                key={reel.id}
                onClick={() => onSelectReel(reel)}
                className="group cursor-pointer"
              >
                <div className={`aspect-[9/16] bg-surface-1 border overflow-hidden relative transition-all duration-300 rounded-md ${
                  selectedReel?.id === reel.id ? "border-accent-primary bg-surface-2 shadow-sm" : "border-border-default/40 hover:border-accent-primary/60 hover:shadow-md"
                }`}>
                  {/* Visual Temporal Fragment Poster fallback if browser enables it */}
                  {reel.videoUrl && (
                    <video
                      src={reel.videoUrl + "#t=0.1"}
                      className="w-full h-full object-cover pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-300"
                      preload="metadata"
                      playsInline
                      muted
                    />
                  )}

                  {/* Play overlay indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-surface-0/40 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-surface-0 border border-accent-primary flex items-center justify-center text-accent-primary shadow-lg">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="8 5 19 12 8 19 8 5" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom details block */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-surface-0/90 border-t border-border-default/20 z-10">
                    <div className="text-text-primary text-[9px] font-mono uppercase font-bold tracking-wider truncate">{reel.name}</div>
                    <div className="flex items-center gap-2 mt-1 text-[8px] font-mono text-text-tertiary">
                      <span>{reel.duration}S</span>
                      <span>//</span>
                      <span>{reel.sizeMB}MB</span>
                    </div>
                  </div>

                  {/* Checkmark badge */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <div className="w-4 h-4 bg-surface-0 border border-accent-primary/60 flex items-center justify-center rounded-full shadow-sm">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f2b759" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no reels exist */}
      {reels.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-12 select-none">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-5 border border-border-default/40 bg-surface-1 flex items-center justify-center rounded-full">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
            <h3 className="font-sans font-bold text-xs text-text-secondary mb-1">
              No Deployed Jobs
            </h3>
            <p className="text-text-tertiary font-sans text-[11px] font-light max-w-xs leading-relaxed">
              Configure parameters in the initialization console and trigger render pipelines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
