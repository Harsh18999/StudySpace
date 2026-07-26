"use client";

import React from "react";
import { 
  LayoutGrid, BarChart2, FileQuestion, CreditCard, Settings, 
  Search, Plus, ChevronDown, ChevronRight, Video, FileCheck, 
  Sparkles, CheckCircle2, Coins, Bell, HelpCircle, Brain, Bot, BookOpen, Activity
} from "lucide-react";

export function DashboardMockup() {
  return (
    <section className="py-20 md:py-32 bg-[#FAF7F2] border-b border-[#E6E0D6] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Real Workspace Layout
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            Designed for Focused Learning
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            Experience the actual StudySpace dual-sidebar layout engineered specifically for deep study sessions.
          </p>
        </div>

        {/* ── Large Dashboard Showcase Frame (Matching Real App) ── */}
        <div className="max-w-5xl mx-auto rounded-3xl border border-[#E6E0D6] bg-[#FFFDF9] shadow-2xl overflow-hidden">
          
          {/* Top Window Bar */}
          <div className="h-10 bg-[#FAF7F2] border-b border-[#E6E0D6] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono text-[#78716C]">studyspace.app/dashboard/space/machine-learning</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#0D9488] font-semibold bg-[#0D9488]/10 px-2.5 py-0.5 rounded-full border border-[#0D9488]/20">
              <Coins className="w-3.5 h-3.5" />
              <span>500 Free Credits / mo</span>
            </div>
          </div>

          {/* Body Content Grid */}
          <div className="grid grid-cols-12 min-h-[500px]">
            
            {/* 1. Icon Sidebar (Dark #1C1917) */}
            <div className="col-span-1 bg-[#1C1917] text-[#A8A29E] flex flex-col items-center py-4 justify-between border-r border-[#2E2A27]">
              <div className="flex flex-col items-center gap-5 w-full">
                <div className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs">
                  S
                </div>
                <div className="flex flex-col gap-3 w-full px-2">
                  <div className="p-2 rounded-xl bg-[#0D9488]/20 text-[#0D9488] flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div className="p-2 rounded-xl hover:bg-[#2E2A27] flex items-center justify-center">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div className="p-2 rounded-xl hover:bg-[#2E2A27] flex items-center justify-center">
                    <FileQuestion className="w-4 h-4" />
                  </div>
                  <div className="p-2 rounded-xl hover:bg-[#2E2A27] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <Settings className="w-4 h-4 text-[#A8A29E]" />
            </div>

            {/* 2. Module Sidebar (Light #FAF7F2) */}
            <div className="col-span-3 border-r border-[#E6E0D6] bg-[#FAF7F2] p-3.5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                  <span className="font-bold text-[#1C1917] text-sm font-['Plus_Jakarta_Sans']">Machine Learning</span>
                </div>
                <Plus className="w-3.5 h-3.5 text-[#78716C]" />
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-[#A8A29E]" />
                <input
                  type="text"
                  readOnly
                  value="Filter modules & resources..."
                  className="w-full bg-white border border-[#E6E0D6] rounded-xl pl-8 pr-2 py-1 text-[11px] text-[#A8A29E]"
                />
              </div>

              <div className="space-y-2 pt-1 text-[11px]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#1C1917]">
                    <span className="flex items-center gap-1">
                      <ChevronDown className="w-3 h-3 text-[#0D9488]" />
                      <span>Module 1: ML Basics</span>
                    </span>
                  </div>

                  <div className="pl-3 space-y-1">
                    <div className="p-1.5 rounded-lg bg-white border border-[#0D9488]/40 flex items-center gap-1.5 text-[#0D9488] font-semibold">
                      <Video className="w-3 h-3 text-red-500" />
                      <span className="truncate">CS229 Lecture 1</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/60 border border-[#E6E0D6] flex items-center gap-1.5 text-[#78716C]">
                      <FileCheck className="w-3 h-3 text-blue-500" />
                      <span className="truncate">Deep_Learning.pdf</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[#78716C]">
                  <span className="flex items-center gap-1 font-medium">
                    <ChevronRight className="w-3 h-3" />
                    <span>Module 2: Neural Nets</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Main Workspace Area */}
            <div className="col-span-8 p-4 space-y-4 bg-[#FFFDF9]">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917] font-['Plus_Jakarta_Sans']">Machine Learning Workspace</h3>
                  <p className="text-[11px] text-[#78716C]">CS229 Lecture 1 • 2 Resources • 12 Notes Generated</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>

              {/* 4 Feature Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C1917] flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-[#0D9488]" /> AI Notes</span>
                    <span className="text-[10px] text-[#0D9488]">10 Credits</span>
                  </div>
                  <p className="text-[11px] text-[#78716C] line-clamp-2">Structured notes with equations & key takeaways...</p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C1917] flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-blue-600" /> MCQ Quiz</span>
                    <span className="text-[10px] text-emerald-600 font-bold">10 Credits</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">10 MCQ Questions with evaluation & explanations.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C1917] flex items-center gap-1"><Brain className="w-3.5 h-3.5 text-purple-600" /> Flashcards</span>
                    <span className="text-[10px] text-purple-600">10 Credits</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">45 Flashcards with flip review & spaced repetition.</p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1C1917] flex items-center gap-1"><Bot className="w-3.5 h-3.5 text-[#0D9488]" /> RAG AI Tutor</span>
                    <span className="text-[10px] text-teal-600 font-bold">1 Credit / Msg</span>
                  </div>
                  <p className="text-[11px] text-[#78716C]">Ask any doubt with direct timestamp references.</p>
                </div>
              </div>

              {/* Credit Rates Info Bar */}
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0D9488]" />
                  <span className="font-semibold text-[#1C1917]">Credit Pricing:</span>
                  <span className="text-[#78716C]">1 ₹ = 10 Credits (500 free monthly credits)</span>
                </div>
                <span className="font-bold text-[#0D9488]">🔥 14-Day Streak</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
