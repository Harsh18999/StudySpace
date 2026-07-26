"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { InteractiveWorkflow } from "@/components/landing/InteractiveWorkflow";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { PremiumFeaturesGrid } from "@/components/landing/PremiumFeaturesGrid";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { DemoModal } from "@/components/landing/DemoModal";

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] overflow-y-auto font-sans selection:bg-[#0D9488]/20 selection:text-[#0D9488] relative">
      {/* Sticky Navigation Bar */}
      <Navbar />

      {/* Hero Section with Dashboard Mockup matching Real Layout */}
      <Hero onOpenDemo={() => setIsDemoOpen(true)} />

      {/* Trusted By Institutions */}
      <TrustedBy />

      {/* AI RAG Workflow Visualization Diagram */}
      <InteractiveWorkflow />

      {/* Features Suite (with Knowledge Graph & Multi-LLM as Upcoming) */}
      <Features />

      {/* Step-by-Step How It Works */}
      <HowItWorks />

      {/* Large Showcase Mockup matching Real Dual-Sidebar Layout */}
      <DashboardMockup />

      {/* Premium & Upcoming Capabilities Grid */}
      <PremiumFeaturesGrid />

      {/* Credit System Pricing (500 Free Credits, 1 ₹ = 10 Cr, 1 Cr Chat, 10 Cr Notes/Quiz/Flashcards) */}
      <Pricing />

      {/* Frequently Asked Questions */}
      <FAQ />

      {/* Final Gradient CTA Banner */}
      <FinalCTA onOpenDemo={() => setIsDemoOpen(true)} />

      {/* Footer */}
      <Footer />

      {/* Interactive Video Demo Modal */}
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}
