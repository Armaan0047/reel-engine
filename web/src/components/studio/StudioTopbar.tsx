"use client";

interface StudioTopbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function StudioTopbar({ onToggleSidebar, sidebarOpen }: StudioTopbarProps) {
  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-border-default bg-surface-1 flex-shrink-0 z-20 select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default hover:border-accent-primary/40 bg-surface-0 text-text-tertiary hover:text-accent-primary transition-all cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <span className="font-mono text-[11px] font-bold tracking-wider text-text-primary uppercase">Reel Engine</span>
          <span className="text-text-muted font-mono text-[11px]">/</span>
          <span className="font-mono text-[11px] text-text-tertiary uppercase tracking-wider">AI Video Automation Studio</span>
        </div>

        <div className="h-4 w-px bg-border-default mx-1 hidden md:block" />

        <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase">
          <span className="text-text-tertiary">Studio</span>
          <span className="text-text-muted">/</span>
          <span className="text-accent-primary font-semibold">Workspace</span>
        </div>
      </div>

      {/* Center — Status pills */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">System Status</span>
        <span className="text-text-muted text-[10px]">›</span>
        <span className="pill pill-green">
          <span className="w-1.5 h-1.5 bg-green rounded-full animate-pulse-dot" />
          Online
        </span>

        <span className="text-text-muted text-[10px] ml-2">Render Engine</span>
        <span className="text-text-muted text-[10px]">›</span>
        <span className="pill pill-amber">
          <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse-dot" />
          Active
        </span>

        <span className="text-text-muted text-[10px] ml-2">GPU Utilization</span>
        <span className="text-text-muted text-[10px]">›</span>
        <span className="pill pill-cyan">▲ 42%</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default hover:border-accent-primary/40 bg-surface-0 text-text-tertiary hover:text-text-secondary transition-all cursor-pointer" aria-label="Settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-md border border-border-default hover:border-accent-primary/40 bg-surface-0 text-text-tertiary hover:text-text-secondary transition-all cursor-pointer" aria-label="Notifications">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red rounded-full border-2 border-surface-1" />
        </button>

        {/* User */}
        <div className="w-7 h-7 bg-surface-0 border border-accent-primary/50 flex items-center justify-center font-mono text-[9px] font-bold text-accent-primary rounded-full select-none ml-1">
          AG
        </div>
      </div>
    </header>
  );
}
