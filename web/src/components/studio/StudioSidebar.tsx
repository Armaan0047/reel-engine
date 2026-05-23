"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { StudioView } from "@/app/studio/page";

interface StudioSidebarProps {
  open: boolean;
  view: StudioView;
  onViewChange: (view: StudioView) => void;
  reelCount: number;
  activeCount: number;
}

const NAV = [
  { id: "generate" as const, label: "Studio", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
  { id: "history" as const, label: "Reels", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { id: null, label: "Templates", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: null, label: "Voice Library", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg> },
  { id: null, label: "Assets", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
  { id: null, label: "Analytics", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
] as const;

const NAV_BOTTOM = [
  { id: null, label: "Settings", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg> },
  { id: null, label: "Docs", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
];

export default function StudioSidebar({ open, view, onViewChange, reelCount, activeCount }: StudioSidebarProps) {
  if (!open) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 72, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex-shrink-0 border-r border-border-default bg-surface-1 overflow-hidden relative z-20"
    >
      <div className="flex flex-col h-full w-[72px]">
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center py-4 gap-1 group">
          <div className="w-7 h-7 border border-accent-primary/60 bg-surface-0 flex items-center justify-center rounded-lg">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 2L12 8L4 14V2Z" fill="#e8a030"/></svg>
          </div>
          <span className="font-mono text-[7px] tracking-[0.15em] text-text-tertiary uppercase mt-0.5">Engine</span>
        </Link>

        <div className="h-px bg-border-default mx-3 mb-2" />

        {/* Main nav */}
        <nav className="flex-1 flex flex-col items-center gap-1 px-2">
          {NAV.map((item, i) => {
            const isActive = item.id !== null && view === item.id;
            const isClickable = item.id !== null;
            return (
              <button
                key={i}
                onClick={() => isClickable && onViewChange(item.id!)}
                className={`relative w-full h-10 flex items-center justify-center rounded-md transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? "text-accent-primary bg-accent-primary/8"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-surface-2"
                } ${!isClickable ? "opacity-50 cursor-default" : ""}`}
                title={item.label}
              >
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="absolute left-0 top-2 bottom-2 w-[2px] bg-accent-primary rounded-r" />
                )}
                {item.icon}
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-surface-3 text-text-primary text-[10px] font-mono rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  {item.label}
                  {item.id === "generate" && activeCount > 0 && <span className="ml-1.5 text-accent-primary">{activeCount}</span>}
                  {item.id === "history" && reelCount > 0 && <span className="ml-1.5 text-text-tertiary">{reelCount}</span>}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom nav */}
        <div className="flex flex-col items-center gap-1 px-2 mb-2">
          {NAV_BOTTOM.map((item, i) => (
            <button
              key={i}
              className="w-full h-10 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-all duration-200 opacity-50 cursor-default group relative"
              title={item.label}
            >
              {item.icon}
              <div className="absolute left-full ml-2 px-2 py-1 bg-surface-3 text-text-primary text-[10px] font-mono rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                {item.label}
              </div>
            </button>
          ))}
        </div>

        {/* Engine status */}
        <div className="px-2 pb-3">
          <div className="bg-surface-0 border border-border-default rounded-md p-2.5 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse-dot" />
              <span className="text-[7px] font-mono tracking-wider text-text-tertiary uppercase">Active</span>
            </div>
            <span className="text-[6px] font-mono text-text-muted uppercase tracking-wide text-center leading-relaxed">Reel<br/>Engine</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
