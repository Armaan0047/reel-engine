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

export default function StudioSidebar({
  open,
  view,
  onViewChange,
  reelCount,
  activeCount,
}: StudioSidebarProps) {
  const navItems = [
    {
      id: "generate" as const,
      label: "Initialize",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      badge: activeCount > 0 ? activeCount : null,
    },
    {
      id: "history" as const,
      label: "Repository",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      badge: reelCount > 0 ? reelCount : null,
    },
  ];

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 200, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="h-full flex-shrink-0 border-r border-border-default/30 bg-surface-1 overflow-hidden relative z-20"
        >
          <div className="flex flex-col h-full w-[200px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 p-5 group">
              <div className="relative w-5 h-5 flex-shrink-0">
                <div className="absolute inset-0 border border-accent-primary bg-surface-0 flex items-center justify-center rounded-full">
                  <svg width="6" height="6" viewBox="0 0 16 16" fill="none">
                    <path d="M4 2L12 8L4 14V2Z" fill="#f2b759" />
                  </svg>
                </div>
              </div>
              <div>
                <span className="font-mono text-[10px] tracking-[0.15em] text-text-primary block uppercase">
                  REEL ENGINE
                </span>
                <span className="text-accent-primary/80 text-[7px] font-mono tracking-[0.1em] block uppercase mt-0.5">
                  STUDIO.CONSOLE
                </span>
              </div>
            </Link>

            <div className="h-px bg-border-default/20 mx-4 mb-4" />

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 border text-[10px] font-mono tracking-wider transition-all duration-300 rounded-md cursor-pointer uppercase ${
                    view === item.id
                      ? "bg-accent-primary text-surface-0 border-accent-primary font-bold shadow-sm"
                      : "text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-2"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        view === item.id
                          ? "bg-surface-0/20 text-surface-0"
                          : "bg-surface-3 text-text-secondary border border-border-default/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Engine status telemetry */}
            <div className="p-4">
              <div className="border border-border-default/30 bg-surface-0/40 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
                  <span className="text-[9px] font-mono tracking-wide text-text-secondary uppercase">Sys Active</span>
                </div>
                <div className="text-[8px] font-mono text-text-tertiary uppercase leading-relaxed opacity-85">
                  v4.1 // ffmpeg_grd
                  <br />
                  eleven_vox_enc
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
