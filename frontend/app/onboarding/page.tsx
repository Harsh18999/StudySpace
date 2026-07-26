"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Zap,
  Bell,
  User,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/useStore";

const INTERESTS = [
  "Web Development",
  "Machine Learning",
  "Data Science",
  "Mobile Apps",
  "DevOps",
  "Cybersecurity",
  "UI/UX Design",
  "System Design",
  "Algorithms",
  "Cloud Computing",
];

const LEARNING_STYLES = [
  { id: "visual", emoji: "🎥", label: "Visual", desc: "Videos and diagrams" },
  { id: "reading", emoji: "📖", label: "Reading", desc: "Articles and notes" },
  { id: "practice", emoji: "💻", label: "Hands-on", desc: "Projects and coding" },
  { id: "quiz", emoji: "🧠", label: "Quizzes", desc: "Tests and challenges" },
];

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "interests", label: "Interests" },
  { id: "style", label: "Learning Style" },
  { id: "notifications", label: "Notifications" },
  { id: "profile", label: "Profile" },
];

export default function OnboardingPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState("");
  const [notifications, setNotifications] = useState(true);

  const toggleInterest = (i: string) => {
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const finish = () => {
    localStorage.setItem("onboarding_done", "true");
    router.push("/dashboard");
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                  i < step
                    ? "bg-indigo-600 text-white"
                    : i === step
                    ? "bg-white border-2 border-indigo-600 text-indigo-600"
                    : "bg-white/60 border border-slate-200 text-slate-400"
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-slate-200">
                  <motion.div
                    className="h-full bg-indigo-500"
                    animate={{ width: i < step ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-xl shadow-indigo-100/40 p-8">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div key="welcome" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col items-center gap-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-200"
                >
                  <BookOpen className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900">Welcome, {firstName}! 🎉</h1>
                  <p className="text-slate-500 mt-2 leading-relaxed">
                    Let&apos;s personalize StudySpace for you. This only takes a minute.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-sm">
                  {["📚 Videos", "🧠 AI Notes", "🃏 Flashcards", "❓ Quizzes"].map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium">{t}</span>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
                  Get Started <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Step 1: Interests */}
            {step === 1 && (
              <motion.div key="interests" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">What do you want to learn?</h2>
                  <p className="text-slate-500 text-sm mt-1">Select all that interest you</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => {
                    const sel = selectedInterests.includes(interest);
                    return (
                      <motion.button
                        key={interest}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          sel ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200" : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        {sel && <Check className="w-3 h-3 inline mr-1" />}
                        {interest}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">← Back</button>
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Continue →</button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Learning style */}
            {step === 2 && (
              <motion.div key="style" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">How do you learn best?</h2>
                  <p className="text-slate-500 text-sm mt-1">Choose your preferred style</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {LEARNING_STYLES.map((s) => (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setLearningStyle(s.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${learningStyle === s.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}
                    >
                      <div className="text-2xl mb-2">{s.emoji}</div>
                      <div className="text-sm font-semibold text-slate-800">{s.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">← Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Continue →</button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Notifications */}
            {step === 3 && (
              <motion.div key="notif" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Stay on track</h2>
                  <p className="text-slate-500 text-sm mt-1">We&apos;ll send you helpful reminders</p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Learning Reminders</p>
                      <p className="text-xs text-slate-500">Daily study goal notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${notifications ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    <motion.div
                      animate={{ x: notifications ? 20 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5"
                    />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">← Back</button>
                  <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Continue →</button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 4 && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 text-center py-4">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-6xl"
                >
                  🚀
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h2>
                  <p className="text-slate-500 text-sm mt-2">
                    StudySpace is personalized for you. Time to start learning!
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full text-sm text-slate-600">
                  <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>{selectedInterests.length} interests selected</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-xl border border-violet-100">
                    <Zap className="w-4 h-4 text-violet-500" />
                    <span>Learning style: {LEARNING_STYLES.find(s => s.id === learningStyle)?.label ?? "Mixed"}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={finish}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" /> Go to Dashboard
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
