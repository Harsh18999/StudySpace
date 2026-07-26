"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ArrowLeft,
  Check,
  Zap,
  Clock,
  Lock,
  FileQuestion,
} from "lucide-react";
import type { QuizDetail, QuizQuestion, QuizAttempt } from "@/lib/types";
import { aiApi, resourceQuizAttemptApi } from "@/lib/api";

function ProgressRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6E0D6" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#0D9488"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="progress-ring-circle transition-all duration-500"
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fontWeight={700} fill="#0D9488">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

interface Props {
  quizId: string;
  onBack: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizPanel({ quizId, onBack }: Props) {
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [durationMinutes, setDurationMinutes] = useState(15);
  const [starting, setStarting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentQ(0);
    setAnswers({});

    Promise.all([
      aiApi.retrieveQuiz(quizId).then((res) => res.data),
      resourceQuizAttemptApi.get(quizId).then((res) => res.data),
    ])
      .then(([quizRes, attemptRes]) => {
        setQuiz(quizRes);
        setAttempt(attemptRes || null);
        if (attemptRes?.user_answers) {
          setAnswers(attemptRes.user_answers);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load quiz.");
        setLoading(false);
      });
  }, [quizId]);

  // Live timer countdown for IN_PROGRESS (Immediate calculation + interval)
  const [timeLeftStr, setTimeLeftStr] = useState<string | null>(null);

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS" || !attempt.expires_at) {
      setTimeLeftStr(null);
      return;
    }

