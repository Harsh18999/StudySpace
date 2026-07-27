"use client";

import React from "react";
import Link from "next/link";
import { Coins, ArrowRight, Bot, FileText, HelpCircle, Brain, Video, Sparkles, CheckCircle2 } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-[#FAF7F2] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Simple & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            500 Free Credits On Signup
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            No monthly subscription commitments. Start free with <strong>500 credits on signup</strong>, and refill anytime at <strong>1 ₹ = 10 Base Credits</strong>.
          </p>
        </div>

        {/* ── Credit Consumption Breakdown Banner ── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0D9488]/10 via-[#2563EB]/10 to-[#7C3AED]/10 border border-[#0D9488]/30 max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#0D9488]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1C1917] font-['Plus_Jakarta_Sans']">Credit Cost Breakdown</h3>
                <p className="text-xs text-[#78716C]">Transparent usage rate per feature</p>
              </div>
            </div>
            <div className="bg-[#FFFDF9] px-4 py-2 rounded-2xl border border-[#0D9488]/30 text-xs font-bold text-[#0D9488] shadow-sm">
              1 ₹ = 10 Base Credits
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            {/* Video Processing */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <Video className="w-4 h-4 text-amber-600" />
                <span>Process Video</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">50 Credits</p>
              <p className="text-[11px] text-[#78716C]">Videos up to 2 hours duration</p>
            </div>

            {/* AI Notes */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>AI Notes</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">15 Credits</p>
              <p className="text-[11px] text-[#78716C]">Per note generation</p>
            </div>

            {/* AI Quiz Bank */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>AI Quiz Bank</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">10 Credits</p>
              <p className="text-[11px] text-[#78716C]">Per 10 MCQ set</p>
            </div>

            {/* Smart Flashcards */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <Brain className="w-4 h-4 text-purple-600" />
                <span>Flashcards</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">10 Credits</p>
              <p className="text-[11px] text-[#78716C]">Per flashcard deck</p>
            </div>

            {/* AI Tutor Chat */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <Bot className="w-4 h-4 text-[#0D9488]" />
                <span>AI Tutor Chat</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">1 Credit</p>
              <p className="text-[11px] text-[#78716C]">Per query message</p>
            </div>
          </div>
        </div>

        {/* ── Start Free Banner ── */}
        <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Instant Account Access
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
              Claim Your 500 Free Credits
            </h3>
            <p className="text-sm text-[#78716C]">
              Create an account now and start processing lecture videos, generating study notes, flashcards, and quizzes immediately.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <Link
              href="/auth"
              className="py-4 px-8 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#0D9488] to-[#0F766E] shadow-md hover:shadow-lg hover:from-[#0F766E] hover:to-[#115E59] transition-all flex items-center gap-2"
            >
              <span>Get 500 Free Credits on Signup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#78716C] pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> 500 Credits on Signup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" /> 1 ₹ = 10 Credits Rate
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
