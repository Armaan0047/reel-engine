"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const FEATURES = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
    title: "Topic-Aware Voice Synthesis",
    description:
      "12 calibrated voice profiles configured with topic-aware pacing, vocal tone, and emotional pitch mapping. Leverages ElevenLabs premium layers.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="18" x="3" y="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),
    title: "Dual Visual Routing",
    description:
      "Automated asset retrieval routing. Serves viral background hooks or desaturated luxury stock cinematic segments depending on the pipeline category.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: "Ambient Music Engine",
    description:
      "Automated FFmpeg synthesis matching. Integrates cinematic low-frequency rises for motivational tracks, and dark technical pad ducking.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855Z" />
      </svg>
    ),
    title: "Cinematic Color Grading",
    description:
      "Contrast, desaturation, vignettes, and sharpen algorithms. Auto-generates unique color configurations to bypass social platform duplication filters.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="m17 12 3-2v8" />
      </svg>
    ),
    title: "Viral Subtitle Engine",
    description:
      "7 precise subtitle presets. Built-in highlighting for key hook words with automated punctuation strip-downs for high retention rates.",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "3-Tier Render Fallback",
    description:
      "Triple redundancy pipeline (High → Mid → Low). Automatic black-frame telemetry scan validates video layers before completing exports.",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="relative py-36 bg-surface-0" ref={ref}>
      <div className="container-cinematic max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <span className="badge badge-amber mb-5 inline-flex px-4 py-1 tracking-[0.15em] font-mono text-[9px]">
            CORE PIPELINES // SPECIFICATION MANUAL
          </span>
          <h2 className="font-display font-light text-3xl md:text-5xl text-text-primary mb-6 uppercase tracking-tight">
            Engine <span className="font-extrabold text-accent-primary">Capabilities</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed font-light">
            Every step is mathematically validated. No gaming templates, no cyberpunk gimmicks. Engineered with professional post-production precision.
          </p>
        </motion.div>

        {/* Spacious Minimalist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="group relative bg-surface-1/40 p-7 border border-border-default/30 hover:border-accent-primary/40 hover:bg-surface-1/90 transition-all duration-300"
            >
              {/* Icon — sharp box */}
              <div className="w-8 h-8 flex items-center justify-center mb-6 border border-border-strong/50 bg-surface-2 text-accent-primary group-hover:border-accent-primary/60 transition-all duration-300">
                {feature.icon}
              </div>

              <h3 className="font-sans font-bold text-text-primary mb-3 text-sm tracking-wide">
                {feature.title}
              </h3>
              <p className="text-text-secondary font-sans text-xs leading-relaxed font-light">
                {feature.description}
              </p>

              {/* Minimal corner telemetry line */}
              <div className="absolute top-3 right-3 font-mono text-[7px] text-text-tertiary select-none opacity-60">
                CAP_0{i + 1}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