    const calcTimer = () => {
      const diff = Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setTimeLeftStr("0:00");
        handleAutoExpire();
      } else {
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setTimeLeftStr(`${m}:${s < 10 ? "0" : ""}${s}`);
      }
    };

    calcTimer();
    const interval = setInterval(calcTimer, 1000);
    return () => clearInterval(interval);
  }, [attempt?.expires_at, attempt?.status]);

  const handleAutoExpire = async () => {
    try {
      const res = await resourceQuizAttemptApi.save(quizId, answers, true);
      setAttempt(res.data);
    } catch {
      // ignore
    }
  };

  const handleStartAttempt = async () => {
    setStarting(true);
    try {
      const res = await resourceQuizAttemptApi.start(quizId, durationMinutes);
      setAttempt(res.data);
      if (res.data.user_answers) setAnswers(res.data.user_answers);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to start quiz attempt.");
    } finally {
      setStarting(false);
    }
  };

  const handleSelectAnswer = (questionIdx: number, val: string) => {
    const nextAnswers = { ...answers, [String(questionIdx)]: val };
    setAnswers(nextAnswers);

    // Auto-save draft
    resourceQuizAttemptApi.save(quizId, nextAnswers, false).catch(() => {});
  };

  const handleSaveAndNext = async () => {
    try {
      await resourceQuizAttemptApi.save(quizId, answers, false);
    } catch {
      // ignore
    }
    if (currentQ < (quiz?.content?.length ?? 0) - 1) {
      setCurrentQ((c) => c + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSaving(true);
    try {
      const res = await resourceQuizAttemptApi.save(quizId, answers, true);
      setAttempt(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm font-medium text-[#78716C]">Loading quiz content…</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="flex flex-col gap-3 py-6 max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          ⚠️ {error ?? "Quiz not found"}
        </div>
      </div>
    );
  }

  const questions: QuizQuestion[] = quiz.content ?? [];

  // State 1: ATTEMPTED (Submitted or Expired) -> Render Report & Score, single attempt policy
  if (attempt && (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED")) {
    const total = attempt.total_questions || questions.length;
    const score = attempt.score ?? 0;
    const pct = total > 0 ? (score / total) * 100 : 0;
    const isExpired = attempt.status === "EXPIRED";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 max-w-2xl mx-auto py-4"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] self-start transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="bg-[#FFFDF9] rounded-3xl p-8 border border-[#E6E0D6] shadow-xs w-full flex flex-col items-center text-center">
          <div className="mb-3">
            <ProgressRing pct={pct} size={88} />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isExpired ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {isExpired ? "⏰ Attempt Expired" : "✓ Quiz Submitted"}
            </span>
          </div>

          <h2 className="text-xl font-bold text-[#1C1917] heading-font mt-1">{quiz.title}</h2>
          <p className="text-3xl font-extrabold text-[#0D9488] mt-2 heading-font">
            {score} / {total}
          </p>
          <p className="text-xs font-medium text-[#78716C] mt-1">
            {pct >= 80 ? "Outstanding Performance! 🎉" : pct >= 60 ? "Good Effort! 👍" : "Keep Practicing! 💪"}
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] flex items-center gap-2 text-xs text-[#78716C]">
            <Lock className="w-3.5 h-3.5 text-[#A8A29E]" />
            <span>Quiz attempted. Re-attempting is disabled per single-attempt policy.</span>
          </div>
        </div>

        {/* Answer Breakdown */}
        <div className="w-full flex flex-col gap-3">
          <h3 className="font-bold text-[#1C1917] text-sm px-1 heading-font">Answer Breakdown</h3>
          {questions.map((q, i) => {
            const userAnswers = attempt?.user_answers || answers || {};
            const userAnswer = userAnswers[String(i)] ?? userAnswers[i] ?? answers[String(i)] ?? answers[i];
            const correct = userAnswer && q.answer && String(userAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
            return (
              <div
                key={i}
                className={`p-5 rounded-2xl border text-sm bg-[#FFFDF9] ${
                  correct ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="font-semibold text-[#1C1917] flex-1">
                    {i + 1}. {q.question}
                  </p>
                  {correct ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>

                <div className="text-xs flex flex-col gap-1 mt-2">
                  <p className={correct ? "text-emerald-800 font-medium" : "text-rose-800 font-medium"}>
                    Your answer: <span className="font-semibold">{userAnswer || "Not answered"}</span>
                  </p>
                  {!correct && (
                    <p className="text-emerald-700 font-semibold">Correct answer: {q.answer}</p>
                  )}
                </div>

                {q.explanation && (
                  <div className="mt-3 pt-3 border-t border-[#E6E0D6] text-xs text-[#78716C] bg-[#FAF7F2] p-3 rounded-xl">
                    <span className="font-semibold text-[#1C1917]">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // State 2: UNATTEMPTED -> Show Start Attempt option & Duration selector (Presets + Manual Input)
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] self-start transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="bg-[#FFFDF9] p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-3">
            <FileQuestion className="w-8 h-8 text-[#0D9488]" />
          </div>
          <span className="pill-accent-tag text-xs">{quiz.type} Quiz</span>
          <h3 className="font-bold text-[#1C1917] text-xl mt-2 heading-font">{quiz.title}</h3>
          <p className="text-xs md:text-sm text-[#78716C] mt-1 max-w-md">
            {questions.length} questions. Once started, your timer begins and single-attempt policy applies.
          </p>

          <div className="w-full max-w-md mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] flex flex-col gap-3">
            <label className="text-xs font-bold text-[#1C1917] block heading-font">
              Select or Enter Time Limit Duration (Minutes)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    durationMinutes === mins
                      ? "border-[#0D9488] bg-[#0D9488] text-white shadow-xs"
                      : "border-[#E6E0D6] bg-[#FFFDF9] text-[#78716C] hover:bg-[#F5EFE6]"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-[#E6E0D6]/60">
              <span className="text-xs font-semibold text-[#78716C]">Manual Duration:</span>
              <input
                type="number"
                min={1}
                max={180}
                value={durationMinutes || ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDurationMinutes(isNaN(val) ? 1 : Math.max(1, Math.min(180, val)));
                }}
                placeholder="Minutes"
                className="w-24 px-3 py-1.5 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#1C1917] outline-none focus:border-[#0D9488]"
              />
              <span className="text-xs text-[#78716C]">minutes</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartAttempt}
            disabled={starting}
            className="w-full max-w-md mt-4 py-3.5 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-base font-bold shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all heading-font disabled:opacity-50"
          >
            {starting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white stroke-white" /> Start Quiz Attempt
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // State 3: ACTIVE ATTEMPT RUNNER
  const q = questions[currentQ];
  const progressPct = questions.length ? Math.round(((currentQ + 1) / questions.length) * 100) : 0;
  const isNAT = !q?.options || q.options.length === 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Exit
        </button>

        {timeLeftStr && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Time Left: {timeLeftStr}</span>
          </div>
        )}

        <span className="pill-accent-tag px-3 py-1 text-xs font-bold">
          Question {currentQ + 1} of {questions.length}
        </span>
      </div>

      <div className="w-full h-2 bg-[#F5EFE6] border border-[#E6E0D6] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#0D9488] rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {q && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5 bg-[#FFFDF9] p-6 md:p-8 rounded-3xl border border-[#E6E0D6] shadow-xs"
          >
            <h2 className="text-base md:text-lg font-bold text-[#1C1917] leading-relaxed heading-font">
              {q.question}
            </h2>

            {isNAT ? (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-xs text-[#78716C] font-medium">
                  Numerical Answer Type — type your value below:
                </p>
                <input
                  type="text"
                  value={answers[String(currentQ)] ?? ""}
                  onChange={(e) => handleSelectAnswer(currentQ, e.target.value)}
                  placeholder="Enter numerical value…"
                  className="w-full px-4 py-3 rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] text-sm font-medium text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 transition-all placeholder-[#A8A29E]"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-1">
                {q.options.map((opt, idx) => {
                  const selected = answers[String(currentQ)] === opt;
                  const letter = OPTION_LETTERS[idx % OPTION_LETTERS.length];
                  return (
                    <motion.button
                      key={opt}
                      whileHover={{ scale: 1.005, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectAnswer(currentQ, opt)}
                      className={`w-full text-left p-3.5 md:p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                        selected
                          ? "border-[#0D9488] bg-teal-50/80 shadow-xs"
                          : "border-[#E6E0D6] bg-[#FFFDF9] hover:bg-[#F5EFE6] hover:border-[#D6CEC0]"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selected ? "bg-[#0D9488] text-white" : "bg-[#F5EFE6] border border-[#E6E0D6] text-[#78716C]"
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="flex-1 text-xs md:text-sm font-medium leading-relaxed text-[#1C1917]">
                        {opt}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? "bg-[#0D9488]" : "border border-[#D6CEC0] bg-[#FFFDF9]"
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
          disabled={currentQ === 0}
          className="flex-1 py-3 rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5EFE6] disabled:opacity-40 transition-all shadow-xs"
        >
          ← Previous
        </button>
        {currentQ < questions.length - 1 ? (
          <button
            onClick={handleSaveAndNext}
            className="flex-1 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-xs heading-font flex items-center justify-center gap-1.5"
          >
            Save & Next →
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-xs heading-font flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Quiz ✓"}
          </button>
        )}
      </div>
    </div>
  );
}
