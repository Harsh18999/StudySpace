"use client";

import React, { useState } from "react";
import { 
  FileCode2, Sparkles, Database, Cpu, FileText, HelpCircle, 
  Brain, Bot, ArrowRight, CheckCircle2, ChevronRight
} from "lucide-react";

export function InteractiveWorkflow() {
  const [activeStep, setActiveStep] = useState(2);

  const pipelineSteps = [
    {
      step: "01",
      title: "Raw Input",
      desc: "YouTube Video / PDF",
      icon: FileCode2,
      color: "from-red-500 to-amber-500",
      details: "Fetches full length audio transcript, extracts clean text from multi-page PDFs or web articles."
    },
    {
      step: "02",
      title: "Smart Chunking",
      desc: "Semantic Text Splitter",
      icon: Sparkles,
      color: "from-amber-500 to-emerald-500",
      details: "Chunks material by topic boundaries maintaining full context window coherence."
    },
    {
      step: "03",
      title: "Embeddings",
      desc: "Vector Encoding",
      icon: Cpu,
      color: "from-emerald-500 to-cyan-500",
      details: "Generates high-dimensional vector embeddings with OpenAI text-embedding-3 model."
    },
    {
      step: "04",
      title: "Vector DB",
      desc: "Pinecone / Vector Index",
      icon: Database,
      color: "from-cyan-500 to-blue-500",
      details: "Stores dense vector indices allowing ultra-fast similarity search retrieval."
    },
    {
      step: "05",
      title: "LLM Processing",
      desc: "Multi-Model Orchestration",
      icon: Cpu,
      color: "from-blue-500 to-purple-500",
      details: "Synthesizes data through GPT-4o, Gemini 1.5 Pro, or Groq Llama3 models."
    }
  ];

  const outputCards = [
    { title: "Structured Notes", icon: FileText, desc: "Summaries & equations", tag: "Markdown" },
    { title: "MCQ Quizzes", icon: HelpCircle, desc: "Instant test evaluation", tag: "10-20 Qs" },
    { title: "Smart Flashcards", icon: Brain, desc: "Spaced repetition system", tag: "Memory Deck" },
    { title: "Interactive AI Tutor", icon: Bot, desc: "RAG chat with source citations", tag: "Live Chat" }
  ];

  return (
    <section id="workflow" className="py-20 md:py-28 bg-[#FFFDF9] border-b border-[#E6E0D6] relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-teal-300/10 via-blue-300/10 to-purple-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            End-to-End AI Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            How StudySpace.AI Powers Your Learning
          </h2>
          <p className="text-base text-[#78716C]">
            Watch raw educational content transform into structured study assets in seconds through our advanced RAG pipeline.
          </p>
        </div>

        {/* ── Interactive Horizontal Pipeline Diagram ── */}
        <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#E6E0D6] shadow-md space-y-8">
          
          {/* Timeline Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {pipelineSteps.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeStep === idx;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-white border-[#0D9488] shadow-lg scale-105"
                      : "bg-[#FFFDF9] border-[#E6E0D6] hover:border-[#0D9488]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-[#A8A29E]">{item.step}</span>
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{item.title}</h3>
                  <p className="text-[11px] text-[#78716C] mt-0.5">{item.desc}</p>

                  {/* Active Indicator Pulse */}
                  {isActive && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#0D9488]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active Step</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Step Details Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6E0D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">
                Pipeline Step {pipelineSteps[activeStep].step}: {pipelineSteps[activeStep].title}
              </span>
              <p className="text-sm font-medium text-[#1C1917] mt-1">
                {pipelineSteps[activeStep].details}
              </p>
            </div>
            <button
              onClick={() => setActiveStep((prev) => (prev + 1) % pipelineSteps.length)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0D9488] text-white hover:bg-[#0F766E] transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Output Arrow Banner */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#0D9488]/10 via-[#2563EB]/10 to-[#7C3AED]/10 text-xs font-bold text-[#1C1917] border border-[#0D9488]/20">
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
              <span>Generates 4 Instant Learning Formats</span>
              <ArrowRight className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>

          {/* 4 Output Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {outputCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded-full">
                      {card.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1C1917]">{card.title}</h4>
                  <p className="text-xs text-[#78716C] mt-1">{card.desc}</p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
