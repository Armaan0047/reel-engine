"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-surface-1/90 backdrop-blur-md border-b border-border-default/30 py-3"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="container-cinematic max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-6 h-6 flex-shrink-0">
              {/* Luxury gold rounded indicator */}
              <div className="absolute inset-0 border border-accent-primary bg-surface-0 flex items-center justify-center rounded-full">
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                  <path d="M4 2L12 8L4 14V2Z" fill="#f2b759" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-[0.2em] text-text-primary uppercase">
                REEL ENGINE
              </span>
              <span className="text-[7px] font-mono text-accent-primary/80 tracking-[0.15em] uppercase">
                SYSTEM.ACTIVE
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {["Features", "Workflow", "Showcase"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-3.5 py-1 text-[10px] font-mono tracking-[0.15em] uppercase text-text-secondary hover:text-accent-primary hover:bg-surface-2 transition-all duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/studio" className="btn-primary text-[9px] py-2 px-5 tracking-[0.1em] font-mono border-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              LAUNCH ENGINE
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-[2px] bg-text-secondary transition-all ${mobileOpen ? "rotate-45 translate-y-[8px]" : ""}`} />
            <span className={`block w-5 h-[2px] bg-text-secondary transition-all ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-[2px] bg-text-secondary transition-all ${mobileOpen ? "-rotate-45 -translate-y-[8px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-surface-1/95 border-b border-border-default/30 pt-24 px-6 md:hidden">
            <div className="flex flex-col gap-4">
              {["Features", "Workflow", "Showcase"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileOpen(false)}
                  className="text-xs font-mono tracking-[0.2em] text-text-secondary hover:text-accent-primary py-3 border-b border-border-subtle"
                >
                  {item}
                </a>
              ))}
              <Link
                href="/studio"
                className="btn-primary text-center mt-4 tracking-[0.1em] font-mono"
                onClick={() => setMobileOpen(false)}
              >
                LAUNCH ENGINE
              </Link>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
