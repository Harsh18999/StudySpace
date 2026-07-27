"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Play, CheckCircle2 } from "lucide-react";

interface FinalCTAProps {
  onOpenDemo: () => void;
}

export function FinalCTA({ onOpenDemo }: FinalCTAProps) {
  return (
    <section className="py-20 md:py-28 bg-[#FAF7F2] relative overflow-hidden">
      
      {/* Background Gradient Mesh */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-20 bg-gradient-to-tr from-[#0D9488] via-[#2563EB] to-[#7C3AED] shadow-2xl overflow-hidden text-center text-white space-y-8">
          
          {/* Subtle Particles Overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Join Students & Educators Today</span>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-['Plus_Jakarta_Sans'] leading-tight">
              Build Your Personal AI Learning Workspace Today
            </h2>
            <p className="text-base sm:text-lg text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
              Transform any YouTube lecture, research paper, or textbook PDF into structured notes, flashcards, quizzes, and your own AI tutor in seconds.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-[#1C1917] bg-white rounded-2xl shadow-lg hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <span>Start Free (500 Credits)</span>
              <ArrowRight className="w-5 h-5 ml-2 text-[#0D9488]" />
            </Link>

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl hover:bg-white/20 transition-all duration-200"
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Micro Guarantee */}
          <div className="pt-2 flex flex-wrap justify-center gap-6 text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> 500 Free Credits on Signup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> 1 ₹ = 10 Credits Rate
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Instant Setup in 30s
            </span>
          </div>

        </div>
      </div>

    </section>
  );
}
