"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOPICS = [
  { id: "motivation", label: "Motivation", icon: "🔥" },
  { id: "luxury", label: "Luxury", icon: "👑" },
  { id: "sigma_luxury", label: "Sigma Luxury", icon: "💎" },
  { id: "money", label: "Money & Finance", icon: "💰" },
  { id: "ai_tech", label: "AI & Tech", icon: "🤖" },
  { id: "cybersecurity", label: "Cybersecurity", icon: "🔐" },
  { id: "dark_psych", label: "Dark Psychology", icon: "🧠" },
  { id: "society", label: "Society", icon: "🌍" },
  { id: "sigma", label: "Sigma Mindset", icon: "🐺" },
  { id: "student", label: "Student Life", icon: "📚" },
  { id: "pov", label: "POV Style", icon: "👁️" },
  { id: "harsh_truth", label: "Harsh Truth", icon: "⚡" },
];

const STYLES = [
  { id: "auto", label: "Auto-Detect", description: "Engine selects optimal visual configuration" },
  { id: "cinematic", label: "Cinematic Mode", description: "Desaturated coloring, slow motion scaling" },
  { id: "viral", label: "Viral Hook Mode", description: "High contrast cuts, uppercase subtitle trace" },
  { id: "minimal", label: "Minimalist Mode", description: "Clean bottom text trace, zero visual overlay" },
];

interface GeneratePanelProps {
  onGenerate: (config: { topic: string; count: number; style: string }) => void;
}

export default function GeneratePanel({ onGenerate }: GeneratePanelProps) {
  const [selectedTopic, setSelectedTopic] = useState("motivation");
  const [count, setCount] = useState(1);
  const [style, setStyle] = useState("auto");
  const [expanded, setExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleSubmit = () => {
    onGenerate({ topic: selectedTopic, count, style });
  };

  return (
    <div className="h-full flex flex-col select-none">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-sans font-semibold text-[15px] text-text-primary">
            Workspace Parameters
          </h2>
          <p className="text-text-tertiary text-[11px] mt-1">
            Configure your AI reel generation pipeline
          </p>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface-2 transition-colors cursor-pointer mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        <AnimatePresence mode="wait">
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {/* Section 01 — Content Pipeline */}
              <div className="mb-7">
                <span className="section-label block mb-3">01 Content Pipeline</span>
                <div className="grid grid-cols-2 gap-2">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`topic-card ${selectedTopic === topic.id ? "topic-card-active" : ""}`}
                    >
                      <span className="text-base select-none leading-none">{topic.icon}</span>
                      <span className="text-[11px] font-medium text-inherit">{topic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 02 — Batch Quantity */}
              <div className="mb-7">
                <span className="section-label block mb-3">02 Batch Quantity</span>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2 font-sans text-[11px] font-semibold border rounded-md transition-all duration-200 cursor-pointer ${
                        count === n
                          ? "bg-accent-primary text-surface-0 border-accent-primary"
                          : "bg-surface-1 text-text-secondary border-border-default hover:bg-surface-2 hover:border-border-strong"
                      }`}
                    >
                      {n} {n === 1 ? "Reel" : "Reels"}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-[11px] font-mono text-text-secondary w-14 text-right tabular-nums">
                    {count} {count > 1 ? "Reels" : "Reel"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep >= 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {/* Style Selector */}
              <div className="mb-7">
                <span className="section-label block mb-3">03 Visual Profile</span>
                <div className="space-y-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`w-full panel-inset flex items-start gap-3 p-3 transition-all duration-200 text-left cursor-pointer ${
                        style === s.id
                          ? "!border-accent-primary bg-surface-2"
                          : "hover:bg-surface-2/50"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                        style === s.id ? "border-accent-primary" : "border-text-muted"
                      }`}>
                        {style === s.id && <div className="w-1.5 h-1.5 bg-accent-primary rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-text-primary block">{s.label}</span>
                        <span className="text-text-tertiary text-[10px] block mt-0.5 leading-relaxed">{s.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-border-default pt-4 mb-6">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 text-[10px] font-mono text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors cursor-pointer"
                >
                  <motion.svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </motion.svg>
                  Advanced Engine Systems
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 space-y-4">
                        <div>
                          <label className="section-label block mb-1.5">Voice Synthesis Engine</label>
                          <select className="w-full bg-surface-1 border border-border-default text-text-secondary text-[11px] font-mono px-3 py-2 rounded-md focus:border-accent-primary/60 outline-none">
                            <option value="auto">Auto-Detect Routing</option>
                            <option value="elevenlabs">ElevenLabs Vox API</option>
                            <option value="edge-tts">Microsoft edge-tts</option>
                          </select>
                        </div>
                        <div>
                          <label className="section-label block mb-1.5">Output Aspect Framing</label>
                          <select className="w-full bg-surface-1 border border-border-default text-text-secondary text-[11px] font-mono px-3 py-2 rounded-md focus:border-accent-primary/60 outline-none">
                            <option value="1080x1920">1080×1920 (9:16 Vertical)</option>
                            <option value="720x1280">720×1280 (9:16 Lite)</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Review summary when on step 3 */}
              {activeStep === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="panel-inset p-4 mb-6 space-y-3"
                >
                  <span className="section-label block mb-2">04 Render Review</span>
                  {[
                    ["Pipeline", TOPICS.find(t => t.id === selectedTopic)?.label],
                    ["Profile", STYLES.find(s2 => s2.id === style)?.label],
                    ["Yield", `${count} ${count > 1 ? "Reels" : "Reel"}`],
                    ["Audio", "Duplex Stereo HIFI"],
                  ].map(([k, v], i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-border-subtle last:border-0">
                      <span className="text-[11px] text-text-tertiary">{k}</span>
                      <span className="text-[11px] font-mono font-semibold text-text-primary">{v}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA Buttons */}
      <div className="pt-4 border-t border-border-default mt-auto">
        {activeStep > 1 && (
          <button
            onClick={() => setActiveStep(activeStep - 1)}
            className="w-full mb-2 py-2 text-[11px] font-mono text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer text-center"
          >
            ← Back
          </button>
        )}

        <button
          onClick={() => {
            if (activeStep < 3) setActiveStep(activeStep + 1);
            else handleSubmit();
          }}
          className={`w-full py-3 rounded-md font-sans font-semibold text-[12px] tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeStep === 3
              ? "btn-primary"
              : "bg-accent-primary text-surface-0 hover:bg-accent-tertiary"
          }`}
        >
          {activeStep === 3 ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Trigger Pipeline
            </>
          ) : activeStep === 2 ? (
            "Review & Launch →"
          ) : (
            "Continue to Profile →"
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-3 text-[9px] font-mono text-text-muted uppercase tracking-wider">
        <span>Server: Online</span>
        <span>v4.1</span>
      </div>
    </div>
  );
}
