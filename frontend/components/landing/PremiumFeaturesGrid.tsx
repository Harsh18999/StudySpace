"use client";

import React from "react";
import { 
  Clock, Network, AlertTriangle, Calendar, Repeat, FileDown, 
  FileCode, Layers, Users, Key, Cpu, BarChart3
} from "lucide-react";

export function PremiumFeaturesGrid() {
  const premiumFeatures = [
    {
      title: "Timestamp Citations",
      desc: "Every AI response links directly back to exact video timestamp or document page.",
      icon: Clock,
      status: "ready",
      tag: "Source Verified"
    },
    {
      title: "Export DOCX",
      desc: "Download beautifully formatted Word document study guides with TOC and section numbers.",
      icon: FileDown,
      status: "ready",
      tag: "1-Click Download"
    },
    {
      title: "Revision Mode",
      desc: "High-intensity flashcard sessions optimized using spaced repetition memory algorithms.",
      icon: Repeat,
      status: "ready",
      tag: "Active Memory"
    },
    {
      title: "Analytics Dashboard",
      desc: "Real-time performance metrics, credit usage logs, and study streak tracking.",
      icon: BarChart3,
      status: "ready",
      tag: "Deep Metrics"
    },
    {
      title: "Knowledge Graph",
      desc: "Automatically maps interconnections between concepts across all course modules.",
      icon: Network,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Weak Topic Detection",
      desc: "Identifies concepts where quiz scores drop and schedules targeted revision.",
      icon: AlertTriangle,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Study Planner",
      desc: "Auto-generates customized daily study schedules leading up to exam dates.",
      icon: Calendar,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Export Markdown",
      desc: "Seamlessly export generated notes to Obsidian, Notion, Logseq, or VS Code.",
      icon: FileCode,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Export Anki Deck",
      desc: "Export flashcards directly into .apkg format with question front & back.",
      icon: Layers,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Collaborative Workspaces",
      desc: "Share workspaces with classmates & study groups for real-time study sessions.",
      icon: Users,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Bring Your Own Key",
      desc: "Plug in your custom OpenAI, Anthropic, or Groq API keys directly.",
      icon: Key,
      status: "upcoming",
      tag: "Upcoming"
    },
    {
      title: "Multi-LLM Support",
      desc: "Switch dynamically between Claude 3.5, GPT-4o, Gemini 1.5 Pro, and Llama 3.",
      icon: Cpu,
      status: "upcoming",
      tag: "Upcoming"
    }
  ];

  return (
    <section className="py-20 md:py-32 bg-[#FFFDF9] border-b border-[#E6E0D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Platform Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            Current & Upcoming Capabilities
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            Explore our core study tools alongside upcoming features currently in development.
          </p>
        </div>

        {/* 12 Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            const isUpcoming = feat.status === "upcoming";

            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl border shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isUpcoming
                    ? "bg-[#FFFDF9]/60 border-[#E6E0D6] opacity-85"
                    : "bg-[#FAF7F2] border-[#E6E0D6] hover:shadow-lg hover:border-[#0D9488]/40 hover:-translate-y-1"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      isUpcoming
                        ? "bg-amber-100 text-amber-700"
                        : "bg-[#0D9488]/10 text-[#0D9488]"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isUpcoming
                        ? "text-amber-800 bg-amber-100 border-amber-300"
                        : "text-[#0D9488] bg-[#0D9488]/10 border-[#0D9488]/20"
                    }`}>
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{feat.title}</h3>
                  <p className="text-xs text-[#78716C] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
