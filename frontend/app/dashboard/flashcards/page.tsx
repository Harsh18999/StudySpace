"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  FolderOpen,
  X,
  Sparkles,
  Check,
  BookOpen,
  ArrowLeft,
  Layers,
  RotateCcw,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  PanelRightClose,
  PanelRightOpen,
  Target,
  Award,
  Brain,
  BarChart3,
  Zap,
} from "lucide-react";
import { spacesApi, moduleFlashcardApi } from "@/lib/api";
import type {
  Space,
  Resource,
  SpaceModuleFlashcardDetail,
  ModuleFlashcardDetail,
  ModuleFlashcardItem,
} from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

// ── Flip Card Component ─────────────────────────────────────────
function FlipCard({ card, index }: { card: ModuleFlashcardItem; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: "1200px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d", position: "relative", minHeight: "200px" }}
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className="bg-[#FFFDF9] border border-[#E6E0D6] rounded-2xl p-6 flex flex-col justify-between shadow-xs"
        >
          <span className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-widest">
            Card {index + 1} · Question
          </span>
          <p className="text-base font-semibold text-[#1C1917] leading-relaxed text-center flex-1 flex items-center justify-center">
            {card.question}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A8A29E]">
            <RotateCcw className="w-3 h-3" /> Tap to reveal
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
          }}
          className="bg-teal-50 border border-teal-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs"
        >
          <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest">
            Answer
          </span>
          <p className="text-base font-bold text-[#0D9488] leading-relaxed text-center flex-1 flex items-center justify-center">
            {card.answer}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#0D9488]/70">
            <RotateCcw className="w-3 h-3" /> Tap to go back
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Flashcard Viewer ───────────────────────────────────────────
function FlashcardViewer({
  flashcardId,
  flashcardTitle,
  onBack,
}: {
  flashcardId: string;
  flashcardTitle: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<ModuleFlashcardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<"browse" | "study">("browse");

  useEffect(() => {
    setLoading(true);
    setCurrent(0);
    setMode("browse");
    moduleFlashcardApi
      .retrieveFlashcard(flashcardId)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [flashcardId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm font-medium text-[#78716C]">Loading flashcards…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4 py-12 max-w-lg mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
          ⚠️ Unable to load flashcard content.
        </div>
      </div>
    );
  }

  const cards = data.content ?? [];

  // Browse all cards (grid of flip cards)
  if (mode === "browse") {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Flashcards
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setCurrent(0); setMode("study"); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-white stroke-white" /> Study Mode
          </motion.button>
        </div>

        <div className="bg-[#FFFDF9] p-6 rounded-3xl border border-[#E6E0D6] shadow-xs">
          <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest">Module Flashcards</span>
          <h3 className="font-bold text-[#1C1917] text-xl mt-1 heading-font">{data.title || flashcardTitle}</h3>
          <p className="text-sm text-[#78716C] mt-1">{cards.length} cards · Tap any card to reveal the answer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <FlipCard key={i} card={card} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // Study mode: one card at a time
  const card = cards[current];
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMode("browse")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" /> Browse All
        </button>
        <span className="pill-accent-tag px-3 py-1 text-xs font-bold">
          {current + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[#F5EFE6] border border-[#E6E0D6] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#0D9488] rounded-full"
          animate={{ width: `${((current + 1) / cards.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <FlipCard card={card} index={current} />
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex-1 py-3 rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#78716C] hover:bg-[#F5EFE6] disabled:opacity-40 transition-all"
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrent((c) => Math.min(cards.length - 1, c + 1))}
          disabled={current === cards.length - 1}
          className="flex-1 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold disabled:opacity-50 transition-all heading-font"
        >
          Next Card →
        </button>
      </div>
    </div>
  );
}

// ── Create Flashcard Modal ─────────────────────────────────────
function CreateFlashcardModal({
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
  const [numCards, setNumCards] = useState(15);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const { data: spaces = [], isLoading: spacesLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list().then((r) => r.data),
  });

  const allModules = spaces.flatMap((s) =>
    (s.modules ?? []).map((m) => ({ ...m, spaceName: s.name }))
  );

  const { data: indexedResources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ["module-indexed-resources", selectedModule?.id],
    queryFn: () => moduleFlashcardApi.indexedResources(selectedModule!.id).then((r) => r.data),
    enabled: !!selectedModule,
  });

  const genMutation = useMutation({
    mutationFn: () => {
      const id = crypto.randomUUID();
      setJobId(id);
      return moduleFlashcardApi.generateFlashcard({
        module: selectedModule!.id,
        resources: selectedResources,
        instruction: {
          type: "flashcard",
          title,
          text: instructions,
          number_of_items: numCards,
        },
        job_id: id,
      });
    },
    onSuccess: () => setPolling(true),
    onError: () => addToast("Failed to start flashcard generation", "error"),
  });

  useEffect(() => {
    if (!polling || !jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await moduleFlashcardApi.jobStatus(jobId);
        const { status } = res.data;
        if (status === "completed") {
          setPolling(false);
          clearInterval(interval);
          qc.invalidateQueries({ queryKey: ["space-flashcards"] });
          addToast("Flashcards generated! 🎉", "success");
          onSuccess(selectedModule!.id);
        } else if (status === "failed") {
          setPolling(false);
          clearInterval(interval);
          addToast("Flashcard generation failed", "error");
        }
      } catch {
        // ignore transient poll errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [polling, jobId]);

  const toggleResource = (id: string) =>
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

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
                <Layers className="w-4 h-4 text-[#0D9488]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1C1917] heading-font">Create Module Flashcards</h2>
                <p className="text-[10px] text-[#A8A29E]">
                  {step === "select-module" ? "Step 1 of 2 — Pick a module" : "Step 2 of 2 — Configure deck"}
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
                        onClick={() => { setSelectedModule(m); setStep("configure"); }}
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
                  onClick={() => { setStep("select-module"); setSelectedResources([]); }}
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
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Deck Title *</label>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Key Concepts Flashcards"
                    className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Focus Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Focus on definitions, formulas, and key terminology"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/10 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">
                    Number of Cards: <span className="text-[#0D9488] font-bold">{numCards}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    value={numCards}
                    onChange={(e) => setNumCards(Number(e.target.value))}
                    className="w-full accent-[#0D9488]"
                  />
                  <div className="flex justify-between text-[10px] text-[#A8A29E] mt-1">
                    <span>5</span>
                    <span>40</span>
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
                        Required Credits: <span className="text-amber-700 font-extrabold text-sm">⚡ {selectedResources.length > 0 ? (selectedResources.length * 10) + Math.max(0, numCards - selectedResources.length * 10) : 0} Credits</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {selectedResources.length} resource(s) ({selectedResources.length * 10} base) + {Math.max(0, numCards - selectedResources.length * 10)} extra cards (1 credit/card)
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
                        <Layers className="w-3.5 h-3.5" />
                        Generate Flashcards
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

// ── Right Sidebar: Flashcard Info Panel ─────────────────────────
function FlashcardInfoPanel({
  deckTitle,
  totalCards,
}: {
  deckTitle?: string;
  totalCards?: number;
}) {
  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto scroll-thin h-full bg-[#FFFDF9]">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#0D9488] uppercase tracking-wider mb-1">
          <BarChart3 className="w-3.5 h-3.5" /> Flashcard Overview
        </div>
        <h3 className="text-sm font-bold text-[#1C1917] heading-font">
          {deckTitle || "Module Flashcards"}
        </h3>
      </div>

      <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6E0D6] flex flex-col gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto">
          <Target className="w-6 h-6 text-[#0D9488]" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1C1917] heading-font">Active Recall</h4>
          <p className="text-[11px] text-[#78716C] mt-1">
            {deckTitle
              ? `Studying "${deckTitle}" — ${totalCards ?? 0} cards loaded.`
              : "Select a flashcard deck from the left sidebar to start studying."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="p-4 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0D9488]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A8A29E] uppercase">Study Tip</p>
            <p className="text-xs font-semibold text-[#1C1917]">Tap cards to flip & reveal</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0D9488]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#A8A29E] uppercase">Study Mode</p>
            <p className="text-xs font-semibold text-[#1C1917]">One card at a time</p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-[#E6E0D6] bg-[#FAF7F2] flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1C1917] heading-font">
          <Layers className="w-4 h-4 text-[#0D9488]" /> How to Use
        </div>
        <ul className="text-xs text-[#78716C] space-y-1.5 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#0D9488] font-bold">•</span>
            <span>Click any card to reveal the answer.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#0D9488] font-bold">•</span>
            <span>Use Study Mode for focused, sequential practice.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#0D9488] font-bold">•</span>
            <span>Generate new decks from indexed videos & PDFs.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ── Main Flashcards Page ────────────────────────────────────────
export default function FlashcardsPage() {
  const { addToast } = useToast();

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModuleForDeck, setSelectedModuleForDeck] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [activeDeck, setActiveDeck] = useState<{ id: string; title: string } | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const savedLeft = localStorage.getItem("left_sidebar_width");
    if (savedLeft) {
      const p = parseInt(savedLeft, 10);
      if (!isNaN(p) && p >= 240 && p <= 550) setSidebarWidth(p);
    }
    const savedRight = localStorage.getItem("right_panel_width");
    if (savedRight) {
      const p = parseInt(savedRight, 10);
      if (!isNaN(p) && p >= 260 && p <= 650) setRightPanelWidth(p);
    }
  }, []);

  const { data: spaces = [] } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list().then((r) => r.data),
  });

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

  const { data: spaceDetail, isLoading: flashcardsLoading } =
    useQuery<SpaceModuleFlashcardDetail>({
      queryKey: ["space-flashcards", activeSpaceId],
      queryFn: () =>
        moduleFlashcardApi.getSpaceFlashcards(activeSpaceId!).then((r) => r.data),
      enabled: !!activeSpaceId,
    });

  const modules = spaceDetail?.modules ?? [];

  useEffect(() => {
    if (modules.length) {
      setModuleOrder((prevOrder) => {
        const existingIds = new Set(prevOrder);
        const newIds = modules.map((m) => m.id);
        const addedIds = newIds.filter((id) => !existingIds.has(id));
        if (addedIds.length === 0 && prevOrder.length === newIds.length) return prevOrder;
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

  const startResizingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
    const onMouseMove = (ev: MouseEvent) => {
      setSidebarWidth(Math.max(240, Math.min(550, ev.clientX - 80)));
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

  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
    const onMouseMove = (ev: MouseEvent) => {
      setRightPanelWidth(Math.max(260, Math.min(650, window.innerWidth - ev.clientX)));
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

  const orderedModules =
    moduleOrder.length > 0
      ? (moduleOrder
          .map((id) => modules.find((m) => m.id === id))
          .filter(Boolean) as SpaceModuleFlashcardDetail["modules"])
      : modules;

  const filteredModules = orderedModules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.flashcards.some((f) => f.title.toLowerCase().includes(search.toLowerCase()))
  );

  const activeSpaceName =
    spaceDetail?.name || spaces.find((s) => s.id === activeSpaceId)?.name || "Workspace";
  const activeSpaceDescription =
    spaceDetail?.description || spaces.find((s) => s.id === activeSpaceId)?.description;

  return (
    <div className="flex flex-1 overflow-hidden bg-[#FAF7F2] text-[#1C1917]">
      {/* ── Left Sidebar ── */}
      <div
        className="flex flex-col flex-shrink-0 h-full overflow-hidden relative group bg-[#FAF7F2] border-r border-[#E6E0D6]"
        style={{
          width: sidebarWidth,
          transition: isResizingLeft ? "none" : "width 0.15s ease",
        }}
      >
        {/* Drag Handle */}
        <div
          onMouseDown={startResizingLeft}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#0D9488]/30 active:bg-[#0D9488]/60 z-30 transition-colors"
        />

        {/* Header */}
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules & decks…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 transition-all"
            />
          </div>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-3">
          {flashcardsLoading ? (
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
              const decks = module.flashcards ?? [];
              return (
                <div
                  key={module.id}
                  className="rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] overflow-hidden shadow-xs"
                >
                  {/* Module header */}
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
                      {decks.length} {decks.length === 1 ? "Deck" : "Decks"}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModuleForDeck(module.id);
                        setShowCreateModal(true);
                      }}
                      className="ml-1 p-1 rounded-lg text-[#A8A29E] hover:text-[#0D9488] hover:bg-teal-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      title="Create flashcard deck for this module"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Flashcard deck list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-[#E6E0D6]"
                      >
                        {decks.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-[#A8A29E]">
                            No flashcard decks yet —{" "}
                            <button
                              onClick={() => {
                                setSelectedModuleForDeck(module.id);
                                setShowCreateModal(true);
                              }}
                              className="text-[#0D9488] font-semibold hover:underline"
                            >
                              Create one
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col divide-y divide-[#E6E0D6]">
                            {decks.map((deck) => {
                              const isActive = activeDeck?.id === deck.flashcard_id;
                              return (
                                <button
                                  key={deck.flashcard_id}
                                  onClick={() =>
                                    setActiveDeck({ id: deck.flashcard_id, title: deck.title })
                                  }
                                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-all ${
                                    isActive
                                      ? "bg-teal-50 text-[#0D9488]"
                                      : "hover:bg-[#F5EFE6] text-[#1C1917]"
                                  }`}
                                >
                                  <Layers
                                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                                      isActive ? "text-[#0D9488]" : "text-[#A8A29E]"
                                    }`}
                                  />
                                  <span className="text-xs font-semibold truncate flex-1">
                                    {deck.title}
                                  </span>
                                  {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
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

      {/* ── Main Area ── */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-[#FAF7F2]">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-[#E6E0D6] bg-[#FFFDF9]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
            <Layers className="w-4 h-4 text-[#0D9488]" />
            <span className="text-[#1C1917] font-bold">{activeSpaceName}</span>
            {activeDeck && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                <span className="text-[#0D9488] font-bold">{activeDeck.title}</span>
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
            <span>Deck Info</span>
            {rightPanelOpen ? (
              <PanelRightClose className="w-4 h-4 text-[#0D9488]" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-[#A8A29E]" />
            )}
          </motion.button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scroll-thin">
          {activeDeck ? (
            <FlashcardViewer
              flashcardId={activeDeck.id}
              flashcardTitle={activeDeck.title}
              onBack={() => setActiveDeck(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-8 py-16 text-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center"
              >
                <Layers className="w-10 h-10 text-[#0D9488]" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-[#1C1917] heading-font">
                  Select a Flashcard Deck
                </h2>
                <p className="text-sm text-[#78716C] mt-1 max-w-md">
                  Expand any module in the left sidebar to see its flashcard decks, or generate a new deck from indexed resources.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectedModuleForDeck(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-bold shadow-md shadow-teal-700/20 heading-font transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Create Flashcard Deck
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Sidebar ── */}
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
            {/* Drag handle */}
            <div
              onMouseDown={startResizingRight}
              className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#0D9488]/30 active:bg-[#0D9488]/60 z-30 transition-colors"
            />
            <FlashcardInfoPanel
              deckTitle={activeDeck?.title}
              totalCards={undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Deck Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFlashcardModal
            defaultModuleId={selectedModuleForDeck}
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
