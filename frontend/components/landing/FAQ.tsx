"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does AI generate notes?",
      a: "StudySpace.AI extracts transcripts from YouTube videos or full text from PDFs. It processes content through semantic chunking, generates embeddings, and passes relevant context into advanced LLMs to produce structured Markdown notes with headings, summaries, LaTeX math formulas, and key takeaways."
    },
    {
      q: "Can I upload PDFs and research papers?",
      a: "Yes! You can drag-and-drop PDFs, textbooks, arXiv research papers, or exported lecture slides. Our engine automatically parses text, tables, and code snippets into your workspace."
    },
    {
      q: "Does it support YouTube playlists?",
      a: "Yes, you can import individual YouTube video URLs or entire course playlists. The AI processes each lecture in parallel and organizes notes chronologically within your course workspace."
    },
    {
      q: "What are credits and how do they work?",
      a: "Credits power AI processing actions. Free accounts receive 500 monthly credits. Credits can be refilled at a rate of 1 ₹ = 10 Credits. AI Tutor Chat messages cost 1 credit per message, while generating Notes, MCQ Quizzes, or Flashcard decks cost 10 credits each."
    },
    {
      q: "Can I export my study materials to Microsoft Word?",
      a: "Yes! You can export your structured AI notes directly into formatted .docx Word documents with 1-click."
    },
    {
      q: "Which AI models are supported?",
      a: "Currently, StudySpace.AI uses OpenAI GPT-4o for high precision reasoning and RAG answers. Multi-model support (Gemini 1.5 Pro, Groq, Ollama) will be released in an upcoming update."
    }
  ];

  return (
    <section id="faq" className="py-20 md:py-32 bg-[#FAF7F2] border-b border-[#E6E0D6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#78716C]">
            Everything you need to know about StudySpace.AI.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#1C1917] font-['Plus_Jakarta_Sans'] hover:text-[#0D9488] transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#0D9488] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-[#78716C] transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0D9488]" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#78716C] leading-relaxed border-t border-[#E6E0D6]/60 bg-[#FAF7F2]/40 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
