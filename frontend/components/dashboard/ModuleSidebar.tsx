"use client";
import { useState, useEffect } from "react";
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
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  FolderOpen,
  Video,
  Trash2,
  X,
  MoreVertical,
  Edit2,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesApi, modulesApi, resourceApi } from "@/lib/api";
import type { SpaceDetail, ModuleDetail, Resource } from "@/lib/types";
import { useLMSStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";
import { ContextMenu, useContextMenu } from "@/components/ui/ContextMenu";

interface Props {
  spaceId: string;
  space: SpaceDetail;
  onSelectResource?: (resource: Resource) => void;
}

function formatDuration(dur: string) {
  if (!dur) return "—";
  const match = dur.match(/(\d+):(\d+):(\d+)/);
  if (match) {
    const h = parseInt(match[1]);
    const m = match[2];
    const s = match[3];
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }
  return dur;
}

export function ModuleSidebar({ spaceId, space, onSelectResource }: Props) {
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);

  const { activeResource, setActiveResource } = useLMSStore();
  const handleSelectResource = onSelectResource ?? setActiveResource;
  const qc = useQueryClient();
  const { addToast } = useToast();

  // Resizable width state
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("left_sidebar_width");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 240 && parsed <= 550) {
        setSidebarWidth(parsed);
      }
    }
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(550, moveEvent.clientX - 80));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      localStorage.setItem("left_sidebar_width", sidebarWidth.toString());
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const { data: spaceDetail, isLoading } = useQuery({
    queryKey: ["space", spaceId],
    queryFn: () => spacesApi.retrieve(spaceId).then((r) => r.data),
    enabled: !!spaceId,
  });

  const [moduleDetails, setModuleDetails] = useState<Record<string, ModuleDetail>>({});
  const modules = spaceDetail?.modules ?? [];

  useEffect(() => {
    if (modules.length) {
      setModuleOrder((prevOrder) => {
        const existingIds = new Set(prevOrder);
        const newIds = modules.map((m: { id: string }) => m.id);
        const addedIds = newIds.filter((id: string) => !existingIds.has(id));
        if (addedIds.length === 0 && prevOrder.length === newIds.length) {
          return prevOrder;
        }
        return [...prevOrder.filter((id) => newIds.includes(id)), ...addedIds];
      });
    }
  }, [modules]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModuleOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const toggleModule = async (moduleId: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) {
      next.delete(moduleId);
    } else {
      next.add(moduleId);
      if (!moduleDetails[moduleId]) {
        try {
          const { data } = await modulesApi.retrieve(moduleId);
          setModuleDetails((prev) => ({ ...prev, [moduleId]: data }));
        } catch {
          addToast("Failed to load module", "error");
        }
      }
    }
    setExpandedModules(next);
  };

  const handleAddModule = async () => {
    if (!newModuleName.trim()) return;
    setAddingModule(true);
    try {
      const { data: newMod } = await modulesApi.create(newModuleName.trim(), spaceId);
      if (newMod?.id) {
        setModuleOrder((prev) => [...prev, newMod.id]);
        setExpandedModules((prev) => new Set([...prev, newMod.id]));
      }
      await qc.invalidateQueries({ queryKey: ["space", spaceId] });
      await qc.invalidateQueries({ queryKey: ["spaces"] });
      await qc.invalidateQueries({ queryKey: ["space-quizzes", spaceId] });
      setNewModuleName("");
      setShowAddModule(false);
      addToast("Module created!", "success");
    } catch {
      addToast("Failed to create module", "error");
    } finally {
      setAddingModule(false);
    }
  };

  const handleAddVideo = async (moduleId: string) => {
    if (!videoUrl.trim()) return;
    setAddingVideo(true);
    try {
      const { resourcesApi } = await import("@/lib/api");
      const isPlaylist = videoUrl.includes("list=");
      if (isPlaylist) {
        await resourcesApi.addPlaylist(videoUrl.trim(), moduleId);
        addToast("Playlist added!", "success");
      } else {
        await resourcesApi.addVideo(videoUrl.trim(), moduleId);
        addToast("Video added!", "success");
      }
      const { data } = await modulesApi.retrieve(moduleId);
      setModuleDetails((prev) => ({ ...prev, [moduleId]: data }));
      setVideoUrl("");
      setShowAddVideo(null);
    } catch {
      addToast("Failed to add video. Check the URL.", "error");
    } finally {
      setAddingVideo(false);
    }
  };

  const handleRenameModule = async (moduleId: string, newName: string) => {
    try {
      await modulesApi.update(moduleId, newName);
      qc.invalidateQueries({ queryKey: ["space", spaceId] });
      addToast("Module renamed!", "success");
    } catch {
      addToast("Failed to rename module", "error");
      throw new Error("Failed to rename module");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module? This will also delete all resources inside it.")) return;
    try {
      await modulesApi.destroy(moduleId);
      qc.invalidateQueries({ queryKey: ["space", spaceId] });
      addToast("Module deleted!", "info");
    } catch {
      addToast("Failed to delete module", "error");
    }
  };

  const orderedModules = moduleOrder
    .map((id) => modules.find((m: { id: string }) => m.id === id))
    .filter(Boolean) as { id: string; name: string }[];

  const filteredModules = orderedModules.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="flex flex-col flex-shrink-0 h-full overflow-hidden relative group bg-[#FAF7F2] border-r border-[#E6E0D6]"
      style={{
        width: sidebarWidth,
        transition: isResizing ? "none" : "width 0.15s ease",
      }}
    >
      {/* Resizable Drag Handle on Right Border */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#0D9488]/30 active:bg-[#0D9488]/60 z-30 transition-colors"
        title="Drag to resize sidebar"
      />

      {/* Header */}
      <div className="p-4 border-b border-[#E6E0D6] bg-[#FAF7F2]">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 pr-2">
            <h3 className="font-bold text-[#1C1917] text-base truncate heading-font">{space.name}</h3>
            {space.description && (
              <p className="text-xs text-[#78716C] truncate mt-0.5">{space.description}</p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowAddModule(true)}
            className="w-8 h-8 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white flex items-center justify-center shadow-sm shadow-teal-700/20 flex-shrink-0 font-bold transition-all"
            title="Add Module"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A29E]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules & topics…"
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 transition-all"
          />
        </div>
      </div>

      {/* Add module form */}
      <AnimatePresence>
        {showAddModule && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-[#E6E0D6] bg-[#F5EFE6]"
          >
            <div className="p-3 flex gap-2">
              <input
                autoFocus
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                placeholder="Module title (e.g. Diffusion Models)…"
                className="flex-1 px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-[#1C1917] outline-none focus:border-[#0D9488]"
              />
              <button
                onClick={handleAddModule}
                disabled={addingModule}
                className="px-3 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold disabled:opacity-60"
              >
                {addingModule ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
              </button>
              <button onClick={() => setShowAddModule(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#FFFDF9] animate-pulse border border-[#E6E0D6]" />
            ))}
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <FolderOpen className="w-10 h-10 text-[#A8A29E]" />
            <p className="text-sm text-[#78716C] text-center">
              {search ? "No modules match" : "No modules created yet"}
            </p>
            {!search && (
              <button
                onClick={() => setShowAddModule(true)}
                className="text-xs text-[#0D9488] font-semibold hover:underline"
              >
                + Add first module section
              </button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={moduleOrder} strategy={verticalListSortingStrategy}>
              {filteredModules.map((module) => (
                <SortableModule
                  key={module.id}
                  module={module}
                  expanded={expandedModules.has(module.id)}
                  onToggle={() => toggleModule(module.id)}
                  detail={moduleDetails[module.id]}
                  activeResource={activeResource}
                  onSelectResource={(r) => handleSelectResource(r)}
                  onAddVideo={() => setShowAddVideo(module.id)}
                  showAddVideo={showAddVideo === module.id}
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  onAddVideoSubmit={() => handleAddVideo(module.id)}
                  addingVideo={addingVideo}
                  onCloseAddVideo={() => setShowAddVideo(null)}
                  onDeleteResource={async (resourceId) => {
                    try {
                      await resourceApi.destroy(resourceId);
                      const { data } = await modulesApi.retrieve(module.id);
                      setModuleDetails((prev) => ({ ...prev, [module.id]: data }));
                      addToast("Resource deleted", "info");
                    } catch {
                      addToast("Failed to delete resource", "error");
                    }
                  }}
                  onRename={async (newName) => {
                    await handleRenameModule(module.id, newName);
                  }}
                  onDelete={async () => {
                    await handleDeleteModule(module.id);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// ── Sortable module row ───────────────────────────────────────
interface SortableModuleProps {
  module: { id: string; name: string };
  expanded: boolean;
  onToggle: () => void;
  detail?: ModuleDetail;
  activeResource: Resource | null;
  onSelectResource: (r: Resource) => void;
  onAddVideo: () => void;
  showAddVideo: boolean;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  onAddVideoSubmit: () => void;
  addingVideo: boolean;
  onCloseAddVideo: () => void;
  onDeleteResource: (resourceId: string) => void;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

function SortableModule({
  module,
  expanded,
  onToggle,
  detail,
  activeResource,
  onSelectResource,
  onAddVideo,
  showAddVideo,
  videoUrl,
  setVideoUrl,
  onAddVideoSubmit,
  addingVideo,
  onCloseAddVideo,
  onDeleteResource,
  onRename,
  onDelete,
}: SortableModuleProps) {
  const { menu: ctxMenu, open: openCtx, close: closeCtx } = useContextMenu();
  const { menu: moduleMenu, open: openModuleMenu, close: closeModuleMenu } = useContextMenu();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(module.name);

  useEffect(() => {
    setEditName(module.name);
  }, [module.name]);

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === module.name) {
      setIsEditing(false);
      setEditName(module.name);
      return;
    }
    try {
      await onRename(trimmed);
    } catch {
      setEditName(module.name);
    } finally {
      setIsEditing(false);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl bg-[#FFFDF9] border border-[#E6E0D6] transition-all shadow-xs overflow-hidden ${
        expanded ? "border-[#D6CEC0]" : "hover:border-[#D6CEC0]"
      }`}
    >
      {moduleMenu && (
        <ContextMenu
          x={moduleMenu.x}
          y={moduleMenu.y}
          items={moduleMenu.items}
          onClose={closeModuleMenu}
        />
      )}

      {/* Module Card Header */}
      <div
        className="p-3 cursor-pointer select-none group flex flex-col gap-2 bg-[#FFFDF9] hover:bg-[#F5EFE6] transition-colors"
        onClick={() => {
          if (!isEditing) {
            onToggle();
          }
        }}
      >
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-[#A8A29E] hover:text-[#78716C] transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 text-[#A8A29E] group-hover:text-[#0D9488]" />
          </motion.div>

          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                else if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditName(module.name);
                }
              }}
              onBlur={handleRename}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-2 py-1 text-xs bg-[#FFFDF9] border border-[#0D9488] rounded-lg outline-none text-[#1C1917]"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="flex-1 text-xs font-bold text-[#1C1917] truncate heading-font"
            >
              {module.name}
            </span>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onAddVideo(); }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-[#A8A29E] hover:text-[#0D9488] hover:bg-teal-50 transition-all"
            title="Add Video"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              openModuleMenu(e, [
                {
                  label: "Rename",
                  icon: <Edit2 className="w-3.5 h-3.5" />,
                  onClick: () => setIsEditing(true),
                },
                {
                  label: "Delete Section",
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  onClick: onDelete,
                  variant: "danger",
                },
              ]);
            }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-[#A8A29E] hover:text-[#0D9488] hover:bg-teal-50 transition-all"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Add video form */}
      <AnimatePresence>
        {showAddVideo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 bg-[#F5EFE6] border-t border-[#E6E0D6]"
          >
            <div className="flex gap-1.5 py-2.5">
              <input
                autoFocus
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddVideoSubmit()}
                placeholder="YouTube URL or playlist URL…"
                className="flex-1 px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-[#1C1917] outline-none focus:border-[#0D9488]"
              />
              <button
                onClick={onAddVideoSubmit}
                disabled={addingVideo}
                className="px-3 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs disabled:opacity-60"
              >
                {addingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
              </button>
              <button onClick={onCloseAddVideo} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Video List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-[#E6E0D6] bg-[#FAF7F2] p-2 space-y-2"
          >
            {!detail ? (
              <div className="p-3 text-center">
                <Loader2 className="w-4 h-4 animate-spin text-[#0D9488] mx-auto" />
              </div>
            ) : detail.resources.length === 0 ? (
              <p className="text-xs text-[#78716C] p-2 text-center">No video lessons yet. Click + to add.</p>
            ) : (
              <>
                {ctxMenu && (
                  <ContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    items={ctxMenu.items}
                    onClose={closeCtx}
                  />
                )}
                {detail.resources.map((resource) => {
                  const yt = resource.youtube;
                  const isActive = activeResource?.id === resource.id;
                  const duration = formatDuration(yt?.duration ?? "");

                  return (
                    <motion.div
                      key={resource.id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => onSelectResource(resource)}
                      onContextMenu={(e) =>
                        openCtx(e, [
                          {
                            label: "Play Lesson",
                            icon: <Play className="w-3.5 h-3.5 text-[#0D9488]" />,
                            onClick: () => onSelectResource(resource),
                          },
                          {
                            label: "Delete Video",
                            icon: <Trash2 className="w-3.5 h-3.5" />,
                            onClick: () => onDeleteResource(resource.id),
                            variant: "danger",
                          },
                        ])
                      }
                      /* Selected lesson: soft emerald-tinted background + left 3px accent bar */
                      className={`group/item flex gap-3 p-2 rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                        isActive
                          ? "bg-teal-50/80 border-[#E6E0D6] border-l-4 border-l-[#0D9488] shadow-xs"
                          : "bg-[#FFFDF9] border-[#E6E0D6] hover:border-[#D6CEC0] hover:bg-[#F5EFE6]"
                      }`}
                    >
                      {/* Video Thumbnail */}
                      <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 relative group/thumb bg-slate-900 border border-[#E6E0D6]">
                        {yt?.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={yt.thumbnail_url}
                            alt={yt.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 ease-out"
                          />
                        ) : (
                          <Video className="w-5 h-5 text-slate-400 absolute inset-0 m-auto" />
                        )}

                        {/* Contrast overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Duration badge */}
                        {duration && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white font-semibold leading-none">
                            {duration}
                          </span>
                        )}

                        {isActive && (
                          <div className="absolute inset-0 bg-[#0D9488]/30 backdrop-blur-[1px] flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isActive ? "text-[#1C1917] font-bold" : "text-[#78716C] group-hover/item:text-[#1C1917]"}`}>
                          {yt?.title ?? "Untitled Lesson"}
                        </p>
                        <div className="flex items-center justify-end text-[10px] text-[#78716C] mt-1">
                          {isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-[#D6CEC0]" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
