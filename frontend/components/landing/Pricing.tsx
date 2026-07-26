"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Coins, ArrowRight, Bot, FileText, HelpCircle, Brain } from "lucide-react";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Free",
      priceMonthly: "₹0",
      priceYearly: "₹0",
      period: "forever",
      desc: "Perfect for exploring AI notes and trying out StudySpace.AI.",
      credits: "500 Credits / mo",
      popular: false,
      buttonText: "Start Free (500 Credits)",
      buttonHref: "/auth",
      features: [
        "500 Free Monthly Credits",
        "1 ₹ = 10 Credits Rate",
        "AI Chat starts at 1 credit / msg",
        "Notes/Quiz/Flashcards: 10 credits",
        "3 Course Workspaces",
        "Export to DOCX Document"
      ]
    },
    {
      name: "Pro ⭐",
      priceMonthly: "₹199",
      priceYearly: "₹159",
      period: "per month",
      desc: "Ideal for active university students and competitive exam prep.",
      credits: "3,000 Credits / mo",
      popular: true,
      buttonText: "Get 3,000 Credits",
      buttonHref: "/auth?plan=pro",
      features: [
        "3,000 Monthly Credits",
        "Equivalent to 3,000 AI Chat Queries",
        "OR 300 Full Note/Quiz/Flashcard Sets",
        "Unlimited Course Workspaces",
        "High-Speed AI RAG Indexing",
        "Spaced Repetition Flashcards",
        "Full Learning Streak Analytics",
        "Export to DOCX Document"
      ]
    },
    {
      name: "Power Learner",
      priceMonthly: "₹499",
      priceYearly: "₹399",
      period: "per month",
      desc: "For heavy academic workloads, research papers, and GATE/UPSC prep.",
      credits: "10,000 Credits / mo",
      popular: false,
      buttonText: "Get 10,000 Credits",
      buttonHref: "/auth?plan=premium",
      features: [
        "10,000 Monthly Credits",
        "Equivalent to 10,000 AI Chat Queries",
        "OR 1,000 Full AI Asset Generations",
        "Priority AI Processing Pipeline",
        "Unlimited Storage & Workspaces",
        "Access to Upcoming Features",
        "Dedicated Email Support",
        "Export to DOCX Document"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-[#FAF7F2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Simple Credit-Based Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            Pay Only for What You Use
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            Start with <strong>500 free monthly credits</strong>. Refill credits at an unbeatable rate of <strong>1 ₹ = 10 Credits</strong>.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${!isYearly ? "text-[#1C1917]" : "text-[#78716C]"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="w-12 h-6 rounded-full bg-[#E6E0D6] p-1 transition-colors relative flex items-center"
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#0D9488] transition-transform ${
                  isYearly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1 ${isYearly ? "text-[#1C1917]" : "text-[#78716C]"}`}>
              <span>Yearly</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        {/* ── Credit System Breakdown Banner ── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0D9488]/10 via-[#2563EB]/10 to-[#7C3AED]/10 border border-[#0D9488]/30 max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#0D9488]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#1C1917] font-['Plus_Jakarta_Sans']">How Credits Work</h3>
                <p className="text-xs text-[#78716C]">Simple, transparent consumption rate for all AI operations</p>
              </div>
            </div>
            <div className="bg-[#FFFDF9] px-4 py-2 rounded-2xl border border-[#0D9488]/30 text-xs font-bold text-[#0D9488] shadow-sm">
              1 ₹ = 10 Credits
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <Bot className="w-4 h-4 text-[#0D9488]" />
                <span>AI Tutor Chat</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">1 Credit</p>
              <p className="text-[11px] text-[#78716C]">Per query message</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>AI Notes</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">10 Credits</p>
              <p className="text-[11px] text-[#78716C]">Per resource generated</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>AI Quiz Bank</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">10 Credits</p>
              <p className="text-[11px] text-[#78716C]">Per 10 MCQ set</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] space-y-1">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <Brain className="w-4 h-4 text-purple-600" />
                <span>Smart Flashcards</span>
              </div>
              <p className="text-sm font-extrabold text-[#0D9488]">10 Credits</p>
              <p className="text-[11px] text-[#78716C]">Per flashcard deck</p>
            </div>
          </div>
        </div>

        {/* ── 3 Pricing Cards Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={idx}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? "bg-[#FFFDF9] border-2 border-[#0D9488] shadow-2xl scale-105 z-10"
                    : "bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0D9488] to-[#2563EB] text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Best Value Plan
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{plan.name}</h3>
                    <p className="text-xs text-[#78716C] mt-1 min-h-[36px]">{plan.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 pt-2 border-t border-[#E6E0D6]/80">
                    <span className="text-4xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">{price}</span>
                    <span className="text-xs text-[#78716C] font-medium">/{plan.period}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6E0D6] flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#78716C]">Credit Allowance:</span>
                    <span className="text-[#0D9488] font-bold">{plan.credits}</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#A8A29E]">Included Features</p>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-[#1C1917]">
                        <Check className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href={plan.buttonHref}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-center flex items-center justify-center gap-2 transition-all duration-200 ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white shadow-md hover:shadow-lg hover:from-[#0F766E] hover:to-[#115E59]"
                        : "bg-[#FAF7F2] border border-[#E6E0D6] text-[#1C1917] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
