"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  GitBranch,
  ExternalLink,
  Download,
  BookOpen,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink as OpenIcon,
  FileQuestion,
  StickyNote,
  CreditCard,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type {
  Resource,
  QuizListItem,
  NoteListItem,
  FlashCardListItem,
} from "@/lib/types";
import { aiApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ContextMenu, useContextMenu } from "@/components/ui/ContextMenu";
import { GenerateModal } from "@/components/ui/GenerateModal";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useUIStore } from "@/store/useStore";

interface Props {
  resource: Resource;
  onQuizOpen: (quizId: string) => void;
  onNoteOpen: (noteId: string) => void;
  onFlashcardOpen: (flashcardId: string) => void;
  onResourceUpdated: (updated: Partial<Resource>) => void;
}

// ── Rename inline ──────────────────────────────────────────────
function RenameInline({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(value);
  return (
    <input
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(val.trim());
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onSave(val.trim())}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 min-w-0 px-2 py-0.5 text-xs border border-[#0D9488] rounded outline-none bg-[#FFFDF9] text-[#1C1917]"
    />
  );
}

// ── Content list item (Creamy Document Card) ──────────────────────────
function ContentItem({
  id,
  title,
  subtitle = "DOCX",
  isActive,
  onOpen,
  onDelete,
  onRename,
}: {
  id: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) {
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();
  const [renaming, setRenaming] = useState(false);

  return (
    <>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={closeMenu}
        />
      )}
      <motion.div
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
        onClick={() => !renaming && onOpen()}
        className={`group flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${isActive
          ? "bg-teal-50/80 border-[#0D9488] shadow-xs border-l-4 border-l-[#0D9488]"
          : "bg-[#FFFDF9] border-[#E6E0D6] hover:border-[#D6CEC0] hover:shadow-xs hover:bg-[#FAF7F2]"
          }`}
      >
        {/* Document Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isActive ? "bg-[#0D9488] text-white font-bold" : "bg-teal-50 text-[#0D9488]"
            }`}
        >
          <FileText className="w-4.5 h-4.5" />
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          {renaming ? (
            <RenameInline
              value={title}
              onSave={(v) => {
                if (v && v !== title) onRename(v);
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <>
              <p
                className={`text-xs font-semibold truncate ${isActive ? "text-[#1C1917] font-bold" : "text-[#1C1917]"
                  }`}
              >
                {title}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[#78716C]">
                <span>Updated recently</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded bg-[#F5EFE6] border border-[#E6E0D6] font-medium text-[9px] text-[#0D9488] uppercase">
                  {subtitle}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Three-dot menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openMenu(e, [
              {
                label: "Open",
                icon: <OpenIcon className="w-3.5 h-3.5 text-[#0D9488]" />,
                onClick: onOpen,
              },
              {
                label: "Rename",
                icon: <Edit2 className="w-3.5 h-3.5" />,
                onClick: () => setRenaming(true),
              },
              {
                label: "Delete",
                icon: <Trash2 className="w-3.5 h-3.5" />,
                onClick: onDelete,
                variant: "danger",
              },
            ]);
          }}
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isActive
            ? "text-[#0D9488] hover:bg-teal-100"
            : "text-[#A8A29E] hover:text-[#1C1917] hover:bg-[#F5EFE6]"
            }`}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </motion.div>
    </>
  );
}

// ── Section header ──────────────────────────────────────────────
function SectionHeader({
  icon,
  label,
  count,
  onGenerate,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  onGenerate: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-1 mb-3 pb-2 border-b border-[#E6E0D6]">
      <div className="flex items-center gap-2">
        <div className="text-[#0D9488]">{icon}</div>
        <h3 className="card-title text-sm heading-font">{label}</h3>
        {count > 0 && (
          <span className="text-[10px] font-bold text-[#0D9488] bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <button
        onClick={onGenerate}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold transition-all shadow-xs"
        title={`Generate new ${label}`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>New {label.endsWith("es") ? label.slice(0, -2) : label.endsWith("s") ? label.slice(0, -1) : label}</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export function ResourcesPanel({
  resource,
  onQuizOpen,
  onNoteOpen,
  onFlashcardOpen,
  onResourceUpdated,
}: Props) {
  const { activeRightTab, setActiveRightTab } = useUIStore();
  const { addToast } = useToast();

  // Generate modals
  const [quizModal, setQuizModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [flashcardModal, setFlashcardModal] = useState(false);

  // Active selected items for highlighting
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFlashcardId, setActiveFlashcardId] = useState<string | null>(null);

  const quizWorkflow = useWorkflow();
  const notesWorkflow = useWorkflow();
  const flashcardWorkflow = useWorkflow();

  // ── Generate handlers ──────────────────────────────────────
  const handleGenerateQuiz = (title: string, instruction: string) => {
    quizWorkflow.startWorkflow(
      resource.id,
      [{ type: "quize", title, text: instruction }],
      (result) => {
        if (result.quizes) {
          const newItem: QuizListItem = {
            quiz_id: result.quizes.quiz_id,
            title: result.quizes.title,
            type: (result.quizes as any).type ?? "medium",
          };
          onResourceUpdated({
            quizes: [...(resource.quizes ?? []), newItem],
          });
          setQuizModal(false);
          addToast("Quiz generated!", "success");
        }
      }
    );
  };

  const handleGenerateNotes = (title: string, instruction: string) => {
    notesWorkflow.startWorkflow(
      resource.id,
      [{ type: "notes", title, text: instruction }],
      (result) => {
        if (result.notes) {
          const newItem: NoteListItem = {
            note_id: result.notes.note_id,
            title: result.notes.title,
          };
          onResourceUpdated({
            notes: [...(resource.notes ?? []), newItem],
          });
          setNotesModal(false);
          addToast("Notes generated!", "success");
        }
      }
    );
  };

  const handleGenerateFlashcard = (title: string, instruction: string) => {
    flashcardWorkflow.startWorkflow(
      resource.id,
      [{ type: "flashcard", title, text: instruction }],
      (result) => {
        if (result.flashcards) {
          const newItem: FlashCardListItem = {
            flashcard_id: result.flashcards.flashcard_id,
            title: result.flashcards.title,
          };
          onResourceUpdated({
            flashcards: [...(resource.flashcards ?? []), newItem],
          });
          setFlashcardModal(false);
          addToast("Flashcards generated!", "success");
        }
      }
    );
  };

  // ── Delete handlers ──────────────────────────────────────
  const deleteQuiz = useCallback(
    async (quizId: string) => {
      try {
        await aiApi.deleteQuiz(quizId);
        onResourceUpdated({
          quizes: (resource.quizes ?? []).filter((q) => q.quiz_id !== quizId),
        });
        if (activeQuizId === quizId) setActiveQuizId(null);
        addToast("Quiz deleted", "info");
      } catch {
        addToast("Failed to delete quiz", "error");
      }
    },
    [resource.quizes, activeQuizId, onResourceUpdated, addToast]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        await aiApi.deleteNote(noteId);
        onResourceUpdated({
          notes: (resource.notes ?? []).filter((n) => n.note_id !== noteId),
        });
        if (activeNoteId === noteId) setActiveNoteId(null);
        addToast("Note deleted", "info");
      } catch {
        addToast("Failed to delete note", "error");
      }
    },
    [resource.notes, activeNoteId, onResourceUpdated, addToast]
  );

  const deleteFlashcard = useCallback(
    async (flashcardId: string) => {
      try {
        await aiApi.deleteFlashcard(flashcardId);
        onResourceUpdated({
          flashcards: (resource.flashcards ?? []).filter(
            (f) => f.flashcard_id !== flashcardId
          ),
        });
        if (activeFlashcardId === flashcardId) setActiveFlashcardId(null);
        addToast("Flashcards deleted", "info");
      } catch {
        addToast("Failed to delete flashcards", "error");
      }
    },
    [resource.flashcards, activeFlashcardId, onResourceUpdated, addToast]
  );

  // ── Rename handlers ──────────────────────────────────────
  const renameQuiz = useCallback(
    async (quizId: string, newTitle: string) => {
      try {
        await aiApi.renameQuiz(quizId, newTitle);
        onResourceUpdated({
          quizes: (resource.quizes ?? []).map((q) =>
            q.quiz_id === quizId ? { ...q, title: newTitle } : q
          ),
        });
        addToast("Quiz renamed", "success");
      } catch {
        addToast("Failed to rename quiz", "error");
      }
    },
    [resource.quizes, onResourceUpdated, addToast]
  );

  const renameNote = useCallback(
    async (noteId: string, newTitle: string) => {
      try {
        await aiApi.renameNote(noteId, newTitle);
        onResourceUpdated({
          notes: (resource.notes ?? []).map((n) =>
            n.note_id === noteId ? { ...n, title: newTitle } : n
          ),
        });
        addToast("Note renamed", "success");
      } catch {
        addToast("Failed to rename note", "error");
      }
    },
    [resource.notes, onResourceUpdated, addToast]
  );

  const renameFlashcard = useCallback(
    async (flashcardId: string, newTitle: string) => {
      try {
        await aiApi.renameFlashcard(flashcardId, newTitle);
        onResourceUpdated({
          flashcards: (resource.flashcards ?? []).map((f) =>
            f.flashcard_id === flashcardId ? { ...f, title: newTitle } : f
          ),
        });
        addToast("Flashcards renamed", "success");
      } catch {
        addToast("Failed to rename flashcards", "error");
      }
    },
    [resource.flashcards, onResourceUpdated, addToast]
  );

  const tabs = [
    { id: "quiz", label: "Quiz" },
    { id: "notes", label: "Notes" },
    { id: "flashcards", label: "Cards" },
  ] as const;

  useEffect(() => {
    if ((activeRightTab as string) === "resources") {
      setActiveRightTab("quiz");
    }
  }, [activeRightTab, setActiveRightTab]);

  return (
    <>
      {/* Generate modals */}
      <GenerateModal
        open={quizModal}
        onClose={() => setQuizModal(false)}
        onSubmit={handleGenerateQuiz}
        generating={quizWorkflow.loading}
        contentType="Quiz"
        statusMessage={quizWorkflow.statusMessage}
        error={quizWorkflow.error}
      />
      <GenerateModal
        open={notesModal}
        onClose={() => setNotesModal(false)}
        onSubmit={handleGenerateNotes}
        generating={notesWorkflow.loading}
        contentType="Notes"
        statusMessage={notesWorkflow.statusMessage}
        error={notesWorkflow.error}
      />
      <GenerateModal
        open={flashcardModal}
        onClose={() => setFlashcardModal(false)}
        onSubmit={handleGenerateFlashcard}
        generating={flashcardWorkflow.loading}
        contentType="Flashcards"
        statusMessage={flashcardWorkflow.statusMessage}
        error={flashcardWorkflow.error}
      />

      <div className="flex flex-col h-full bg-[#FFFDF9] border-l border-[#E6E0D6]">
        {/* Segmented Control Track */}
        <div className="p-3 border-b border-[#E6E0D6] bg-[#FFFDF9]">
          <div className="grid grid-cols-3 p-1 bg-[#F5EFE6] rounded-xl border border-[#E6E0D6] relative">
            {tabs.map((tab) => {
              const isActive = activeRightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id as any)}
                  className={`relative z-10 py-1.5 text-xs font-bold transition-all text-center rounded-lg heading-font ${
                    isActive ? "text-[#0D9488] font-extrabold" : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="pill-active-bg"
                      className="absolute inset-0 bg-[#FFFDF9] rounded-lg -z-10 shadow-xs border border-[#E6E0D6]"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          <AnimatePresence mode="wait">
            {/* ── Quiz tab ── */}
            {activeRightTab === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <SectionHeader
                  icon={<FileQuestion className="w-4 h-4 text-[#0D9488]" />}
                  label="Quizzes"
                  count={resource.quizes?.length ?? 0}
                  onGenerate={() => setQuizModal(true)}
                />

                {quizWorkflow.loading && (
                  <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-[#0D9488]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    <span>{quizWorkflow.statusMessage ?? "Generating quiz with AI..."}</span>
                  </div>
                )}

                {!resource.quizes?.length && !quizWorkflow.loading && (
                  <EmptyState label="No quizzes generated yet" onGenerate={() => setQuizModal(true)} />
                )}

                {resource.quizes?.map((quiz) => (
                  <ContentItem
                    key={quiz.quiz_id}
                    id={quiz.quiz_id}
                    title={quiz.title}
                    subtitle={quiz.type}
                    isActive={activeQuizId === quiz.quiz_id}
                    onOpen={() => {
                      setActiveQuizId(quiz.quiz_id);
                      onQuizOpen(quiz.quiz_id);
                    }}
                    onDelete={() => deleteQuiz(quiz.quiz_id)}
                    onRename={(t) => renameQuiz(quiz.quiz_id, t)}
                  />
                ))}
              </motion.div>
            )}

            {/* ── Notes tab ── */}
            {activeRightTab === "notes" && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <SectionHeader
                  icon={<StickyNote className="w-4 h-4 text-[#0D9488]" />}
                  label="Notes"
                  count={resource.notes?.length ?? 0}
                  onGenerate={() => setNotesModal(true)}
                />

                {notesWorkflow.loading && (
                  <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-[#0D9488]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    <span>{notesWorkflow.statusMessage ?? "Generating notes with AI..."}</span>
                  </div>
                )}

                {!resource.notes?.length && !notesWorkflow.loading && (
                  <EmptyState label="No smart notes generated yet" onGenerate={() => setNotesModal(true)} />
                )}

                {resource.notes?.map((note) => (
                  <ContentItem
                    key={note.note_id}
                    id={note.note_id}
                    title={note.title}
                    subtitle="DOCX"
                    isActive={activeNoteId === note.note_id}
                    onOpen={() => {
                      setActiveNoteId(note.note_id);
                      onNoteOpen(note.note_id);
                    }}
                    onDelete={() => deleteNote(note.note_id)}
                    onRename={(t) => renameNote(note.note_id, t)}
                  />
                ))}
              </motion.div>
            )}

            {/* ── Flashcards tab ── */}
            {activeRightTab === "flashcards" && (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <SectionHeader
                  icon={<CreditCard className="w-4 h-4 text-[#0D9488]" />}
                  label="Flashcards"
                  count={resource.flashcards?.length ?? 0}
                  onGenerate={() => setFlashcardModal(true)}
                />

                {flashcardWorkflow.loading && (
                  <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-[#0D9488]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    <span>{flashcardWorkflow.statusMessage ?? "Generating flashcards with AI..."}</span>
                  </div>
                )}

                {!resource.flashcards?.length && !flashcardWorkflow.loading && (
                  <EmptyState label="No flashcards generated yet" onGenerate={() => setFlashcardModal(true)} />
                )}

                {resource.flashcards?.map((fc) => (
                  <ContentItem
                    key={fc.flashcard_id}
                    id={fc.flashcard_id}
                    title={fc.title}
                    isActive={activeFlashcardId === fc.flashcard_id}
                    onOpen={() => {
                      setActiveFlashcardId(fc.flashcard_id);
                      onFlashcardOpen(fc.flashcard_id);
                    }}
                    onDelete={() => deleteFlashcard(fc.flashcard_id)}
                    onRename={(t) => renameFlashcard(fc.flashcard_id, t)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

// ── File card ──────────────────────────────────────────────────
function FileCard({ file }: { file: { file_name: string; file_url: string; file_size: number } }) {
  const ext = file.file_name.split(".").pop()?.toUpperCase() ?? "FILE";
  const size = (file.file_size / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex items-center gap-3 p-3 bg-[#FFFDF9] rounded-2xl border border-[#E6E0D6] hover:border-teal-300 hover:bg-[#FAF7F2] transition-all group shadow-xs">
      <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
        {ext}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#1C1917] truncate">{file.file_name}</p>
        <p className="text-[10px] text-[#78716C]">{size} MB</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-lg bg-[#FFFDF9] border border-[#E6E0D6] flex items-center justify-center hover:border-[#0D9488] transition-colors">
          <ExternalLink className="w-3 h-3 text-[#78716C] hover:text-[#0D9488]" />
        </a>
        <a href={file.file_url} download className="w-6 h-6 rounded-lg bg-[#FFFDF9] border border-[#E6E0D6] flex items-center justify-center hover:border-[#0D9488] transition-colors">
          <Download className="w-3 h-3 text-[#78716C] hover:text-[#0D9488]" />
        </a>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState({
  label,
  onGenerate,
}: {
  label: string;
  onGenerate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center bg-[#F5EFE6]/50 border border-[#E6E0D6] rounded-2xl p-4">
      <Sparkles className="w-6 h-6 text-[#0D9488]" />
      <p className="text-xs text-[#78716C]">{label}</p>
      <button
        onClick={onGenerate}
        className="text-xs font-bold text-[#0D9488] hover:underline flex items-center gap-1 mt-1"
      >
        <Plus className="w-3 h-3 stroke-[2.5]" /> Generate with AI
      </button>
    </div>
  );
}
