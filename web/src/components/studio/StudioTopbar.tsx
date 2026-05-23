"use client";

import { motion } from "framer-motion";

interface StudioTopbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function StudioTopbar({
  onToggleSidebar,
  sidebarOpen,
}: StudioTopbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border-default/20 bg-surface-1 flex-shrink-0 z-20 select-none">
      <div className="flex items-center gap-3.5">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 border border-border-default/40 hover:border-accent-primary/60 bg-surface-0 hover:bg-surface-2 transition-all text-text-secondary hover:text-accent-primary rounded-md cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            animate={{ rotate: sidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <line x1="9" x2="9" y1="3" y2="21" />
          </motion.svg>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase">
          <span className="text-text-tertiary">Studio</span>
          <span className="text-text-muted">/</span>
          <span className="text-accent-primary font-bold">Workspace</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Quick actions */}
        <div className="hidden sm:flex items-center gap-1 mr-2 opacity-85">
          <kbd className="text-[9px] font-mono text-text-tertiary bg-surface-0 px-1.5 py-0.5 border border-border-default/40 rounded">
            Ctrl
          </kbd>
          <kbd className="text-[9px] font-mono text-text-tertiary bg-surface-0 px-1.5 py-0.5 border border-border-default/40 rounded">
            K
          </kbd>
          <span className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider ml-1.5">Telemetry Shell</span>
        </div>

        {/* Settings */}
        <button
          className="p-1.5 border border-border-default/40 hover:border-accent-primary/60 bg-surface-0 hover:bg-surface-2 transition-all text-text-secondary hover:text-accent-primary rounded-md cursor-pointer"
          aria-label="Settings"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* User solid square badge */}
        <div className="w-7 h-7 bg-surface-0 border border-accent-primary/60 flex items-center justify-center font-mono text-[9px] font-bold text-accent-primary select-none rounded-full">
          Sys
        </div>
      </div>
    </header>
  );
}
