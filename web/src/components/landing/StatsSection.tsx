"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STATS = [
  { value: "12", label: "Active Pipelines", suffix: "" },
  { value: "7", label: "Timing Presets", suffix: "" },
  { value: "1080", label: "Vertical Resolution", suffix: "p" },
  { value: "3", label: "Redundancy Tiers", suffix: "-Tier" },
  { value: "30", label: "Core Scripts", suffix: "+" },
  { value: "192", label: "Audio Bandwidth", suffix: "K" },
];

export default function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-24 bg-surface-0" ref={ref}>
      <div className="container-cinematic max-w-5xl mx-auto relative z-10">
        {/* Borderless spacious strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="p-4 text-center border-l border-border-default/40 group hover:border-accent-primary/60 transition-all duration-300"
            >
              <div className="font-display font-extrabold text-3xl md:text-4xl text-accent-primary mb-2 tracking-tight">
                {stat.value}
                <span className="text-[10px] font-mono font-medium text-text-secondary ml-1">{stat.suffix}</span>
              </div>
              <div className="text-text-secondary text-[10px] font-sans tracking-wide font-light">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
