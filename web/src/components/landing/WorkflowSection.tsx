"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    num: "01",
    title: "Parameter Initialization",
    description: "Select from 12 operational categories (AI, motivation, luxury, sigma, dark psychology). The engine configures the corresponding voice files, visual assets, and ducking tracks.",
    detail: "TOPIC_DETECT_ALGORITHM auto-routes custom text parameters.",
  },
  {
    num: "02",
    title: "AI Voice Synthesis",
    description: "Generates two-pass professional narration. Dynamic compression, vocal leveling, and noise gates duck ambient tracks to master clear audio files.",
    detail: "ELEVENLABS_API integrates directly with Edge-TTS redundancy layers.",
  },
  {
    num: "03",
    title: "FFmpeg Rendering Engine",
    description: "Executes localized zoom-pan matrices, color-grading vectors, sharpening algorithms, and auto-wraps timed ASS subtitle overlays.",
    detail: "MULTI_TIER_FAILSAFE triggers secondary render modes on error.",
  },
  {
    num: "04",
    title: "Telemetry Scan & Deploy",
    description: "Triggers black-frame and frozen-screen validation. Exports locked 1080×1920 portrait MP4 files at 30 FPS with high-bitrate packaging.",
    detail: "READY_FOR_DEPLOYMENT on Instagram Reels, TikTok, and Shorts.",
  },
];

export default function WorkflowSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="workflow" className="relative py-36 bg-surface-0" ref={ref}>
      <div className="container-cinematic max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <span className="badge badge-amber mb-5 inline-flex px-4 py-1 tracking-[0.15em] font-mono text-[9px]">
            PIPELINE STAGE FLOW // 4 SEGMENTS
          </span>
          <h2 className="font-display font-light text-3xl md:text-5xl text-text-primary mb-6 uppercase tracking-tight">
            Production <span className="font-extrabold text-accent-primary">Pipeline</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed font-light">
            Strict sequential orchestration logic from initial script detection down to final validation scans.
          </p>
        </motion.div>

        {/* Vertical timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border-default/40 md:-translate-x-px" />

          {STEPS.map((step, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`relative flex items-start gap-6 mb-24 last:mb-0 ${
                  isLeft
                    ? "md:flex-row md:pr-[calc(50%+2.5rem)]"
                    : "md:flex-row-reverse md:pl-[calc(50%+2.5rem)]"
                } flex-row pl-16 md:pl-0`}
              >
                {/* Node indicator — sharp box */}
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 w-4 h-4 border border-accent-primary bg-surface-0 z-10 mt-1 flex items-center justify-center font-mono text-[8px] text-accent-primary select-none font-bold rounded-full">
                  {step.num}
                </div>

                {/* Content card */}
                <div className="glass-card p-6 flex-1 border border-border-default/40 hover:border-accent-primary/60 hover:bg-surface-1/70 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-[10px] font-bold tracking-widest text-accent-primary">
                      [STAGE_{step.num}]
                    </span>
                    <h3 className="font-sans font-bold text-text-primary text-sm tracking-wide">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-text-secondary font-sans text-xs leading-relaxed mb-4 font-light">
                    {step.description}
                  </p>
                  <div className="text-text-tertiary font-mono text-[9px] border-t border-border-default/20 pt-3 opacity-90">
                    Telemetry: <span className="text-accent-primary font-semibold">{step.detail}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
