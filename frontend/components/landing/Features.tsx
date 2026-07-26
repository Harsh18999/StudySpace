"use client";

import React, { useState } from "react";
import { 
  FolderKanban, DownloadCloud, FileText, HelpCircle, Brain, 
  Bot, BarChart3, Network, Cpu, CheckCircle2, RotateCw, Send, Sparkles, Clock
} from "lucide-react";

export function Features() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(0);
  const [chatLog, setChatLog] = useState([
    { sender: "user", text: "What is backpropagation in neural networks?" },
    { sender: "ai", text: "Backpropagation applies the calculus chain rule to calculate loss gradient with respect to each weight matrix (1 credit used)." }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLog((prev) => [
      ...prev,
      { sender: "user", text: chatInput },
      { sender: "ai", text: `Analyzing imported material for "${chatInput}"... Found 3 relevant lecture timestamps.` }
    ]);
    setChatInput("");
  };

  const llmProviders = [
    { name: "OpenAI GPT-4o", desc: "Default AI Engine" },
    { name: "Google Gemini 1.5 Pro", desc: "Upcoming" },
    { name: "Groq Llama-3", desc: "Upcoming" },
    { name: "OpenRouter API", desc: "Upcoming" },
    { name: "Ollama Local LLM", desc: "Upcoming" }
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-[#FAF7F2] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full border border-[#0D9488]/20">
            Comprehensive Suite
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans']">
            Everything You Need to Study Faster
          </h2>
          <p className="text-base sm:text-lg text-[#78716C]">
            Replace fragmented study tools with a unified AI learning platform built for retention and speed.
          </p>
        </div>

        {/* ── Features Grid (Glassmorphism Cards) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: Workspace Management */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">📂 Workspace Management</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Organize all your subjects, courses, and exam prep into dedicated workspaces with isolated study materials.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6] space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-white border border-[#E6E0D6] flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#0D9488]" /> Machine Learning</span>
                <span className="text-[10px] text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded-full">14 Items</span>
              </div>
              <div className="p-2 rounded-xl bg-white/60 border border-[#E6E0D6] flex items-center justify-between text-[#78716C]">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Database Management</span>
                <span className="text-[10px]">8 Items</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Import Anything */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <DownloadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">📥 Import Anything</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Seamlessly import YouTube playlists, lecture PDFs, research papers, or web links with instant transcript extraction.
              </p>
            </div>

            <div className="p-4 rounded-2xl border-2 border-dashed border-[#0D9488]/40 bg-[#0D9488]/5 text-center space-y-2">
              <DownloadCloud className="w-6 h-6 text-[#0D9488] mx-auto animate-bounce" />
              <p className="text-xs font-semibold text-[#1C1917]">Drag & Drop PDFs or Paste YouTube URL</p>
              <span className="text-[10px] text-[#78716C]">Supports .pdf, .docx, YouTube, arXiv</span>
            </div>
          </div>

          {/* Feature 3: AI Notes */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">📝 AI Structured Notes</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Automatic markdown notes with clear heading hierarchies, bullet summaries, and mathematical formulas (starts from 10 credits).
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6] text-xs font-mono text-[#1C1917] space-y-1">
              <p className="font-bold text-[#0D9488]"># Linear Regression</p>
              <p className="text-[11px] text-[#78716C] font-sans">Models relationship between input x and continuous scalar y.</p>
              <p className="text-[11px] text-[#0D9488] bg-white p-1.5 rounded border border-[#E6E0D6]">Cost: J(θ) = 1/2m ∑(h(x) - y)²</p>
            </div>
          </div>

          {/* Feature 4: AI Quiz Generator */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">❓ AI Quiz Generator</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Generate custom multiple-choice question quizzes to test your understanding before real exams (starts from 10 credits).
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6] space-y-2 text-xs">
              <p className="font-semibold text-[#1C1917]">Q: What is learning rate α?</p>
              <div className="space-y-1">
                {[
                  "Step size for weight optimization",
                  "Number of hidden layers",
                  "Dataset batch count"
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedQuizOpt(i)}
                    className={`w-full p-2 rounded-xl border text-left transition-colors flex items-center justify-between text-[11px] ${
                      selectedQuizOpt === i
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold"
                        : "bg-white border-[#E6E0D6] text-[#78716C]"
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedQuizOpt === i && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 5: Smart Flashcards */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">🧠 Smart Flashcards</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                1-click flashcard creation with animated flip review and spaced repetition algorithms (starts from 10 credits).
              </p>
            </div>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-4 rounded-2xl bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 text-center cursor-pointer hover:shadow-md transition-all flex flex-col items-center justify-center min-h-[110px]"
            >
              {!isFlipped ? (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-700">Question (Click to flip)</span>
                  <p className="text-xs font-bold text-[#1C1917]">What causes overfitting in ML?</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Answer</span>
                  <p className="text-xs font-semibold text-emerald-900">Excessive model capacity relative to data size.</p>
                </div>
              )}
              <RotateCw className="w-3.5 h-3.5 text-amber-600 mt-2" />
            </div>
          </div>

          {/* Feature 6: AI Tutor RAG Chat */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">💬 RAG AI Tutor</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Interactive chat with your study materials. Starts with 1 credit per message with direct timestamp references.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6] space-y-2 text-xs">
              <div className="space-y-1.5 max-h-[90px] overflow-y-auto pr-1">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl text-[11px] ${
                      msg.sender === "user"
                        ? "bg-[#0D9488] text-white ml-3"
                        : "bg-white border border-[#E6E0D6] text-[#1C1917]"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-1">
                <input
                  type="text"
                  placeholder="Ask AI tutor (1 credit)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white border border-[#E6E0D6] rounded-xl px-2 py-1 text-[11px] outline-none"
                />
                <button type="submit" className="px-2 py-1 bg-[#0D9488] text-white rounded-xl">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          {/* Feature 7: Progress Analytics */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] font-semibold">📊 Learning Analytics</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Track study streaks, completion rates, performance reports, and daily hour logs.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6] space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-[#1C1917]">
                <span>Accuracy Rate</span>
                <span className="text-[#0D9488]">94.2%</span>
              </div>
              <div className="w-full h-2 bg-[#E6E0D6] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0D9488] to-cyan-500 w-[94%]" />
              </div>
              <div className="flex justify-between text-[10px] text-[#78716C] pt-1">
                <span>🔥 14-Day Streak</span>
                <span>Updated Today</span>
              </div>
            </div>
          </div>

          {/* Feature 8: Concept Knowledge Graph (UPCOMING) */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between opacity-90 relative">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Upcoming Feature
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] font-semibold">🕸 Concept Knowledge Graph</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Visualize connected concepts across lectures and see how topics interlink automatically (Coming soon).
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6] relative h-28 flex items-center justify-center overflow-hidden">
              <div className="flex items-center gap-3 relative z-10 text-[10px] font-bold opacity-60">
                <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Supervised</span>
                <span className="px-2 py-1 rounded-full bg-[#0D9488] text-white">Neural Nets</span>
                <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">Gradient</span>
              </div>
            </div>
          </div>

          {/* Feature 9: Multi-LLM Support (UPCOMING) */}
          <div className="p-6 rounded-3xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between opacity-90 relative">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Upcoming Feature
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] font-semibold">🤖 Multi-LLM Support</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Switch dynamically between OpenAI, Gemini, Groq, OpenRouter, or run locally with Ollama (Coming soon).
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {llmProviders.map((llm, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                    idx === 0
                      ? "bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/30"
                      : "bg-[#FAF7F2] text-[#A8A29E] border-[#E6E0D6]"
                  }`}
                >
                  {llm.name} {idx > 0 && "(Soon)"}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
