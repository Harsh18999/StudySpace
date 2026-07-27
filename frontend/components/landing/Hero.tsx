"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { HeroDashboardMockup } from "./HeroDashboardMockup";

interface HeroProps {
  onOpenDemo: () => void;
}

export function Hero({ onOpenDemo }: HeroProps) {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) setIsAuth(true);
    }
  }, []);

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-[#FAF7F2]">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-teal-200/20 via-blue-200/20 to-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Top Tagline Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm text-xs font-semibold text-[#1C1917] hover:border-[#0D9488]/40 transition-colors">
            <span className="flex h-2 w-2 rounded-full bg-[#0D9488] animate-pulse" />
            <span>AI-Powered Learning Workspace 2.0</span>
            <span className="text-[#A8A29E]">|</span>
            <span className="text-[#0D9488] font-bold">500 Credits on Signup</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1C1917] font-['Plus_Jakarta_Sans'] leading-[1.1]">
            Learn Smarter, Not Harder with{" "}
            <span className="gradient-heading">AI</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#78716C] font-normal max-w-2xl mx-auto leading-relaxed">
            Transform YouTube lectures, PDFs, articles, and research papers into beautiful structured notes, quizzes, flashcards, and your own personal AI tutor.
          </p>

          {/* CTA Button Group */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isAuth ? "/dashboard" : "/auth"}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-base font-bold text-white bg-gradient-to-r from-[#0D9488] via-[#2563EB] to-[#7C3AED] rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              <span>{isAuth ? "Go to Dashboard" : "Start Learning Free"}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-[#1C1917] bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl shadow-sm hover:bg-[#F5EFE6] hover:border-[#D6CEC0] transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-full bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center mr-2.5 group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Micro Social Proof Row */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-6 text-xs text-[#78716C] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> Instant Setup (No credit card needed)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> 500 Free Credits Included
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> Export to DOCX
            </span>
          </div>
        </div>

        {/* Hero Interactive Workspace Mockup */}
        <div className="pt-6">
          <HeroDashboardMockup />
        </div>

      </div>
    </section>
  );
}
