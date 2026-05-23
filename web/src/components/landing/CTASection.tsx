"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-36 bg-surface-0 overflow-hidden" ref={ref}>
      <div className="container-cinematic max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display font-light text-3xl md:text-5xl text-text-primary mb-6 leading-tight uppercase tracking-tight">
            Initialize Cinematic
            <br />
            <span className="font-extrabold text-accent-primary">Render Engine</span>
          </h2>
          <p className="text-text-secondary text-sm max-w-xl mx-auto mb-12 leading-relaxed font-light">
            Deploy topic-aware short-form rendering arrays in seconds. 
            Calibrated for maximum viewer retention, tactical audio distribution, and high-fidelity video processing.
          </p>

          <Link href="/studio" className="btn-primary text-[10px] px-10 py-4 tracking-[0.12em] font-mono border-0 hover:shadow-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            LAUNCH STUDIO WORKSTATION
          </Link>

          <p className="text-text-tertiary text-[9px] font-mono mt-8 tracking-[0.2em] uppercase opacity-75">
            POWERED BY FFMPEG // EDGE-TTS // ELEVENLABS SYSTEMS
          </p>
        </motion.div>
      </div>
    </section>
  );
}
