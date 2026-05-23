"use client";

import { motion } from "framer-motion";
import type { ReelJob } from "@/app/studio/page";

interface ReelHistoryProps {
  reels: ReelJob[];
  onSelect: (reel: ReelJob) => void;
}

export default function ReelHistory({ reels, onSelect }: ReelHistoryProps) {
  const completedReels = reels.filter((r) => r.status === "done");
  const failedReels = reels.filter((r) => r.status === "error");

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full select-none py-20">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 border border-border-default bg-surface-2 flex items-center justify-center rounded-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
            </svg>
          </div>
          <h3 className="font-sans font-semibold text-sm text-text-secondary mb-1">Repository Empty</h3>
          <p className="text-text-tertiary text-[11px] max-w-xs mx-auto">Generated outputs will appear here after successful pipeline runs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-border-default pb-5">
        <div>
          <h2 className="font-sans font-semibold text-base text-text-primary">Reel Repository</h2>
          <p className="text-text-tertiary font-mono text-[10px] uppercase tracking-wider mt-1">
            {completedReels.length} Successful // {failedReels.length} Failed Render Jobs
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <div className="stat-number text-base text-accent-primary">{completedReels.length}</div>
            <div className="text-[8px] font-mono text-text-muted uppercase tracking-widest mt-0.5">Deployments</div>
          </div>
          <div className="w-px h-6 bg-border-default" />
          <div className="text-right">
            <div className="stat-number text-base text-text-primary">{completedReels.reduce((a, r) => a + (r.sizeMB || 0), 0).toFixed(1)}</div>
            <div className="text-[8px] font-mono text-text-muted uppercase tracking-widest mt-0.5">Total Size (MB)</div>
          </div>
        </div>
      </div>

      {/* Reel list */}
      <div className="space-y-2">
        {reels.map((reel) => (
          <motion.div
            key={reel.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(reel)}
            className="panel p-4 hover:border-accent-primary/30 cursor-pointer transition-all duration-200 flex items-center gap-4"
          >
            {/* Thumbnail */}
            <div className="w-10 h-14 bg-surface-2 border border-border-default rounded-md flex-shrink-0 relative overflow-hidden flex items-center justify-center">
              {reel.status === "done" ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-text-tertiary"><polygon points="8 5 19 12 8 19 8 5"/></svg>
              ) : reel.status === "error" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              ) : (
                <div className="w-4 h-4 border-2 border-t-accent-primary border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wide truncate">{reel.name}</span>
                <span className={`pill text-[8px] py-0 px-1.5 ${
                  reel.status === "done" ? "pill-green" : reel.status === "error" ? "pill-red" : "pill-amber"
                }`}>
                  {reel.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-text-tertiary uppercase">
                <span>Pipeline: {reel.topic.replace("_", " ")}</span>
                {reel.duration && <><span>·</span><span>{reel.duration}s</span></>}
                {reel.sizeMB && <><span>·</span><span>{reel.sizeMB}MB</span></>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {reel.status === "done" && (
                <a
                  href={reel.downloadUrl || reel.videoUrl}
                  download
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default hover:border-accent-primary/40 bg-surface-2 text-text-tertiary hover:text-accent-primary transition-all cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </a>
              )}
              <span className="text-[9px] font-mono text-text-muted">
                {new Date(reel.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
