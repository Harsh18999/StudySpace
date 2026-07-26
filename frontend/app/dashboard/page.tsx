"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  BookOpen,
  Loader2,
  Trash2,
  X,
  Search,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { spacesApi } from "@/lib/api";
import type { Space } from "@/lib/types";
import { useAuthStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toast";

const COLORS = [
  "from-teal-600 to-emerald-600",
  "from-emerald-500 to-teal-700",
  "from-teal-500 to-cyan-600",
  "from-[#0D9488] to-teal-600",
];

export default function DashboardHome() {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: spaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list().then((r) => r.data),
  });

  // Automatically open most recent used space when accessing dashboard
  useEffect(() => {
    if (!isLoading && spaces.length > 0) {
      const lastSpaceId = localStorage.getItem("last_active_space");
      const targetSpace = spaces.find((s) => s.id === lastSpaceId) || spaces[0];
      if (targetSpace) {
        localStorage.setItem("last_active_space", targetSpace.id);
        router.replace(`/dashboard/space/${targetSpace.id}`);
      }
    }
  }, [isLoading, spaces, router]);

  const createMutation = useMutation({
    mutationFn: () => spacesApi.create(name, desc),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      setShowCreate(false);
      setName("");
      setDesc("");
      addToast("Space created! 🎉", "success");
      if (res.data?.id) {
        localStorage.setItem("last_active_space", res.data.id);
        router.push(`/dashboard/space/${res.data.id}`);
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.name?.[0] || err?.response?.data?.detail || "Failed to create space";
      addToast(msg, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => spacesApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      addToast("Space deleted", "info");
    },
  });

  const filtered = spaces.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading || (spaces.length > 0 && !search)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF7F2]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <p className="text-sm font-medium text-[#78716C]">Opening your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-thin bg-[#FAF7F2]">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-[#E6E0D6] bg-[#FFFDF9]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
              <span className="text-xs font-semibold text-[#0D9488]">{greeting()}, {user?.name?.split(" ")[0] ?? "Learner"}!</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1C1917] mt-1 heading-font">Your Learning Spaces</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-[#F5EFE6] rounded-xl border border-[#E6E0D6]">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-[#FFFDF9] shadow-xs text-[#0D9488]" : "text-[#A8A29E]"}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-[#FFFDF9] shadow-xs text-[#0D9488]" : "text-[#A8A29E]"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-sm shadow-teal-700/20 transition-all heading-font"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> New Space
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learning spaces…"
            className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] placeholder-[#A8A29E] outline-none focus:bg-[#FFFDF9] focus:border-[#0D9488] transition-all"
          />
        </div>
      </div>

      {/* Create Space Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4"
            >
              <div className="bg-[#FFFDF9] rounded-2xl shadow-2xl p-6 border border-[#E6E0D6]">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-[#1C1917] heading-font">Create Learning Space</h2>
                  <button onClick={() => setShowCreate(false)} className="text-[#A8A29E] hover:text-[#78716C]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Space Name *</label>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createMutation.mutate()}
                      placeholder="e.g. Gate 2027 Artificial Intelligence"
                      className="w-full px-4 py-3 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Description</label>
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="What will you learn here?"
                      rows={3}
                      className="w-full px-4 py-3 bg-[#FFFDF9] border border-[#E6E0D6] rounded-xl text-sm text-[#1C1917] outline-none focus:border-[#0D9488] resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-bold text-[#78716C] hover:text-[#1C1917]">
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => createMutation.mutate()}
                      disabled={!name.trim() || createMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Create Space
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spaces list/grid */}
      <div className="px-8 py-6">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-200/80">
              <BookOpen className="w-8 h-8 text-[#0D9488]" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-[#1C1917] heading-font">No spaces yet</h3>
              <p className="text-xs text-[#78716C] mt-1">Create your first learning space to get started</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-sm shadow-teal-700/20"
            >
              <Plus className="w-4 h-4 inline mr-1.5 stroke-[2.5]" />
              Create First Space
            </motion.button>
          </motion.div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((space, i) => (
              <SpaceCard
                key={space.id}
                space={space}
                gradient={COLORS[i % COLORS.length]}
                onOpen={() => {
                  localStorage.setItem("last_active_space", space.id);
                  router.push(`/dashboard/space/${space.id}`);
                }}
                onDelete={() => deleteMutation.mutate(space.id)}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((space, i) => (
              <SpaceListRow
                key={space.id}
                space={space}
                gradient={COLORS[i % COLORS.length]}
                onOpen={() => {
                  localStorage.setItem("last_active_space", space.id);
                  router.push(`/dashboard/space/${space.id}`);
                }}
                onDelete={() => deleteMutation.mutate(space.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Space card (grid) ─────────────────────────────────────────
function SpaceCard({ space, gradient, onOpen, onDelete, deleting }: {
  space: Space; gradient: string; onOpen: () => void; onDelete: () => void; deleting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(28, 25, 23, 0.06)" }}
      className="group relative bg-[#FFFDF9] rounded-2xl border border-[#E6E0D6] shadow-xs overflow-hidden cursor-pointer transition-all hover:border-teal-300"
      onClick={onOpen}
    >
      {/* Top gradient bar */}
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white font-bold`}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <h3 className="font-bold text-[#1C1917] text-base heading-font">{space.name}</h3>
        <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">{space.description}</p>
        <div className="flex items-center gap-1 mt-4 text-[#0D9488] text-xs font-bold">
          Open space <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Space list row ─────────────────────────────────────────────
function SpaceListRow({ space, gradient, onOpen, onDelete }: {
  space: Space; gradient: string; onOpen: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      className="group flex items-center gap-4 p-4 bg-[#FFFDF9] rounded-2xl border border-[#E6E0D6] shadow-xs cursor-pointer hover:border-teal-300 transition-all"
      onClick={onOpen}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white font-bold`}>
        <BookOpen className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#1C1917] text-sm heading-font">{space.name}</h3>
        <p className="text-xs text-[#78716C] truncate">{space.description}</p>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 flex items-center justify-center">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <ChevronRight className="w-4 h-4 text-[#0D9488]" />
      </div>
    </motion.div>
  );
}
