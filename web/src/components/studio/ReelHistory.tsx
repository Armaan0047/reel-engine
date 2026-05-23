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
      <div className="flex items-center justify-center h-full select-none py-12">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 border border-border-default/40 bg-surface-1/50 flex items-center justify-center rounded-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </div>
          <h3 className="font-sans font-bold text-xs text-text-secondary mb-1">
            Repository Empty
          </h3>
          <p className="text-text-tertiary font-sans text-[11px] font-light">Generated outputs will be logged here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto select-none">
      <div className="flex items-center justify-between mb-8 border-b border-border-default/20 pb-5">
        <div>
          <h2 className="font-sans font-bold text-base text-text-primary">
            Reel Repository
          </h2>
          <p className="text-text-tertiary font-mono text-[9px] uppercase tracking-wider mt-1">
            {completedReels.length} SUCCESSFUL // {failedReels.length} FAILED RENDER JOBS
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <div className="font-mono font-bold text-base text-accent-primary">{completedReels.length}</div>
            <div className="text-[8px] font-mono text-text-tertiary uppercase tracking-widest mt-0.5">DEPLOYMENTS</div>
          </div>
          <div className="w-px h-6 bg-border-default/40" />
          <div className="text-right">
            <div className="font-mono font-bold text-base text-text-primary">
              {completedReels.reduce((acc, r) => acc + (r.sizeMB || 0), 0).toFixed(1)}
            </div>
            <div className="text-[8px] font-mono text-text-tertiary uppercase tracking-widest mt-0.5">TOTAL SIZE (MB)</div>
          </div>
        </div>
      </div>

      {/* Reel list */}
      <div className="space-y-2.5">
        {reels.map((reel) => (
          <div
            key={reel.id}
            onClick={() => onSelect(reel)}
            className="bg-surface-1 border border-border-default/40 hover:border-accent-primary/60 hover:bg-surface-2/40 p-3.5 rounded-md cursor-pointer transition-all duration-300 flex items-center gap-4"
          >
            {/* Thumbnail */}
            <div className="w-9 h-14 bg-surface-2 border border-border-default/30 rounded flex-shrink-0 relative overflow-hidden">
              {reel.status === "done" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-3/30">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-text-tertiary group-hover:text-accent-primary">
                    <polygon points="8 5 19 12 8 19 8 5" />
                  </svg>
                </div>
              ) : reel.status === "error" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/10">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-950/10">
                  <div className="w-3.5 h-3.5 border border-t-accent-primary border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider truncate">{reel.name}</span>
                <span
                  className={`badge text-[8px] py-0.5 px-2 uppercase font-mono ${
                    reel.status === "done"
                      ? "badge-teal border-accent-primary/20 text-accent-primary bg-accent-primary/5"
                      : reel.status === "error"
                      ? "badge-rose border-red-500/20 text-red-400 bg-red-500/5"
                      : "badge-amber border-amber-500/20 text-amber-400 bg-amber-500/5"
                  }`}
                >
                  {reel.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-text-tertiary uppercase">
                <div className="flex items-center gap-1">
                  <span className="text-accent-primary/50">//</span>
                  <span>Pipeline: {reel.topic.replace("_", " ")}</span>
                </div>
                {reel.duration && (
                  <>
                    <span>·</span>
                    <span>{reel.duration}S</span>
                  </>
                )}
                {reel.sizeMB && (
                  <>
                    <span>·</span>
                    <span>{reel.sizeMB}MB</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {reel.status === "done" && (
                <a
                  href={reel.downloadUrl || reel.videoUrl}
                  download
                  className="p-1.5 border border-border-default/40 hover:border-accent-primary/60 bg-surface-2 rounded-md transition-all text-text-tertiary hover:text-accent-primary cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Download export"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                </a>
              )}
              <span className="text-[9px] font-mono text-text-tertiary uppercase opacity-85">
                {new Date(reel.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
