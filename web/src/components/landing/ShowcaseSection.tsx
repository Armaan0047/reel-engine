"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const TOPICS = [
  {
    id: "ai_tech",
    label: "AI & Tech",
    script: "AI just did in five seconds what took a team two weeks...",
    style: "VOX_SYSTEM",
    gradient: "from-amber-950/20 via-surface-2 to-surface-1",
  },
  {
    id: "luxury",
    label: "Luxury",
    script: "While they argue about prices, you compare private jets...",
    style: "CINEMATIC",
    gradient: "from-zinc-900/20 via-surface-2 to-surface-1",
  },
  {
    id: "motivation",
    label: "Motivation",
    script: "Nobody is coming to save you. Read that again...",
    style: "EDITORIAL",
    gradient: "from-stone-900/20 via-surface-2 to-surface-1",
  },
  {
    id: "dark_psych",
    label: "Dark Psychology",
    script: "You are being manipulated every single day...",
    style: "VOX_SYSTEM",
    gradient: "from-neutral-900/20 via-surface-2 to-surface-1",
  },
  {
    id: "sigma",
    label: "Sigma",
    script: "Stop telling people your plans. Show them results...",
    style: "CINEMATIC",
    gradient: "from-slate-900/20 via-surface-2 to-surface-1",
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    script: "Hackers can break into your phone in sixty seconds...",
    style: "VOX_SYSTEM",
    gradient: "from-red-950/10 via-surface-2 to-surface-1",
  },
];

export default function ShowcaseSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="showcase" className="relative py-36 overflow-hidden bg-surface-0" ref={ref}>
      <div className="container-cinematic max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <span className="badge badge-amber mb-5 inline-flex px-4 py-1 tracking-[0.15em] font-mono text-[9px]">
            DEPLOYMENT ARRAYS // 12 CATEGORIES
          </span>
          <h2 className="font-display font-light text-3xl md:text-5xl text-text-primary mb-6 uppercase tracking-tight">
            Topic-Specific <span className="font-extrabold text-accent-primary">Channels</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed font-light">
            Rigorous topic-aware rendering parameters with calibrated voice synthesis, desaturated grade filters, and automated post-production overlays.
          </p>
        </motion.div>

        {/* Showcase grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOPICS.map((topic, i) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * i }}
              className="group relative"
            >
              <div className="glass-card p-5 h-full hover-lift cursor-pointer border border-border-default/40 hover:border-accent-primary/60 transition-all duration-300">
                {/* Topic indicator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-1.5 bg-accent-primary rounded-full" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-primary font-semibold">
                    {topic.label}
                  </span>
                  <span className="ml-auto font-mono text-[8px] py-0.5 px-2 bg-surface-2 border border-border-default/50 text-text-tertiary">
                    {topic.style}
                  </span>
                </div>

                {/* Refined Cinematic Card Preview */}
                <div className="relative aspect-[9/14] overflow-hidden mb-4 bg-surface-2 border border-border-default/30">
                  {/* Subtle film grain & atmospheric linear textures */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${topic.gradient} opacity-40 mix-blend-overlay z-10 pointer-events-none`} />
                  <div className="absolute inset-0 bg-radial-scanlines opacity-5 pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-0/90 z-10" />

                  {/* Play Controller HUD Trigger */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-0/70 border border-border-strong text-accent-primary group-hover:bg-accent-primary group-hover:text-surface-0 hover:scale-105 transition-all duration-300 shadow-xl">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                        <polygon points="8 5 19 12 8 19 8 5" />
                      </svg>
                    </div>
                  </div>

                  {/* Subtle layout brackets for tactical camera grids */}
                  <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-text-tertiary/20 pointer-events-none" />
                  <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-text-tertiary/20 pointer-events-none" />
                  <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-text-tertiary/20 pointer-events-none" />
                  <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-text-tertiary/20 pointer-events-none" />

                  {/* Simulated subtitle bar */}
                  <div className="absolute bottom-5 left-3 right-3 z-20">
                    <div className="bg-surface-1/95 border border-border-default/30 px-3 py-2 text-center shadow-lg">
                      <span className="text-text-primary text-[9px] font-mono tracking-wide uppercase font-semibold">
                        {topic.script.split(" ").slice(0, 5).join(" ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Script preview in premium luxurious body text */}
                <p className="text-text-secondary font-sans text-[11px] leading-relaxed line-clamp-2 italic opacity-85 group-hover:opacity-100 transition-opacity">
                  &ldquo;{topic.script}&rdquo;
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
