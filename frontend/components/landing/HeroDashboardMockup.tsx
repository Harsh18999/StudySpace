"use client";

import React, { useState } from "react";
import { 
  BarChart2, LayoutGrid, FileQuestion, CreditCard, Settings, 
  Search, Plus, ChevronDown, ChevronRight, Video, FileCheck, 
  Sparkles, CheckCircle2, Zap, Flame, Send, Coins, Bell, HelpCircle, Brain, Bot
} from "lucide-react";

export function HeroDashboardMockup() {
  const [activeTab, setActiveTab] = useState("notes");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState([
    { sender: "ai", text: "Hello! I am your RAG AI Tutor trained on Stanford CS229. What concept would you like to review?" },
    { sender: "user", text: "Explain gradient descent in simple terms." },
    { sender: "ai", text: "Gradient descent is like finding the fastest way down a foggy mountain. By calculating the steepest slope J(θ), you step downward until you reach minimal loss (1 credit used)." }
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLog((prev) => [
      ...prev,
      { sender: "user", text: chatMessage },
      { sender: "ai", text: `Analyzing resource for "${chatMessage}"... Key takeaway: Linear regression optimizes parameters with step size alpha = 0.01.` }
    ]);
    setChatMessage("");
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      
      {/* ── Floating Status Cards around mockup ── */}
      <div className="hidden lg:block">
        <div className="absolute -top-6 -left-8 z-30 bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl p-3 shadow-xl flex items-center gap-3 animate-bounce duration-[4000ms]">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1917]">AI Notes Generated</p>
            <p className="text-[10px] text-[#78716C]">15 Credits Used • 12 Sections</p>
          </div>
        </div>

        <div className="absolute -top-8 -right-6 z-30 bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl p-3 shadow-xl flex items-center gap-3 animate-pulse duration-[3500ms]">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1917]">120 Flashcards Ready</p>
            <p className="text-[10px] text-[#78716C]">Spaced Repetition Active</p>
          </div>
        </div>

        <div className="absolute top-1/2 -right-12 -translate-y-1/2 z-30 bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl p-3 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1917]">Quiz Score 92%</p>
            <p className="text-[10px] text-emerald-600 font-semibold">+14% vs Last Session</p>
          </div>
        </div>

        <div className="absolute -bottom-6 -left-6 z-30 bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl p-3 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1917]">Credit System</p>
            <p className="text-[10px] text-[#78716C]">1 ₹ = 10 Credits • Chat: 1 credit</p>
          </div>
        </div>

        <div className="absolute -bottom-6 -right-4 z-30 bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl p-3 shadow-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1C1917]">14-Day Streak</p>
            <p className="text-[10px] text-[#78716C]">🔥 Best Record Yet!</p>
          </div>
        </div>
      </div>

      {/* ── Main Window Frame ── */}
      <div className="relative rounded-3xl border border-[#E6E0D6] bg-[#FFFDF9] shadow-2xl overflow-hidden">
        
        {/* Browser Header Bar */}
        <div className="h-10 bg-[#FAF7F2] border-b border-[#E6E0D6] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-xs text-[#78716C] font-mono">studyspace.ai/dashboard/space/machine-learning</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#78716C]">
            <div className="flex items-center gap-1.5 bg-[#0D9488]/10 text-[#0D9488] px-2.5 py-0.5 rounded-full font-semibold border border-[#0D9488]/20">
              <Coins className="w-3.5 h-3.5" />
              <span>500 Credits</span>
            </div>
            <Bell className="w-4 h-4 cursor-pointer hover:text-[#1C1917]" />
            <div className="w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-bold text-[10px]">
              H
            </div>
          </div>
        </div>

        {/* ── REAL DUAL-SIDEBAR DASHBOARD LAYOUT ── */}
        <div className="grid grid-cols-12 min-h-[580px]">
          
          {/* 1. Dark Icon Sidebar */}
          <div className="col-span-1 bg-[#1C1917] text-[#A8A29E] flex flex-col items-center py-4 justify-between border-r border-[#2E2A27]">
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold text-sm shadow-md">
                S
              </div>

              <div className="flex flex-col gap-3 w-full px-2">
                <button className="p-2.5 rounded-xl bg-[#0D9488]/20 text-[#0D9488] flex items-center justify-center transition-colors">
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-[#2E2A27] hover:text-white flex items-center justify-center transition-colors">
                  <BarChart2 className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-[#2E2A27] hover:text-white flex items-center justify-center transition-colors">
                  <FileQuestion className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-xl hover:bg-[#2E2A27] hover:text-white flex items-center justify-center transition-colors">
                  <CreditCard className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button className="p-2.5 rounded-xl hover:bg-[#2E2A27] hover:text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Light Module Sidebar */}
          <div className="col-span-3 border-r border-[#E6E0D6] bg-[#FAF7F2] p-3.5 space-y-4 text-xs">
            
            {/* Space Name */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                <span className="font-bold text-[#1C1917] text-sm truncate font-['Plus_Jakarta_Sans']">Machine Learning</span>
              </div>
              <Plus className="w-4 h-4 text-[#78716C] cursor-pointer hover:text-[#1C1917]" />
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A8A29E]" />
              <input
                type="text"
                readOnly
                value="Search resources..."
                className="w-full bg-white border border-[#E6E0D6] rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-[#A8A29E]"
              />
            </div>

            {/* Modules List Accordion */}
            <div className="space-y-3 pt-1">
              
              {/* Module 1 (Expanded) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-[#1C1917] text-[11px] px-1">
                  <span className="flex items-center gap-1">
                    <ChevronDown className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Module 1: Foundations</span>
                  </span>
                  <span className="text-[10px] text-[#A8A29E]">2 Items</span>
                </div>

                <div className="pl-4 space-y-1">
                  <div className="p-2 rounded-xl bg-white border border-[#0D9488]/40 shadow-sm flex items-center gap-2 text-[#0D9488] font-semibold">
                    <Video className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span className="truncate text-[11px]">CS229: Lecture 1</span>
                    <CheckCircle2 className="w-3 h-3 ml-auto text-emerald-600" />
                  </div>

                  <div className="p-2 rounded-xl bg-[#FFFDF9] border border-[#E6E0D6] hover:bg-white flex items-center gap-2 text-[#78716C]">
                    <FileCheck className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                    <span className="truncate text-[11px]">Deep_Learning.pdf</span>
                  </div>
                </div>
              </div>

              {/* Module 2 */}
              <div className="flex items-center justify-between text-[#78716C] text-[11px] px-1 py-1 rounded-lg hover:bg-[#F5EFE6]">
                <span className="flex items-center gap-1 font-medium">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Module 2: Supervised Learning</span>
                </span>
                <span className="text-[10px] text-[#A8A29E]">4 Items</span>
              </div>

              {/* Module 3 */}
              <div className="flex items-center justify-between text-[#78716C] text-[11px] px-1 py-1 rounded-lg hover:bg-[#F5EFE6]">
                <span className="flex items-center gap-1 font-medium">
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Module 3: Neural Networks</span>
                </span>
                <span className="text-[10px] text-[#A8A29E]">3 Items</span>
              </div>

            </div>

          </div>

          {/* 3. Main Content Workspace Area */}
          <div className="col-span-8 lg:col-span-5 p-4 space-y-4 bg-[#FFFDF9] overflow-y-auto max-h-[600px]">
            
            {/* Header Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
              <div>
                <h2 className="text-base font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">
                  Stanford CS229: Lecture 1
                </h2>
                <p className="text-[11px] text-[#78716C]">Imported YouTube Video • 1h 14m transcript processed</p>
              </div>

              <button className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0D9488] text-white shadow-sm flex items-center gap-1 hover:bg-[#0F766E]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Asset (10 Cr)</span>
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex items-center gap-2 border-b border-[#E6E0D6] pb-2 text-xs font-semibold text-[#78716C]">
              <button
                onClick={() => setActiveTab("notes")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === "notes" ? "bg-[#0D9488] text-white shadow-sm" : "hover:bg-[#F5EFE6]"
                }`}
              >
                📝 AI Notes
              </button>
              <button
                onClick={() => setActiveTab("quiz")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === "quiz" ? "bg-[#0D9488] text-white shadow-sm" : "hover:bg-[#F5EFE6]"
                }`}
              >
                ❓ Quiz Bank (92%)
              </button>
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === "flashcards" ? "bg-[#0D9488] text-white shadow-sm" : "hover:bg-[#F5EFE6]"
                }`}
              >
                🧠 Smart Flashcards
              </button>
            </div>

            {/* Tab Panel Content */}
            {activeTab === "notes" && (
              <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-2">
                  <h3 className="font-bold text-[#1C1917]">Section 1: Supervised Learning Foundations</h3>
                  <span className="text-[10px] text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded-full font-semibold">15 Credits Used</span>
                </div>
                <div className="space-y-2 text-[#78716C] leading-relaxed">
                  <p className="font-semibold text-[#0D9488]">Key Takeaways:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-[#1C1917]">Supervised Learning:</strong> Maps input vectors to output labels (x, y).</li>
                    <li><strong className="text-[#1C1917]">Cost Function:</strong> Minimizes mean squared error J(θ) = 1/2m ∑ (h(x) - y)².</li>
                    <li><strong className="text-[#1C1917]">Gradient Step:</strong> θ := θ - α ∇J(θ) (learning rate α = 0.01).</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "quiz" && (
              <div className="p-4 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1C1917]">Question 3 of 10</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Score: 92%</span>
                </div>
                <p className="font-medium text-[#1C1917]">What is the primary role of the learning rate α in gradient descent?</p>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-900 font-medium flex items-center justify-between">
                    <span>A. Controls step size during weight parameter updates</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="p-2.5 rounded-xl border border-[#E6E0D6] bg-white text-[#78716C]">
                    <span>B. Determines total training epoch iterations</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "flashcards" && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 text-center space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-purple-700">Flashcard 4 / 45</span>
                <p className="font-bold text-[#1C1917]">What is overfitting and how do you prevent it?</p>
                <p className="text-[11px] text-[#78716C]">Click to flip card & review answer</p>
              </div>
            )}

            {/* Credit System Info Banner */}
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#0D9488]" />
                <span className="font-bold text-[#1C1917]">Credit Rate:</span>
                <span className="text-[#78716C]">1 ₹ = 10 Credits (500 credits on signup)</span>
              </div>
              <span className="font-bold text-[#0D9488]">Chat: 1 Cr • Asset: 10 Cr</span>
            </div>

          </div>

          {/* 4. Right RAG AI Chat Drawer Panel */}
          <div className="hidden lg:col-span-3 border-l border-[#E6E0D6] bg-[#FFFDF9] p-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E6E0D6]">
                <Bot className="w-4 h-4 text-[#0D9488]" />
                <span className="font-bold text-xs text-[#1C1917]">RAG AI Tutor</span>
                <span className="ml-auto text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-semibold">1 Cr / Msg</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto scroll-thin pr-1 text-xs">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl ${
                      msg.sender === "user"
                        ? "bg-[#0D9488] text-white ml-4 shadow-sm"
                        : "bg-[#FAF7F2] border border-[#E6E0D6] text-[#1C1917] mr-2"
                    }`}
                  >
                    <p className="text-[11px] leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="pt-2 border-t border-[#E6E0D6] flex gap-1.5">
              <input
                type="text"
                placeholder="Ask AI Tutor (1 credit)..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-[#FAF7F2] border border-[#E6E0D6] rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#0D9488]"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-[#0D9488] text-white flex items-center justify-center hover:bg-[#0F766E] transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
