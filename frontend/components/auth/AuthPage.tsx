"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import {
  Brain,
  Zap,
  Trophy,
  BarChart3,
  Layers,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

type Tab = "signin" | "signup" | "forgot";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "545683132846-qbn32rcrvbh9r6mhhpcu44igouolhnuq.apps.googleusercontent.com";

const features = [
  { icon: <BarChart3 className="w-4 h-4" />, title: "Track Progress", desc: "Visual learning analytics", color: "bg-[#0D9488]/10 text-[#0D9488]" },
  { icon: <Brain className="w-4 h-4" />, title: "AI-Powered Notes", desc: "Smart auto-generated notes", color: "bg-teal-100 text-teal-800" },
  { icon: <Layers className="w-4 h-4" />, title: "Flashcards", desc: "Spaced repetition learning", color: "bg-purple-100 text-purple-800" },
  { icon: <Trophy className="w-4 h-4" />, title: "Certificates", desc: "Earn on completion", color: "bg-amber-100 text-amber-800" },
  { icon: <Zap className="w-4 h-4" />, title: "Quizzes", desc: "Test your knowledge", color: "bg-emerald-100 text-emerald-800" },
];

export function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const router = useRouter();

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex overflow-hidden relative bg-[#FAF7F2]">
        {/* ── Background Blobs & Grid Pattern ── */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#0D9488]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-300/15 rounded-full blur-3xl pointer-events-none" />

        {/* ── Left branding panel ── */}
        <div className="hidden lg:flex flex-col justify-between w-[42%] relative z-10 p-10 xl:p-14 border-r border-[#E6E0D6] bg-[#FAF7F2]/60 backdrop-blur-sm">
          
          {/* Top Row: Back to Home + Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFDF9] border border-[#E6E0D6] text-xs font-bold text-[#1C1917] hover:text-[#0D9488] hover:border-[#0D9488]/40 transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 text-[#0D9488] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </Link>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0D9488] via-[#2563EB] to-[#7C3AED] p-0.5 shadow-sm">
                <div className="w-full h-full bg-[#FAF7F2] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                </div>
              </div>
              <span className="text-base font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] tracking-tight">
                StudySpace<span className="text-[#0D9488]">.AI</span>
              </span>
            </Link>
          </motion.div>

          {/* Hero copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex flex-col gap-6"
          >
            <div>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-[#1C1917] font-['Plus_Jakarta_Sans'] leading-tight tracking-tight">
                Learn Smarter,{" "}
                <span className="gradient-heading">Build Faster</span>
              </h1>
              <p className="mt-4 text-base text-[#78716C] leading-relaxed max-w-sm">
                Organize your learning with videos, quizzes, notes, resources, and
                flashcards — all in one beautiful place.
              </p>
            </div>

            {/* Floating icons row */}
            <div className="flex gap-3 flex-wrap">
              {["📚", "🎥", "📝", "🧠", "⚡", "🏆"].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="w-11 h-11 rounded-2xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm flex items-center justify-center text-lg cursor-default select-none"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 gap-2.5 mt-2">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.09 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFFDF9] border border-[#E6E0D6] shadow-sm"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917] font-['Plus_Jakarta_Sans']">{f.title}</div>
                    <div className="text-xs text-[#78716C]">{f.desc}</div>
                  </div>
                  <motion.div
                    className="ml-auto w-2 h-2 rounded-full bg-[#0D9488]"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-[#78716C]"
          >
            © {new Date().getFullYear()} StudySpace AI. Built for learners.
          </motion.p>
        </div>

        {/* ── Right auth panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6 lg:p-10">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md"
          >
            {/* Top Back to Home Button for Mobile/Tablet */}
            <div className="flex lg:hidden items-center justify-between mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78716C] hover:text-[#0D9488] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#0D9488]" />
                <span>Back to Home</span>
              </Link>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
                <span className="font-bold text-sm text-[#1C1917]">StudySpace<span className="text-[#0D9488]">.AI</span></span>
              </div>
            </div>

            {/* Glass Card */}
            <div className="bg-[#FFFDF9] rounded-3xl border border-[#E6E0D6] shadow-xl p-8 space-y-6">
              {/* Tab switcher */}
              {tab !== "forgot" && (
                <div className="flex gap-1 p-1 bg-[#FAF7F2] border border-[#E6E0D6] rounded-2xl mb-2">
                  {(["signin", "signup"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        tab === t
                          ? "bg-[#0D9488] text-white shadow-sm"
                          : "text-[#78716C] hover:text-[#1C1917]"
                      }`}
                    >
                      {t === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>
              )}

              {/* Animated form content */}
              <AnimatePresence mode="wait">
                {tab === "signin" && (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <SignInForm onForgot={() => setTab("forgot")} onSignUp={() => setTab("signup")} />
                  </motion.div>
                )}
                {tab === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <SignUpForm onSignIn={() => setTab("signin")} />
                  </motion.div>
                )}
                {tab === "forgot" && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ForgotPasswordForm onBack={() => setTab("signin")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
