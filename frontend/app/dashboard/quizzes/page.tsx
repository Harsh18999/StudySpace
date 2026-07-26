"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  FolderOpen,
  X,
  MoreVertical,
  Edit2,
  Trash2,
  FileQuestion,
  Sparkles,
  BarChart3,
  CheckCircle,
  XCircle,
  Trophy,
  RefreshCw,
  Check,
  Zap,
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  Target,
  Brain,
  TrendingUp,
  Award,
  Clock,
  Lock,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { spacesApi, modulesApi, moduleQuizApi, moduleQuizAttemptApi } from "@/lib/api";
import type {
  Space,
  ModuleQuizListItem,
  QuizQuestion,
  Resource,
  SpaceModuleQuizDetail,
  ModuleQuizDetail,
  QuizAttempt,
} from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { useContextMenu } from "@/components/ui/ContextMenu";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

// ── Progress Ring ──────────────────────────────────────────────
function ProgressRing({ pct, size = 76 }: { pct: number; size?: number }) {
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
        className="transition-all duration-500"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.22}
        fontWeight={700}
        fill="#0D9488"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

// ── Create Quiz Modal ──────────────────────────────────────────
function CreateQuizModal({
  defaultModuleId,
  onClose,
  onSuccess,
}: {
  defaultModuleId?: string | null;
  onClose: () => void;
  onSuccess: (moduleId: string) => void;
}) {
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState<"select-module" | "configure">(
    defaultModuleId ? "configure" : "select-module"
  );
  const [selectedModule, setSelectedModule] = useState<{ id: string; name: string } | null>(
    defaultModuleId ? { id: defaultModuleId, name: "Selected Module" } : null
  );
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Fetch all spaces → modules
  const { data: spaces = [], isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list().then((r) => r.data),
  });

  const allModules = spaces.flatMap((s) =>
    (s.modules ?? []).map((m) => ({ ...m, spaceName: s.name }))
  );

  // Fetch indexed resources when module is selected
  const { data: indexedResources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["module-indexed-resources", selectedModule?.id],
    queryFn: () => moduleQuizApi.indexedResources(selectedModule!.id).then((r) => r.data),
    enabled: !!selectedModule,
  });

  // Generate quiz mutation
  const genMutation = useMutation({
    mutationFn: () => {
      const id = crypto.randomUUID();
      setJobId(id);
      return moduleQuizApi.generateQuiz({
        module: selectedModule!.id,
        resources: selectedResources,
        instruction: {
          type: "quize",
          title,
          text: instructions,
          number_of_items: numQuestions,
        },
        job_id: id,
      });
    },
    onSuccess: () => {
      setPolling(true);
    },
    onError: () => {
      addToast("Failed to start quiz generation", "error");
    },
  });

  // Poll job status
  useEffect(() => {
    if (!polling || !jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await moduleQuizApi.jobStatus(jobId);
        const { status } = res.data;
        if (status === "completed") {
          setPolling(false);
          clearInterval(interval);
          qc.invalidateQueries({ queryKey: ["space-quizzes"] });
          addToast("Quiz generated successfully! 🎉", "success");
          onSuccess(selectedModule!.id);
        } else if (status === "failed") {
          setPolling(false);
          clearInterval(interval);
          addToast("Quiz generation failed", "error");
        }
      } catch {
        // ignore transient poll errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [polling, jobId]);

  const toggleResource = (id: string) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const canSubmit =
    selectedModule &&
    selectedResources.length > 0 &&
    title.trim().length > 0 &&
    !genMutation.isPending &&
    !polling;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-4"
      >
        <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#E6E0D6] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E0D6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0D9488]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1C1917] heading-font">Create Module Quiz</h2>
                <p className="text-[10px] text-[#A8A29E]">
                  {step === "select-module" ? "Step 1 of 2 — Pick a module" : "Step 2 of 2 — Configure quiz"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-[#A8A29E] hover:text-[#78716C] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto scroll-thin">
            {step === "select-module" ? (
              <>
                {spacesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0D9488]" />
                  </div>
                ) : allModules.length === 0 ? (
                  <div className="text-center py-8 text-sm text-[#78716C]">
                    No modules found. Create a space with modules first.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold text-[#1C1917] mb-1">Select a module:</p>
                    {allModules.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModule(m);
                          setStep("configure");
                        }}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] hover:bg-[#F5EFE6] hover:border-teal-300 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-[#0D9488]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1C1917]">{m.name}</p>
                          <p className="text-[10px] text-[#A8A29E]">{m.spaceName}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#A8A29E] ml-auto" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setStep("select-module");
                    setSelectedResources([]);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] self-start transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change module
                </button>

                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-xl border border-teal-100">
                  <BookOpen className="w-3.5 h-3.5 text-[#0D9488] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[#0D9488]">
                    Module: {selectedModule?.name}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Quiz Title *</label>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Core Concepts Self-Test"
                    className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Instructions / Detailed Focus</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Test understanding of formulas, key terminology, and practical numerical problem solving"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/10 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">
                    Number of Questions: <span className="text-[#0D9488] font-bold">{numQuestions}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full accent-[#0D9488]"
                  />
                  <div className="flex justify-between text-[10px] text-[#A8A29E] mt-1">
                    <span>5 Qs</span>
                    <span>30 Qs</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">
                    Select Indexed Resources *
                    <span className="text-[#A8A29E] font-normal ml-1">(indexed videos & PDFs)</span>
                  </label>
                  {resourcesLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-[#78716C]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
                      Loading module resources…
                    </div>
                  ) : indexedResources.length === 0 ? (
                    <div className="text-xs text-[#A8A29E] py-3 px-4 bg-amber-50 border border-amber-100 rounded-xl">
                      ⚠️ No indexed resources found in this module. Index videos or PDFs first.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-44 overflow-y-auto scroll-thin">
                      {indexedResources.map((r) => {
                        const isSelected = selectedResources.includes(r.id);
                        const label = r.youtube?.title ?? r.file?.file_name ?? "Resource";
                        const isVideo = r.type === "youtube";
                        const thumbUrl = r.youtube?.thumbnail_url;
                        return (
                          <button
                            key={r.id}
                            onClick={() => toggleResource(r.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-[#0D9488] bg-teal-50/60 text-[#1C1917]"
                                : "border-[#E6E0D6] bg-[#FFFDF9] text-[#78716C] hover:bg-[#F5EFE6]"
                            }`}
                          >
                            {isVideo ? (
                              <div className="w-14 h-9 rounded-lg overflow-hidden flex-shrink-0 relative bg-slate-900 border border-[#E6E0D6]">
                                {thumbUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={thumbUrl}
                                    alt={label}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-teal-50 text-xs font-bold text-[#0D9488]">
                                    ▶
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-14 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-base">
                                📄
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#1C1917] truncate">{label}</p>
                              {isVideo && r.youtube?.channel_name && (
                                <p className="text-[10px] text-[#A8A29E] truncate">{r.youtube.channel_name}</p>
                              )}
                            </div>
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all ${
                                isSelected ? "bg-[#0D9488] border-[#0D9488]" : "border-[#D6CEC0]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dynamic Credit Cost Box */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        Required Credits: <span className="text-amber-700 font-extrabold text-sm">⚡ {selectedResources.length > 0 ? (selectedResources.length * 10) + Math.max(0, numQuestions - selectedResources.length * 10) : 0} Credits</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {selectedResources.length} resource(s) ({selectedResources.length * 10} base) + {Math.max(0, numQuestions - selectedResources.length * 10)} extra questions (1 credit/q)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#78716C] hover:text-[#1C1917] transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => genMutation.mutate()}
                    disabled={!canSubmit}
                    className="flex-1 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2 heading-font transition-all"
                  >
                    {genMutation.isPending || polling ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {polling ? "Generating…" : "Starting…"}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate Quiz
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Active Quiz Runner / Attempt Area ─────────────────────
function QuizRunner({
  quizId,
  quizTitle,
  onBack,
  onComplete,
}: {
  quizId: string;
  quizTitle: string;
  onBack: () => void;
  onComplete: (score: number, total: number, answers: Record<string, string>, questions: QuizQuestion[]) => void;
}) {
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [quizData, setQuizData] = useState<ModuleQuizDetail | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  const [durationMinutes, setDurationMinutes] = useState(15);
  const [starting, setStarting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Fetch quiz & attempt data
  useEffect(() => {
    setLoading(true);
    setCurrentQ(0);
    setAnswers({});

    Promise.all([
      moduleQuizApi.retrieveQuiz(quizId).then((res) => res.data),
      moduleQuizAttemptApi.get(quizId).then((res) => res.data),
    ])
      .then(([quizRes, attemptRes]) => {
        setQuizData(quizRes);
        setAttempt(attemptRes || null);
        if (attemptRes?.user_answers) {
          setAnswers(attemptRes.user_answers);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quizId]);

  // Live timer countdown for IN_PROGRESS
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
      const res = await moduleQuizAttemptApi.save(quizId, answers, true);
      setAttempt(res.data);
      qc.invalidateQueries({ queryKey: ["space-quizzes"] });
      addToast("Time limit expired. Quiz closed.", "info");
    } catch {
      // ignore
    }
  };

  const handleStartAttempt = async () => {
    setStarting(true);
    try {
      const res = await moduleQuizAttemptApi.start(quizId, durationMinutes);
      setAttempt(res.data);
      if (res.data.user_answers) setAnswers(res.data.user_answers);
      qc.invalidateQueries({ queryKey: ["space-quizzes"] });
      addToast("Quiz attempt started!", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.detail || "Failed to start attempt", "error");
    } finally {
      setStarting(false);
    }
  };

  const handleSelectAnswer = (questionIdx: number, val: string) => {
    const nextAnswers = { ...answers, [String(questionIdx)]: val };
    setAnswers(nextAnswers);

    // Auto-save draft
    moduleQuizAttemptApi.save(quizId, nextAnswers, false).catch(() => {});
  };

  const handleSaveAndNext = async () => {
    try {
      await moduleQuizAttemptApi.save(quizId, answers, false);
      qc.invalidateQueries({ queryKey: ["space-quizzes"] });
    } catch {
      // ignore
    }
    if (currentQ < (quizData?.content?.length ?? 0) - 1) {
      setCurrentQ((c) => c + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSaving(true);
    try {
      const res = await moduleQuizAttemptApi.save(quizId, answers, true);
      setAttempt(res.data);
      qc.invalidateQueries({ queryKey: ["space-quizzes"] });
      addToast("Quiz submitted successfully! 🎉", "success");
      if (quizData && res.data) {
        onComplete(res.data.score, res.data.total_questions, answers, quizData.content ?? []);
      }
    } catch (err: any) {
      addToast(err?.response?.data?.detail || "Failed to submit quiz", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm font-medium text-[#78716C]">Loading quiz content…</p>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="flex flex-col gap-4 py-12 max-w-lg mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Quizzes
        </button>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
          ⚠️ Unable to load quiz content. Please check connection.
        </div>
      </div>
    );
  }

  const questions = quizData.content ?? [];

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
          <ArrowLeft className="w-3.5 h-3.5" /> All Quizzes
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

          <h2 className="text-xl font-bold text-[#1C1917] heading-font mt-1">
            {quizData.title || quizTitle}
          </h2>
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

  // State 2: UNATTEMPTED -> Show Start Attempt option & Duration selector
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] self-start transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Quizzes
        </button>

        <div className="bg-[#FFFDF9] p-8 rounded-3xl border border-[#E6E0D6] shadow-xs flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-3">
            <FileQuestion className="w-8 h-8 text-[#0D9488]" />
          </div>
          <span className="pill-accent-tag text-xs">Module Quiz</span>
          <h3 className="font-bold text-[#1C1917] text-xl mt-2 heading-font">
            {quizData.title || quizTitle}
          </h3>
          <p className="text-sm text-[#78716C] mt-1 max-w-md">
            {questions.length} questions (MCQ & NAT format). Once started, your timer begins and single-attempt policy applies.
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
                          selected ? "bg-[#0D9488]" : "bg-[#F5EFE6] border border-[#E6E0D6] text-[#78716C]"
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Quiz"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Right Sidebar: Quiz Analysis Dashboard ─────────────────────
function QuizAnalysisPanel({
  quizTitle,
  attempt,
}: {
  quizTitle?: string;
  attempt?: {
    score: number;
    total: number;
    answers: Record<number, string>;
    questions: QuizQuestion[];
  } | null;
}) {
  if (attempt && attempt.total > 0) {
    const { score, total, answers, questions } = attempt;
    const pct = Math.round((score / total) * 100);
    const correctCount = score;
    const incorrectCount = total - score;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="flex flex-col gap-5 p-5 overflow-y-auto scroll-thin h-full bg-[#FFFDF9]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#0D9488] uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-[#0D9488]" /> Diagnostic Analysis
          </div>
          <h3 className="text-sm font-bold text-[#1C1917] leading-snug">{quizTitle || "Module Quiz Report"}</h3>
        </div>

        <div className="flex flex-col items-center gap-3 py-5 bg-[#FAF7F2] rounded-2xl border border-[#E6E0D6]">
          <ProgressRing pct={pct} size={90} />
          <div className="text-center">
            <p className="text-base font-extrabold text-[#1C1917] heading-font">
              {score} / {total} Correct
            </p>
            <span
              className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mt-1.5 ${
                pct >= 80
                  ? "bg-emerald-100 text-emerald-800"
                  : pct >= 60
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {pct >= 80 ? "Mastered 🌟" : pct >= 60 ? "Good Practice 👍" : "Needs Review 💪"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/60 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-emerald-800 uppercase">Correct</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xl font-bold text-emerald-900 heading-font">{correctCount}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/60 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-rose-800 uppercase">Incorrect</span>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-xl font-bold text-rose-900 heading-font">{incorrectCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#E6E0D6] bg-[#FAF7F2] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917] heading-font">
            <Brain className="w-4 h-4 text-[#0D9488]" /> AI Learning Insights
          </div>
          <ul className="text-xs text-[#78716C] space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#0D9488] font-bold">•</span>
              <span>
                {pct >= 75
                  ? "Strong grasp of fundamental concepts across this module!"
                  : "Review key formulas and definitions before re-testing."}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#0D9488] font-bold">•</span>
              <span>Answered {answeredCount} of {total} questions.</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1C1917] mb-2.5">Question Map</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isCorrect = userAns === q.answer;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold ${
                    isCorrect
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : userAns
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-[#F5EFE6] text-[#78716C] border-[#E6E0D6]"
                  }`}
                >
                  <span>Q{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fixed UI State when no quiz is currently completed in session
  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto scroll-thin h-full bg-[#FFFDF9]">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#0D9488] uppercase tracking-wider mb-1">
          <BarChart3 className="w-3.5 h-3.5 text-[#0D9488]" /> Space Quiz Analytics
        </div>
        <h3 className="text-sm font-bold text-[#1C1917] heading-font">Performance Overview</h3>
      </div>

      <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] flex flex-col gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto">
          <Target className="w-6 h-6 text-[#0D9488]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1C1917] heading-font">Target Goal: 85% Accuracy</h4>
          <p className="text-[11px] text-[#78716C] mt-1">
            Complete module quizzes to generate personalized weak-spot diagnostics & study recommendations.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0D9488]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A8A29E] uppercase">Readiness Score</p>
            <p className="text-sm font-extrabold text-[#1C1917]">78% Exam Ready</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A8A29E] uppercase">Mastery Trend</p>
            <p className="text-sm font-extrabold text-[#1C1917]">+14% Improvement</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Quizzes Page Component ────────────────────────────────
export default function QuizzesPage() {
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModuleForQuiz, setSelectedModuleForQuiz] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ id: string; title: string } | null>(null);

  // Attempt report state for right sidebar
  const [attemptReport, setAttemptReport] = useState<{
    score: number;
    total: number;
    answers: Record<number, string>;
    questions: QuizQuestion[];
  } | null>(null);

  // Sidebar width state — left sidebar (330px default), right sidebar (380px default matching Overview page)
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const savedLeft = localStorage.getItem("left_sidebar_width");
    if (savedLeft) {
      const parsed = parseInt(savedLeft, 10);
      if (!isNaN(parsed) && parsed >= 240 && parsed <= 550) {
        setSidebarWidth(parsed);
      }
    }
    const savedRight = localStorage.getItem("right_panel_width");
    if (savedRight) {
      const parsed = parseInt(savedRight, 10);
      if (!isNaN(parsed) && parsed >= 260 && parsed <= 650) {
        setRightPanelWidth(parsed);
      }
    }
  }, []);

  // Fetch list of user spaces
  const { data: spaces = [] } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list().then((r) => r.data),
  });

  // Set default workspace to last active space or first space
  useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) {
      const saved = localStorage.getItem("last_active_space");
      const target = spaces.find((s) => s.id === saved) || spaces[0];
      if (target) {
        setActiveSpaceId(target.id);
        localStorage.setItem("last_active_space", target.id);
      }
    }
  }, [spaces, activeSpaceId]);

  // Fetch space modules with their quizzes for the active space
  const { data: spaceDetail, isLoading: spaceQuizzesLoading } = useQuery<SpaceModuleQuizDetail>({
    queryKey: ["space-quizzes", activeSpaceId],
    queryFn: () => moduleQuizApi.getSpaceQuizzes(activeSpaceId!).then((r) => r.data),
    enabled: !!activeSpaceId,
  });

  const modules = spaceDetail?.modules ?? [];

  // Sync module order (modules stay collapsed by default)
  useEffect(() => {
    if (modules.length) {
      setModuleOrder((prevOrder) => {
        const existingIds = new Set(prevOrder);
        const newIds = modules.map((m) => m.id);
        const addedIds = newIds.filter((id) => !existingIds.has(id));
        if (addedIds.length === 0 && prevOrder.length === newIds.length) {
          return prevOrder;
        }
        return [...prevOrder.filter((id) => newIds.includes(id)), ...addedIds];
      });
    }
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // Auto-select first attempted quiz (or first quiz) when space loads
  useEffect(() => {
    if (modules.length > 0 && !activeQuiz) {
      let firstAttempted: { id: string; title: string; moduleId: string } | null = null;
      let firstQuiz: { id: string; title: string; moduleId: string } | null = null;

      for (const m of modules) {
        for (const q of m.quizzes || []) {
          if (!firstQuiz) firstQuiz = { id: q.quiz_id, title: q.title, moduleId: m.id };
          if (q.attempt && (q.attempt.status === "SUBMITTED" || q.attempt.status === "EXPIRED")) {
            firstAttempted = { id: q.quiz_id, title: q.title, moduleId: m.id };
            break;
          }
        }
        if (firstAttempted) break;
      }

      const target = firstAttempted || firstQuiz;
      if (target) {
        setActiveQuiz({ id: target.id, title: target.title });
        setExpandedModules((prev) => new Set(prev).add(target.moduleId));
      }
    }
  }, [modules, activeQuiz]);

  // Left drag resize handler (matches Overview Page)
  const startResizingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(550, moveEvent.clientX - 80));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizingLeft(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      localStorage.setItem("left_sidebar_width", sidebarWidth.toString());
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Right drag resize handler (matches Overview Page)
  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(650, window.innerWidth - moveEvent.clientX));
      setRightPanelWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizingRight(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      localStorage.setItem("right_panel_width", rightPanelWidth.toString());
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const orderedModules = moduleOrder
    .map((id) => modules.find((m) => m.id === id))
    .filter(Boolean) as SpaceModuleQuizDetail["modules"];

  const filteredModules = orderedModules.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.quizzes.some((q) => q.title.toLowerCase().includes(search.toLowerCase()))
  );

  const activeSpaceName = spaceDetail?.name || spaces.find((s) => s.id === activeSpaceId)?.name || "Workspace";
  const activeSpaceDescription = spaceDetail?.description || spaces.find((s) => s.id === activeSpaceId)?.description;

  return (
    <div className="flex flex-1 overflow-hidden bg-[#FAF7F2] text-[#1C1917]">
      {/* ── Left Sidebar (Same UI & width default as Overview Page ModuleSidebar) ── */}
      <div
        className="flex flex-col flex-shrink-0 h-full overflow-hidden relative group bg-[#FAF7F2] border-r border-[#E6E0D6]"
        style={{
          width: sidebarWidth,
          transition: isResizingLeft ? "none" : "width 0.15s ease",
        }}
      >
        {/* Resizable Drag Handle on Right Border */}
        <div
          onMouseDown={startResizingLeft}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#0D9488]/30 active:bg-[#0D9488]/60 z-30 transition-colors"
          title="Drag to resize sidebar"
        />

        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#E6E0D6] bg-[#FAF7F2]">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[#1C1917] text-base truncate heading-font">
                {activeSpaceName}
              </h3>
              {activeSpaceDescription && (
                <p className="text-xs text-[#78716C] truncate mt-0.5">{activeSpaceDescription}</p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules & quizzes…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 transition-all"
            />
          </div>
        </div>

        {/* Modules List with dropdown showing module quizzes */}
        <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-3">
          {spaceQuizzesLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-2xl bg-[#FFFDF9] animate-pulse border border-[#E6E0D6]" />
              ))}
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <FolderOpen className="w-10 h-10 text-[#A8A29E]" />
              <p className="text-xs text-[#78716C] text-center">No modules found</p>
            </div>
          ) : (
            filteredModules.map((module) => {
              const isExpanded = expandedModules.has(module.id);
              const quizzes = module.quizzes ?? [];
              return (
                <div key={module.id} className="rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] overflow-hidden shadow-xs">
                  {/* Module header row */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-[#F5EFE6] transition-all group"
                  >
                    <button className="text-[#A8A29E] hover:text-[#1C1917]">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#0D9488]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
                      )}
                    </button>

                    <span className="flex-1 text-xs font-bold text-[#1C1917] truncate heading-font">
                      {module.name}
                    </span>

                    <span className="text-[10px] font-semibold text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded-md flex-shrink-0">
                      {quizzes.length} {quizzes.length === 1 ? "Quiz" : "Quizzes"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModuleForQuiz(module.id);
                        setShowCreateModal(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-[#A8A29E] hover:text-[#0D9488] hover:bg-teal-50 transition-all"
                      title="Add Quiz to this module"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Pop-down list of Module Quizzes (instead of video lessons) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-[#E6E0D6] bg-[#FAF7F2] p-2 space-y-1.5"
                      >
                        {quizzes.length === 0 ? (
                          <div className="p-3 text-center">
                            <p className="text-[11px] text-[#78716C]">No quizzes yet. Click + to generate.</p>
                            <button
                              onClick={() => {
                                setSelectedModuleForQuiz(module.id);
                                setShowCreateModal(true);
                              }}
                              className="text-[11px] text-[#0D9488] font-bold mt-1 inline-block hover:underline"
                            >
                              + Create Quiz Now
                            </button>
                          </div>
                        ) : (
                          quizzes.map((q) => {
                            const isSelected = activeQuiz?.id === q.quiz_id;
                            return (
                              <button
                                key={q.quiz_id}
                                onClick={() => {
                                  setActiveQuiz({ id: q.quiz_id, title: q.title });
                                  setAttemptReport(null);
                                }}
                                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left border transition-all ${
                                  isSelected
                                    ? "border-[#0D9488] bg-[#0D9488] text-white shadow-xs"
                                    : "border-[#E6E0D6] bg-[#FFFDF9] text-[#1C1917] hover:bg-[#F5EFE6]"
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? "bg-white/20 text-white" : "bg-teal-50 text-[#0D9488]"
                                  }`}
                                >
                                  <FileQuestion className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate leading-snug">{q.title}</p>
                                  {q.attempt && (q.attempt.status === "SUBMITTED" || q.attempt.status === "EXPIRED") && (
                                    <span className={`text-[10px] font-bold ${isSelected ? "text-teal-100" : "text-[#0D9488]"}`}>
                                      Score: {q.attempt.score}/{q.attempt.total_questions} ({q.attempt.status === "EXPIRED" ? "Expired" : "Submitted"})
                                    </span>
                                  )}
                                  {q.attempt && q.attempt.status === "IN_PROGRESS" && (
                                    <span className={`text-[10px] font-bold ${isSelected ? "text-amber-200" : "text-amber-600"}`}>
                                      In Progress
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main Area (Attempt Area & Display) ── */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-[#FAF7F2]">
        {/* Top Control Bar */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] bg-[#FFFDF9]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
            <BookOpen className="w-4 h-4 text-[#0D9488]" />
            <span className="text-[#1C1917] font-bold">{activeSpaceName}</span>
            {activeQuiz && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                <span className="text-[#0D9488] font-bold">{activeQuiz.title}</span>
              </>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRightPanelOpen((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all shadow-xs heading-font ${
              rightPanelOpen
                ? "bg-teal-50/80 border-teal-200 text-[#0D9488]"
                : "bg-[#FFFDF9] border-[#E6E0D6] text-[#78716C] hover:border-teal-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Quiz Analysis</span>
            {rightPanelOpen ? (
              <PanelRightClose className="w-4 h-4 text-[#0D9488]" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-[#A8A29E]" />
            )}
          </motion.button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-thin">
          {activeQuiz ? (
            <QuizRunner
              quizId={activeQuiz.id}
              quizTitle={activeQuiz.title}
              onBack={() => setActiveQuiz(null)}
              onComplete={(score, total, answers, questions) => {
                setAttemptReport({ score, total, answers, questions });
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-8 py-16 text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center"
              >
                <FileQuestion className="w-10 h-10 text-[#0D9488]" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-[#1C1917] heading-font">Select a Module Quiz</h2>
                <p className="text-sm text-[#78716C] mt-1 max-w-md">
                  Expand any module section in the left sidebar to view its quizzes, or generate a new quiz from indexed videos/PDFs.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedModuleForQuiz(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-bold shadow-md shadow-teal-700/20 heading-font transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Create Module Quiz
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar: Quiz Report / Analysis ── */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: rightPanelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-shrink-0 border-l border-[#E6E0D6] bg-[#FFFDF9] overflow-hidden relative flex flex-col"
            style={{ width: rightPanelWidth }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={startResizingRight}
              className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#0D9488]/30 active:bg-[#0D9488]/60 z-30 transition-colors"
            />

            <QuizAnalysisPanel
              quizTitle={activeQuiz?.title}
              attempt={attemptReport}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Quiz Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateQuizModal
            defaultModuleId={selectedModuleForQuiz}
            onClose={() => setShowCreateModal(false)}
            onSuccess={(moduleId) => {
              setShowCreateModal(false);
              setExpandedModules((p) => new Set([...p, moduleId]));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
