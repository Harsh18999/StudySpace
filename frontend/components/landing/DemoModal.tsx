"use client";

import React, { useState } from "react";
import { X, Play, CheckCircle2, Sparkles, FileText, Brain, HelpCircle, Bot } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      title: "1. Resource Import",
      desc: "Paste YouTube link or drag-and-drop research paper PDF",
      icon: FileText,
      tag: "Input Stage",
      content: (
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E6E0D6] space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E6E0D6] shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">YT</div>
            <div className="flex-1 text-xs">
              <p className="font-semibold text-[#1C1917]">Stanford CS229: Machine Learning Lecture 1</p>
              <p className="text-[#78716C]">youtube.com/watch?v=jGwO_E45068</p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Transcript Ready</span>
          </div>
          <div className="flex items-center justify-center p-6 border-2 border-dashed border-[#0D9488]/40 rounded-xl bg-[#0D9488]/5">
            <p className="text-xs text-[#0D9488] font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" /> Deep Learning_Paper.pdf (4.2 MB) Analyzed
            </p>
          </div>
        </div>
      )
    },
    {
      title: "2. AI Processing Pipeline",
      desc: "Automatic chunking, vector embeddings, & RAG indexing",
      icon: Sparkles,
      tag: "AI Engine",
      content: (
        <div className="bg-[#1C1917] text-white p-5 rounded-2xl space-y-3 font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> [0.2s] Extracting YouTube Transcript (24,510 tokens)
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> [0.6s] Recursive Character Text Splitter (chunk_size=1000)
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <CheckCircle2 className="w-4 h-4" /> [1.1s] Generating OpenAI text-embedding-3-small vectors
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <CheckCircle2 className="w-4 h-4" /> [1.8s] Stored in Pinecone Vector DB (324 vectors indexed)
          </div>
          <div className="flex items-center gap-2 text-amber-400 animate-pulse">
            <Sparkles className="w-4 h-4" /> [2.4s] Generating Notes, MCQ Quizzes & Flashcards...
          </div>
        </div>
      )
    },
    {
      title: "3. Interactive Output",
      desc: "Structured notes, instant quizzes, smart flashcards & AI Tutor",
      icon: Brain,
      tag: "Result",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-xl border border-[#E6E0D6] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] mb-1">
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#0D9488]" /> Structured Notes</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Markdown</span>
            </div>
            <p className="text-[11px] text-[#78716C] line-clamp-3"># Supervised Learning\nModel mapping input x to output y. Linear regression calculates gradient vectors...</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E6E0D6] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] mb-1">
              <span className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" /> AI Quiz</span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">10 MCQs</span>
            </div>
            <p className="text-[11px] font-medium text-[#1C1917]">Q: What is loss function minimization?</p>
            <span className="inline-block text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded mt-1">Score: 92%</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E6E0D6] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] mb-1">
              <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-[#7C3AED]" /> Smart Flashcards</span>
              <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">45 Cards</span>
            </div>
            <p className="text-[11px] text-[#78716C]">Flip to review terms, spaced repetition enabled.</p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#E6E0D6] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] mb-1">
              <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-[#0D9488]" /> RAG AI Tutor</span>
              <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">1 Cr / Msg</span>
            </div>
            <p className="text-[11px] text-[#78716C]">Ask any question with direct timestamp & page citations.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FFFDF9] rounded-3xl border border-[#E6E0D6] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E0D6] bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0D9488] flex items-center justify-center text-white">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1C1917] font-['Plus_Jakarta_Sans']">StudySpace.AI Interactive Demo</h3>
              <p className="text-xs text-[#78716C]">See how raw materials transform into structured mastery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5EFE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          
          {/* Step Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {demoSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded-2xl text-left border transition-all text-xs font-medium flex flex-col gap-1 ${
                    isActive
                      ? "bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488] shadow-sm"
                      : "bg-[#FAF7F2] border-[#E6E0D6] text-[#78716C] hover:border-[#0D9488]/40"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Icon className="w-3.5 h-3.5" /> {step.title}
                  </span>
                  <span className="text-[10px] opacity-80 line-clamp-1">{step.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#1C1917]">{demoSteps[activeStep].title}</h4>
              <span className="text-[11px] font-semibold text-[#0D9488] bg-[#0D9488]/10 px-2.5 py-0.5 rounded-full border border-[#0D9488]/20">
                {demoSteps[activeStep].tag}
              </span>
            </div>
            {demoSteps[activeStep].content}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FAF7F2] border-t border-[#E6E0D6]">
          <span className="text-xs text-[#78716C]">Step {activeStep + 1} of 3</span>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : 2))}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E6E0D6] bg-white hover:bg-[#F5EFE6]"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep((prev) => (prev < 2 ? prev + 1 : 0))}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0D9488] text-white hover:bg-[#0F766E]"
            >
              {activeStep === 2 ? "Replay Demo" : "Next Step"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
