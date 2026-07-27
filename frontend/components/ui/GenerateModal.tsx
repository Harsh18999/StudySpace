"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, instruction: string) => void;
  generating: boolean;
  contentType: "Quiz" | "Notes" | "Flashcards";
  statusMessage?: string | null;
  jobId?: string | null;
  error?: string | null;
}

const PLACEHOLDERS: Record<string, string> = {
  Quiz: "e.g. Focus on formulas only, make it hard difficulty, 15 questions",
  Notes: "e.g. Include code examples, focus on practical applications",
  Flashcards: "e.g. Only definitions and key terms, 20 cards",
};

const COLORS: Record<string, string> = {
  Quiz: "from-[#0D9488] to-[#059669]",
  Notes: "from-[#059669] to-[#0D9488]",
  Flashcards: "from-[#14B8A6] to-[#0F766E]",
};

export function GenerateModal({ open, onClose, onSubmit, generating, contentType, statusMessage, jobId, error }: Props) {
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title.trim(), instruction.trim());
  };

  const handleClose = () => {
    if (generating) return;
    setTitle("");
    setInstruction("");
    onClose();
  };

  // Reset when closed
  const handleAfterClose = () => {
    setTitle("");
    setInstruction("");
  };

  return (
    <AnimatePresence onExitComplete={handleAfterClose}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#E6E0D6] overflow-hidden">
              {/* Header gradient strip */}
              <div className={`h-1.5 bg-gradient-to-r ${COLORS[contentType]}`} />

              <div className="p-6">
                {/* Title row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8.5 h-8.5 rounded-xl bg-gradient-to-br ${COLORS[contentType]} flex items-center justify-center shadow-xs`}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#1C1917] heading-font">Generate {contentType}</h2>
                      <p className="text-xs text-[#78716C]">AI-powered generation</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={generating}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5EFE6] transition-all disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Title field */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      {contentType} Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                      placeholder={`e.g. Chapter 3 ${contentType}`}
                      disabled={generating}
                      className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 transition-all disabled:opacity-60 placeholder-[#A8A29E]"
                    />
                  </div>

                  {/* Instructions field */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Instructions <span className="text-[#78716C] font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder={PLACEHOLDERS[contentType]}
                      rows={3}
                      disabled={generating}
                      className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 resize-none transition-all disabled:opacity-60 placeholder-[#A8A29E]"
                    />
                  </div>

                  {/* Credit Cost Badge */}
                  <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px]">⚡ 50 CREDITS</span>
                      <span>Resource Processing</span>
                    </div>
                    <span className="text-[11px] text-amber-700 font-medium">50 Credits / Video</span>
                  </div>

                  {/* Status */}
                  {statusMessage && (
                    <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl flex items-center justify-between gap-2 text-xs text-[#0D9488]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0D9488] flex-shrink-0" />
                        <span className="font-semibold">{statusMessage}</span>
                      </div>
                      {jobId && (
                        <span className="text-[10px] font-mono opacity-80 bg-teal-100/60 px-2 py-0.5 rounded-md flex-shrink-0">
                          Job: {jobId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleClose}
                      disabled={generating}
                      className="flex-1 py-2.5 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-sm font-semibold text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5EFE6] transition-all disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmit}
                      disabled={!title.trim() || generating}
                      className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${COLORS[contentType]} text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs transition-all heading-font`}
                    >
                      {generating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate</>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
