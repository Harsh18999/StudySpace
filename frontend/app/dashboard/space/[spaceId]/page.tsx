"use client";
import { use, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { spacesApi, resourcesApi } from "@/lib/api";
import { ModuleSidebar } from "@/components/dashboard/ModuleSidebar";
import { useLMSStore } from "@/store/useStore";
import { VideoPlayer } from "@/components/dashboard/VideoPlayer";
import { ResourcesPanel } from "@/components/dashboard/ResourcesPanel";
import { QuizPanel } from "@/components/dashboard/QuizPanel";
import { NotesEditor } from "@/components/dashboard/NotesEditor";
import { FlashcardViewer } from "@/components/dashboard/FlashcardViewer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  BookOpen,
  Loader2,
  FileQuestion,
  StickyNote,
  CreditCard,
  PanelRightOpen,
  PanelRightClose,
  Sparkles,
} from "lucide-react";
import type { SpaceDetail, Resource } from "@/lib/types";

interface Props {
  params: Promise<{ spaceId: string }>;
}

type ActiveContent =
  | { type: "video" }
  | { type: "quiz"; quizId: string }
  | { type: "note"; noteId: string }
  | { type: "flashcard"; flashcardId: string };

export default function SpacePage({ params }: Props) {
  const { spaceId } = use(params);
  const { activeResource, setActiveResource } = useLMSStore();

  const [resourceOverrides, setResourceOverrides] = useState<Partial<Resource>>({});
  const [activeContent, setActiveContent] = useState<ActiveContent>({ type: "video" });
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const savedWidth = localStorage.getItem("right_panel_width");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 280 && parsed <= 650) {
        setRightPanelWidth(parsed);
      }
    }
  }, []);

  const startResizingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(600, window.innerWidth - moveEvent.clientX));
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

  const { data: space, isLoading } = useQuery<SpaceDetail>({
    queryKey: ["space", spaceId],
    queryFn: () => spacesApi.retrieve(spaceId).then((r) => r.data),
  });

  const mergedResource: Resource | null = activeResource
    ? { ...activeResource, ...resourceOverrides }
    : null;

  const handleSelectResource = useCallback(
    async (resource: Resource) => {
      setResourceOverrides({});
      setActiveContent({ type: "video" });

      try {
        const { data } = await resourcesApi.retrieve(resource.id);
        setActiveResource({ ...resource, ...data });
      } catch {
        setActiveResource(resource);
      }
    },
    [setActiveResource]
  );

  const handleResourceUpdated = useCallback((updated: Partial<Resource>) => {
    setResourceOverrides((prev) => ({ ...prev, ...updated }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <p className="text-sm text-[#78716C] font-medium">Loading space…</p>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF7F2]">
        <p className="text-[#78716C] text-sm">Space not found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Module sidebar (resizable left) */}
      <ModuleSidebar
        spaceId={spaceId}
        space={space}
        onSelectResource={handleSelectResource}
      />

      {/* Main learning area */}
      <div className="flex flex-1 overflow-hidden relative bg-[#FAF7F2]">
        {/* Main content area */}
        <div className={`flex-1 scroll-thin ${activeContent.type === "note" ? "overflow-hidden flex flex-col p-6" : "overflow-y-auto p-6"}`}>
          {/* Top Control Bar for toggling Right Sidebar */}
          {mergedResource && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
                <BookOpen className="w-4 h-4 text-[#0D9488]" />
                <span className="text-[#1C1917] font-bold">{space.name}</span>
              </div>

              {/* Top bar outlined pill button in emerald accent */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRightPanelOpen((open) => !open)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all shadow-xs heading-font ${
                  rightPanelOpen
                    ? "bg-teal-50/80 border-teal-200 text-[#0D9488]"
                    : "bg-[#FFFDF9] border-[#E6E0D6] text-[#78716C] hover:border-teal-300"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>AI Tools & Resources</span>
                {rightPanelOpen ? (
                  <PanelRightClose className="w-4 h-4 text-[#0D9488]" />
                ) : (
                  <PanelRightOpen className="w-4 h-4 text-[#A8A29E]" />
                )}
              </motion.button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {mergedResource ? (
              <>
                {/* Video always mounted when resource selected */}
                <motion.div
                  key={`video-${mergedResource.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: activeContent.type === "video" ? "block" : "none" }}
                  className="max-w-5xl mx-auto"
                >
                  <VideoPlayer resource={mergedResource} />
                </motion.div>

                {/* Quiz viewer */}
                {activeContent.type === "quiz" && (
                  <motion.div
                    key={`quiz-${activeContent.quizId}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-4xl mx-auto"
                  >
                    <ContentHeader
                      icon={<FileQuestion className="w-5 h-5 text-[#0D9488]" />}
                      label="Quiz"
                      onBackToVideo={() => setActiveContent({ type: "video" })}
                    />
                    <QuizPanel
                      quizId={activeContent.quizId}
                      onBack={() => setActiveContent({ type: "video" })}
                    />
                  </motion.div>
                )}

                {/* Note viewer */}
                {activeContent.type === "note" && (
                  <motion.div
                    key={`note-${activeContent.noteId}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col flex-1 h-full"
                  >
                    <NotesEditor
                      noteId={activeContent.noteId}
                      onBack={() => setActiveContent({ type: "video" })}
                    />
                  </motion.div>
                )}

                {/* Flashcard viewer */}
                {activeContent.type === "flashcard" && (
                  <motion.div
                    key={`flashcard-${activeContent.flashcardId}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-3xl mx-auto"
                  >
                    <ContentHeader
                      icon={<CreditCard className="w-5 h-5 text-[#0D9488]" />}
                      label="Flashcards"
                      onBackToVideo={() => setActiveContent({ type: "video" })}
                    />
                    <FlashcardViewer
                      flashcardId={activeContent.flashcardId}
                      onBack={() => setActiveContent({ type: "video" })}
                    />
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[60vh] gap-5"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-3xl bg-teal-50 border border-teal-200/80 flex items-center justify-center shadow-xs"
                >
                  <Play className="w-9 h-9 text-[#0D9488] ml-1 fill-[#0D9488]" />
                </motion.div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-[#1C1917] heading-font">Select a video to start learning</h2>
                  <p className="text-[#78716C] text-sm mt-2 max-w-sm">
                    Expand a module in the sidebar and click on a video to begin your learning session.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                  <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>{space.name}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        <AnimatePresence>
          {mergedResource && rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: rightPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: isResizingRight ? 0 : 0.2 }}
              className="flex-shrink-0 border-l border-[#E6E0D6] bg-[#FFFDF9] overflow-hidden relative group"
              style={{ width: rightPanelWidth }}
            >
              {/* Left Resizable Drag Handle */}
              <div
                onMouseDown={startResizingRight}
                className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-[#0D9488]/30 active:bg-[#0D9488]/60 z-30 transition-colors"
                title="Drag to resize panel"
              />

              <ResourcesPanel
                resource={mergedResource}
                onQuizOpen={(quizId) => setActiveContent({ type: "quiz", quizId })}
                onNoteOpen={(noteId) => setActiveContent({ type: "note", noteId })}
                onFlashcardOpen={(flashcardId) => setActiveContent({ type: "flashcard", flashcardId })}
                onResourceUpdated={handleResourceUpdated}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── Content area header ────────────────────────────────────────
function ContentHeader({
  icon,
  label,
  onBackToVideo,
}: {
  icon: React.ReactNode;
  label: string;
  onBackToVideo: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E6E0D6]">
      <div className="w-9 h-9 rounded-xl bg-[#F5EFE6] flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-[#1C1917] flex-1 heading-font">{label}</h2>
      <button
        onClick={onBackToVideo}
        className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#0D9488] px-3 py-1.5 rounded-xl border border-[#E6E0D6] hover:border-teal-300 transition-all bg-[#FFFDF9] shadow-xs"
      >
        <Play className="w-3 h-3 fill-current" /> Back to Video
      </button>
    </div>
  );
}
