"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Loader2,
  RotateCcw,
  ArrowLeft,
  Eye,
  Sparkles,
} from "lucide-react";
import type { FlashCardDetail, FlashCardItem } from "@/lib/types";
import { aiApi } from "@/lib/api";

interface Props {
  flashcardId: string;
  onBack: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function FlashcardViewer({ flashcardId, onBack }: Props) {
  const [detail, setDetail] = useState<FlashCardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cards, setCards] = useState<FlashCardItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrent(0);
    setFlipped(false);

    aiApi
      .retrieveFlashcard(flashcardId)
      .then((res) => {
        setDetail(res.data);
        setCards(res.data.content ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load flashcards.");
        setLoading(false);
      });
  }, [flashcardId]);

  const next = useCallback(() => {
    setFlipped(false);
    setCurrent((c) => (c + 1) % (cards.length || 1));
  }, [cards.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setCurrent((c) => (c - 1 + cards.length) % (cards.length || 1));
  }, [cards.length]);

  const toggleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const shuffle = useCallback(() => {
    setCards((c) => shuffleArray(c));
    setCurrent(0);
    setFlipped(false);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFlip, next, prev]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm font-medium text-[#78716C]">Loading flashcards…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-3 py-6 max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          ⚠️ {error ?? "Flashcards not found"}
        </div>
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="flex flex-col gap-3 py-6 max-w-xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="text-center p-8 bg-[#F5EFE6] rounded-2xl border border-[#E6E0D6]">
          <div className="text-4xl mb-2">🃏</div>
          <p className="text-sm font-medium text-[#78716C]">No cards in this set</p>
        </div>
      </div>
    );
  }

  const card = cards[current];
  const progressPct = Math.round(((current + 1) / cards.length) * 100);

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#78716C] hover:text-[#0D9488] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> All Flashcards
        </button>
        <button
          onClick={shuffle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-semibold text-[#0D9488] hover:bg-[#FAF7F2] hover:border-teal-300 transition-all shadow-xs"
        >
          <Shuffle className="w-3.5 h-3.5 text-[#0D9488]" /> Shuffle Deck
        </button>
      </div>

      {/* Progress & Set Meta */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#1C1917] text-base truncate heading-font">{detail.title}</span>
          <span className="pill-accent-tag px-2.5 py-1 text-xs font-bold">
            Card {current + 1} of {cards.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#F5EFE6] border border-[#E6E0D6] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#0D9488] rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flip Card in Creamy Linen Theme */}
      <div className="flip-card w-full cursor-pointer select-none" style={{ height: 340 }} onClick={toggleFlip}>
        <motion.div
          className="flip-card-inner w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d", position: "relative" }}
        >
          {/* Front — Question Side */}
          <div
            className="flip-card-front absolute inset-0"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="h-full bg-[#FFFDF9] border-2 border-[#E6E0D6] rounded-3xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="pill-accent-tag text-xs font-bold uppercase tracking-wider">
                  Question
                </span>
                <span className="text-xs text-[#A8A29E] font-medium flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-[#0D9488]" /> Tap or Press Space to Reveal
                </span>
              </div>

              <div className="my-auto text-center py-4">
                <p className="text-xl md:text-2xl font-semibold text-[#1C1917] leading-relaxed heading-font">
                  {card.question}
                </p>
              </div>

              <div className="text-center text-xs font-bold text-[#0D9488] group-hover:underline transition-all">
                Click to see answer →
              </div>
            </div>
          </div>

          {/* Back — Answer Side */}
          <div
            className="flip-card-back absolute inset-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="h-full bg-[#FFFDF9] border-2 border-teal-200 rounded-3xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden group transition-all">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#0D9488] text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 stroke-[2.5]" /> Answer
                </span>
                <span className="text-xs text-[#A8A29E] font-medium">Tap to Flip Back</span>
              </div>

              <div className="my-auto text-center py-4">
                <p className="text-lg md:text-xl font-medium text-[#1C1917] leading-relaxed heading-font">
                  {card.answer}
                </p>
              </div>

              <div className="text-center text-xs font-bold text-[#0D9488] group-hover:underline transition-all">
                ← Click to see question
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls / Navigation Bar */}
      <div className="flex items-center gap-3 pt-1">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={prev}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#1C1917] hover:bg-[#F5EFE6] shadow-xs transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFlip}
          title="Flip Card (Space)"
          className="px-6 py-3 rounded-2xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all heading-font"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" /> Flip
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#1C1917] hover:bg-[#F5EFE6] shadow-xs transition-all"
        >
          Next <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Keyboard Shortcuts Helper */}
      <p className="text-center text-[11px] text-[#A8A29E] pt-1">
        Shortcuts: <kbd className="px-1.5 py-0.5 bg-[#F5EFE6] border border-[#E6E0D6] rounded text-[10px] text-[#78716C]">Space</kbd> to flip · <kbd className="px-1.5 py-0.5 bg-[#F5EFE6] border border-[#E6E0D6] rounded text-[10px] text-[#78716C]">←</kbd> <kbd className="px-1.5 py-0.5 bg-[#F5EFE6] border border-[#E6E0D6] rounded text-[10px] text-[#78716C]">→</kbd> to navigate
      </p>
    </div>
  );
}
