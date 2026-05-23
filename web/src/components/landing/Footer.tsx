"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative py-16 bg-surface-0 border-t border-border-default/30">
      <div className="container-cinematic max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5 flex-shrink-0">
              <div className="absolute inset-0 border border-accent-primary bg-surface-0 flex items-center justify-center rounded-full">
                <svg width="6" height="6" viewBox="0 0 16 16" fill="none">
                  <path d="M4 2L12 8L4 14V2Z" fill="#f2b759" />
                </svg>
              </div>
            </div>
            <span className="font-mono text-[9px] tracking-[0.2em] text-text-secondary uppercase">
              REEL ENGINE v4.1
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-[9px] font-mono tracking-[0.2em] uppercase text-text-tertiary">
            <Link href="/studio" className="hover:text-accent-primary transition-colors">
              STUDIO
            </Link>
            <a href="#features" className="hover:text-accent-primary transition-colors">
              FEATURES
            </a>
            <a href="#workflow" className="hover:text-accent-primary transition-colors">
              WORKFLOW
            </a>
          </div>

          {/* Credits */}
          <div className="text-text-tertiary text-[9px] font-mono tracking-[0.2em] uppercase opacity-75">
            CRAFTED BY ARMAAN // DEPLOYMENT ACTIVE
          </div>
        </div>
      </div>
    </footer>
  );
}
