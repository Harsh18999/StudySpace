"use client";

import React from "react";
import { DownloadCloud, Sparkles, FileCheck, BrainCircuit } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Import Resources",
      desc: "Upload YouTube playlists, PDFs, research papers, or web articles.",
      icon: DownloadCloud,
      bullets: ["YouTube Transcripts", "Multi-Page PDFs", "Web Articles"],
      gradient: "from-red-500 to-amber-500"
    },
    {
      number: "02",
      title: "AI Processing",
      desc: "Fetch transcript, chunk content, generate embeddings & store vectors.",
      icon: Sparkles,
      bullets: ["Recursive Chunking", "Vector Indexing", "RAG Embeddings"],
      gradient: "from-amber-500 to-emerald-500"
    },
    {
      number: "03",
      title: "Generate Material",
      desc: "Instant creation of structured notes, MCQ quizzes & flashcards.",
      icon: FileCheck,
      bullets: ["Markdown Notes", "MCQ Quizzes", "Flashcards"],
      gradient: "from-emerald-500 to-cyan-500"
    },
    {
      number: "04",
      title: "Learn Smarter",
      desc: "Chat with AI tutor, revise flashcards, & track daily streak progress.",
      icon: BrainCircuit,
      bullets: ["Interactive AI Chat", "Revision Mode", "Analytics Tracking"],
      gradient: "from-cyan-500 to-purple-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-[#FFFDF9] border-y border-[#E6E0D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            How StudySpace.AI Transforms Your Learning
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            From raw input to complete exam readiness in under 60 seconds.
          </p>
        </div>

        {/* ── Steps Timeline Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#A8A29E] font-mono">{step.number}</span>
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${step.gradient} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{step.title}</h3>
                  <p className="text-xs text-[#78716C] mt-2 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-4 border-t border-[#E6E0D6]/80 space-y-1.5">
                  {step.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-[#1C1917]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
