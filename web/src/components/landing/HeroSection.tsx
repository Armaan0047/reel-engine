"use client";

import { motion } from "framer-motion";

interface HeroSectionProps {
  onExplore: () => void;
}

export default function HeroSection({ onExplore }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-24 bg-surface-0">
      {/* Tactical grid background overlay */}
      <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />

      {/* Elegant minimalist HUD metadata (Top Left & Top Right) */}
      <div className="absolute top-32 left-10 font-mono text-[9px] text-text-tertiary tracking-[0.2em] hidden lg:block uppercase select-none opacity-60">
        <div>LOCATION // LXR.SYS.RENDER</div>
        <div className="text-accent-primary mt-1 font-semibold">CORE.STATUS // ENGINE_ACTIVE</div>
      </div>
      <div className="absolute top-32 right-10 font-mono text-[9px] text-text-tertiary tracking-[0.2em] hidden lg:block uppercase text-right select-none opacity-60">
        <div>OPERATING SYSTEM // V4.1</div>
        <div className="mt-1">PORTRAIT ASPECT // 1080×1920</div>
      </div>

      {/* Content */}
      <div className="relative z-10 container-cinematic text-center max-w-4xl mx-auto px-6">
        {/* Luxury subtle system indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-10"
        >
          <div className="badge badge-amber font-mono text-[9px] px-3.5 py-1.5 tracking-[0.15em] border border-accent-primary/20">
            <span className="w-1 h-1 bg-accent-primary animate-pulse rounded-full" />
            CREATIVE HARDWARE INTEGRATION
          </div>
        </motion.div>

        {/* Monumental Cinematic Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-black tracking-tight leading-[1.0] mb-8 text-text-primary uppercase"
        >
          <span className="block text-[clamp(2.5rem,8vw,6.5rem)] text-text-primary font-light">
            Cinematic Reels.
          </span>
          <span className="block text-[clamp(2.5rem,8vw,6.5rem)] text-accent-primary mt-2">
            Engineered by AI.
          </span>
        </motion.h1>

        {/* Subtitle with calm editorial breathing room */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-text-secondary font-sans text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-12 tracking-wide font-light px-4"
        >
          An elite short-form rendering pipeline featuring topic-aware voice routing, 
          cinematic grading, and automated multi-tier post-production. 
          Designed for uncompromising visual attention.
        </motion.p>

        {/* Premium Action Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <a href="/studio" className="btn-primary text-[10px] px-10 py-4 tracking-[0.12em] font-mono border-0 hover:shadow-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            INITIALIZE STUDIO
          </a>
          <button onClick={onExplore} className="btn-ghost text-[10px] px-10 py-4 tracking-[0.12em] font-mono border-border-default/40">
            EXPLORE SYSTEM DEPLOYMENTS
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </motion.div>

        {/* Technical Telemetry Specs Bar (Minimalist without boxing borders) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-28 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-text-tertiary font-mono text-[9px] tracking-[0.2em] uppercase opacity-75"
        >
          {[
            { label: "RESOLUTION", val: "1080×1920 PORTRAIT" },
            { label: "FRAME RATE", val: "30.00 FPS" },
            { label: "CODEC", val: "H.264 PROFILE" },
            { label: "AUDIO MASTER", val: "192KBPS STEREO" },
          ].map((spec) => (
            <div key={spec.label} className="flex items-center gap-2">
              <span className="text-accent-primary/50">//</span>
              <span>{spec.label}: <span className="text-text-secondary font-semibold">{spec.val}</span></span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom subtle material gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-0 to-transparent pointer-events-none" />
    </section>
  );
}
