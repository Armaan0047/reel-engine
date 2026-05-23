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

  const selectedTopicData = TOPICS.find((t) => t.id === selectedTopic);
  const selectedStyleData = STYLES.find((s) => s.id === style);

  return (
    <div className="h-full flex flex-col justify-between select-none">
      {/* Title block */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[8px] font-mono text-accent-primary tracking-widest uppercase py-0.5 px-1.5 bg-accent-primary/10 border border-accent-primary/25 rounded">
            Step {activeStep} of 3
          </span>
          <span className="text-[8px] font-mono text-text-tertiary uppercase tracking-wider">
            Console Initialized
          </span>
        </div>
        <h2 className="font-sans font-bold text-lg text-text-primary">
          Workspace Parameters
        </h2>
        <p className="text-text-tertiary font-sans text-[11px] font-light mt-1">
          Configure rendering engines and trigger automated pipelines.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-1 mb-8 bg-surface-1/40 p-1.5 rounded-lg border border-border-default/20">
        {[1, 2, 3].map((step) => (
          <button
            key={step}
            onClick={() => setActiveStep(step)}
            className={`flex-1 py-1.5 rounded-md text-[9px] font-mono tracking-wider transition-all duration-300 cursor-pointer ${
              activeStep === step
                ? "bg-surface-0 text-accent-primary font-bold shadow-sm border border-border-default/20"
                : "text-text-tertiary hover:text-text-secondary border border-transparent"
            }`}
          >
            {step === 1 ? "01 Pipeline" : step === 2 ? "02 Profile" : "03 Review"}
          </button>
        ))}
      </div>

      {/* Content Form Steps */}
      <div className="flex-1 min-h-[350px]">
        <AnimatePresence mode="wait">
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Category selector */}
              <div>
                <label className="block text-[9px] font-mono text-text-tertiary uppercase tracking-widest mb-3.5">
                  [01] Content Pipeline
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`relative p-3.5 border transition-all duration-300 cursor-pointer rounded-md text-left flex items-center gap-3 ${
                        selectedTopic === topic.id
                          ? "bg-accent-primary/5 text-accent-primary border-accent-primary shadow-sm"
                          : "bg-surface-1 border-border-default/40 text-text-secondary hover:text-text-primary hover:border-border-strong/60 hover:bg-surface-2/40"
                      }`}
                    >
                      <span className="text-sm select-none opacity-90">{topic.icon}</span>
                      <span className="text-[10px] font-sans tracking-wide font-semibold block">
                        {topic.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[9px] font-mono text-text-tertiary uppercase tracking-widest mb-3.5">
                  [02] Batch Quantity
                </label>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-2 font-mono font-bold text-[10px] border transition-all duration-300 rounded-md cursor-pointer ${
                        count === n
                          ? "bg-accent-primary text-surface-0 border-accent-primary shadow-sm"
                          : "bg-surface-1 text-text-secondary border-border-default/40 hover:bg-surface-2 hover:border-border-strong/60"
                      }`}
                    >
                      {n} {n === 1 ? "Reel" : "Reels"}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="flex-1 accent-accent-primary h-1 bg-surface-2 cursor-ew-resize rounded-full"
                  />
                  <span className="text-[10px] font-mono text-text-secondary w-14 text-right font-semibold">
                    {count} {count > 1 ? "Reels" : "Reel"}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setActiveStep(2)}
                  className="w-full py-3 border border-border-default hover:border-accent-primary/60 bg-surface-2 hover:bg-surface-3 text-[10px] font-mono tracking-widest uppercase transition-all rounded-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Continue to Profile
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Visual Profile Selector */}
              <div>
                <label className="block text-[9px] font-mono text-text-tertiary uppercase tracking-widest mb-3.5">
                  [03] Creative Visual Profile
                </label>
                <div className="space-y-2.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`w-full flex items-start gap-3.5 p-3.5 border transition-all duration-300 text-left rounded-md cursor-pointer ${
                        style === s.id
                          ? "bg-surface-2 border-accent-primary text-text-primary shadow-sm"
                          : "bg-surface-1 border-border-default/40 text-text-secondary hover:bg-surface-2/50"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors rounded-full mt-0.5 ${
                          style === s.id ? "border-accent-primary bg-accent-primary/5" : "border-border-strong/40"
                        }`}
                      >
                        {style === s.id && (
                          <div className="w-1.5 h-1.5 bg-accent-primary rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-sans tracking-wide font-bold block">
                          {s.label}
                        </span>
                        <span className="text-text-tertiary text-[9px] font-sans block font-light mt-0.5 leading-normal">
                          {s.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced options with cleaner spacing */}
              <div className="border-t border-border-default/20 pt-5">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-2 text-[9px] font-mono text-text-secondary uppercase hover:text-accent-primary transition-colors cursor-pointer"
                >
                  <motion.svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    animate={{ rotate: expanded ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
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
                          <label className="block text-[8px] font-mono text-text-tertiary uppercase mb-1.5">Voice Synthesis Engine</label>
                          <select className="w-full bg-surface-1 border border-border-default/40 text-text-secondary text-[10px] font-mono px-3 py-2 rounded-md focus:border-accent-primary/60 outline-none">
                            <option value="auto">Auto-Detect Routing</option>
                            <option value="elevenlabs">ElevenLabs Vox API</option>
                            <option value="edge-tts">Microsoft edge-tts</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[8px] font-mono text-text-tertiary uppercase mb-1.5">Output aspect framing</label>
                          <select className="w-full bg-surface-1 border border-border-default/40 text-text-secondary text-[10px] font-mono px-3 py-2 rounded-md focus:border-accent-primary/60 outline-none">
                            <option value="1080x1920">1080x1920 (9:16 Cinematic Vertical)</option>
                            <option value="720x1280">720x1280 (9:16 Lite Vertical)</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveStep(1)}
                  className="flex-1 py-3 border border-border-default/40 hover:bg-surface-2 text-[10px] font-mono tracking-widest uppercase transition-all rounded-md cursor-pointer text-center text-text-secondary"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  className="flex-1 py-3 border border-border-default hover:border-accent-primary/60 bg-surface-2 hover:bg-surface-3 text-[10px] font-mono tracking-widest uppercase transition-all rounded-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Next Step
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Telemetry review card */}
              <div>
                <label className="block text-[9px] font-mono text-text-tertiary uppercase tracking-widest mb-3.5">
                  [04] Render Deployment Review
                </label>
                
                <div className="border border-border-default/40 bg-surface-1/40 p-4.5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-border-default/10">
                    <span className="text-[10px] font-sans text-text-tertiary font-light">Content Pipeline</span>
                    <span className="text-[10px] font-mono font-bold text-text-primary">{selectedTopicData?.label}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-border-default/10">
                    <span className="text-[10px] font-sans text-text-tertiary font-light">Visual profile</span>
                    <span className="text-[10px] font-mono font-bold text-text-primary">{selectedStyleData?.label}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2.5 border-b border-border-default/10">
                    <span className="text-[10px] font-sans text-text-tertiary font-light">Target yield</span>
                    <span className="text-[10px] font-mono font-bold text-accent-primary">{count} {count > 1 ? "Reels" : "Reel"}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-sans text-text-tertiary font-light">Audio synthesize</span>
                    <span className="text-[10px] font-mono font-bold text-text-secondary">Duplex Stereo HIFI</span>
                  </div>
                </div>
              </div>

              {/* Status parameters logs */}
              <div className="font-mono text-[8px] text-text-tertiary uppercase tracking-widest leading-normal space-y-0.5 opacity-80 pt-2">
                <div>[DEPLOY] TIER_1_EFFECTS: AUTOMATED</div>
                <div>[DEPLOY] FFMPEG: FASTSTART_MODE // YUV420P</div>
                <div>[DEPLOY] TIMEOUT_EST: ~{count * 8} SECONDS</div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex-1 py-3.5 border border-border-default/40 hover:bg-surface-2 text-[10px] font-mono tracking-widest uppercase transition-all rounded-md cursor-pointer text-center text-text-secondary"
                >
                  Back
                </button>

                <button
                  onClick={handleSubmit}
                  className="flex-2 btn-primary py-3.5 text-[10px] justify-center tracking-[0.12em] font-mono border-0 hover:shadow-lg rounded-md cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Trigger Pipeline
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Workspace Footer telemetry */}
      <div className="border-t border-border-default/20 pt-4 mt-8 flex items-center justify-between text-[8px] font-mono text-text-tertiary uppercase tracking-widest opacity-80">
        <span>Server status: Online</span>
        <span>Reel Engine v4.1</span>
      </div>
    </div>
  );
}
