"use client";

import { useRef } from "react";
import Navigation from "@/components/landing/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import ShowcaseSection from "@/components/landing/ShowcaseSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import StatsSection from "@/components/landing/StatsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const showcaseRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="ambient-orb ambient-orb-amber animate-drift"
          style={{ width: "600px", height: "600px", top: "-10%", right: "-5%" }}
        />
        <div
          className="ambient-orb ambient-orb-teal animate-drift"
          style={{
            width: "500px",
            height: "500px",
            bottom: "10%",
            left: "-8%",
            animationDelay: "-7s",
          }}
        />
        <div
          className="ambient-orb ambient-orb-rose animate-drift"
          style={{
            width: "400px",
            height: "400px",
            top: "40%",
            left: "50%",
            animationDelay: "-14s",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0 opacity-40" />

      {/* Content */}
      <div className="relative z-10">
        <Navigation />
        <HeroSection onExplore={() => showcaseRef.current?.scrollIntoView({ behavior: "smooth" })} />
        <div ref={showcaseRef}>
          <ShowcaseSection />
        </div>
        <FeaturesSection />
        <WorkflowSection />
        <StatsSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
