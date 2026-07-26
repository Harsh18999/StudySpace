"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  LayoutGrid,
  BarChart2,
  FileQuestion,
  StickyNote,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  X,
  Check,
  ChevronRight,
  Loader2,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/useStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesApi, authApi } from "@/lib/api";
import type { Space } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

const navItems = [
  { icon: BarChart2, label: "Analytics Report", href: "/dashboard/analytics" },
  { icon: LayoutGrid, label: "Overview", href: "/dashboard" },
  { icon: FileQuestion, label: "Quizzes", href: "/dashboard/quizzes" },
  { icon: CreditCard, label: "Flashcards", href: "/dashboard/flashcards" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function IconSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { addToast } = useToast();
  const qc = useQueryClient();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showSpacesPopover, setShowSpacesPopover] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");

  const { data: spaces = [] } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list().then((r) => r.data),
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => authApi.profile().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => spacesApi.create(newSpaceName, newSpaceDesc),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["spaces"] });
      setShowCreateModal(false);
      setNewSpaceName("");
      setNewSpaceDesc("");
      addToast("Space created!", "success");
      if (res.data?.id) {
        localStorage.setItem("last_active_space", res.data.id);
        router.push(`/dashboard/space/${res.data.id}`);
      }
    },
    onError: () => {
      addToast("Failed to create space", "error");
    },
  });

  const handleLogout = () => {
    logout();
    router.replace("/auth");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "SB";

  // Check which space is currently active
  const currentSpaceId = pathname.startsWith("/dashboard/space/")
    ? pathname.split("/")[3]
    : null;

  return (
    <>
      <div
        className="flex-shrink-0 w-[80px] bg-[#1C1917] flex flex-col items-center py-5 gap-3 relative z-30 border-r border-stone-800"
      >
        {/* Top Book Icon / Space Switcher Trigger */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSpacesPopover((v) => !v)}
            title="Switch Space / View All Spaces"
            className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#059669] flex items-center justify-center shadow-lg shadow-teal-900/30 relative transition-all ${showSpacesPopover ? "ring-2 ring-white scale-105" : ""
              }`}
          >
            <BookOpen className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#1C1917]" />
          </motion.button>

          {/* Spaces Popover */}
          <AnimatePresence>
            {showSpacesPopover && (
              <>
                {/* Backdrop to dismiss */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSpacesPopover(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-[88px] top-0 z-50 w-72 bg-[#1C1917] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-3.5"
                >
                  <div className="flex items-center justify-between px-2 pb-3 border-b border-stone-800">
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Learning Spaces</span>
                    <button
                      onClick={() => setShowSpacesPopover(false)}
                      className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Spaces list */}
                  <div className="max-h-60 overflow-y-auto scroll-thin py-2 flex flex-col gap-1">
                    {spaces.length === 0 ? (
                      <p className="text-xs text-stone-400 text-center py-4">No spaces created yet</p>
                    ) : (
                      spaces.map((s) => {
                        const isActive = currentSpaceId === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              localStorage.setItem("last_active_space", s.id);
                              router.push(`/dashboard/space/${s.id}`);
                              setShowSpacesPopover(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                              ? "bg-[#0D9488] text-white shadow-md shadow-teal-900/30"
                              : "text-stone-300 hover:bg-stone-800 hover:text-white"
                              }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-teal-500/20 text-teal-300"
                              }`}>
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{s.name}</p>
                              {s.description && (
                                <p className={`text-[10px] truncate ${isActive ? "text-teal-100" : "text-stone-400"}`}>
                                  {s.description}
                                </p>
                              )}
                            </div>
                            {isActive && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Create New Space action */}
                  <div className="pt-2.5 border-t border-stone-800">
                    <button
                      onClick={() => {
                        setShowSpacesPopover(false);
                        setShowCreateModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Plus className="w-4 h-4" /> Create New Space
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items — 22px Icons */}
        <nav className="flex flex-col items-center gap-2 flex-1 w-full px-2">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <div
                key={label}
                className="relative w-full flex justify-center"
                onMouseEnter={() => setHoveredItem(label)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <motion.button
                  onClick={() => router.push(href)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150 ${isActive
                    ? "text-white bg-[#0D9488] shadow-lg shadow-teal-900/30"
                    : "text-stone-400 hover:text-white hover:bg-stone-800"
                    }`}
                >
                  <Icon className="w-[22px] h-[22px]" />
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredItem === label && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.12 }}
                      className="tooltip-content"
                    >
                      {label}
                      <ChevronRight className="w-3 h-3 inline ml-1 opacity-60" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom Profile / Logout / Credits */}
        <div className="flex flex-col items-center gap-3 relative">
          {/* Credit Showcase Badge */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredItem("Credits")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <motion.button
              onClick={() => router.push("/dashboard/settings")}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-[9px] font-black text-amber-300 -mt-0.5">{profileData?.wallet ?? 0}</span>
            </motion.button>
            <AnimatePresence>
              {hoveredItem === "Credits" && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="tooltip-content !text-amber-200 !bg-stone-900 border border-amber-500/40"
                >
                  Wallet: {profileData?.wallet ?? 0} Credits ⚡ (Click to Top Up)
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            className="relative"
            onMouseEnter={() => setHoveredItem("Logout")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-[22px] h-[22px]" />
            </motion.button>
            <AnimatePresence>
              {hoveredItem === "Logout" && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="tooltip-content !text-red-300 !bg-stone-900 border border-red-900/50"
                >
                  Sign out
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            onClick={() => router.push("/dashboard/settings")}
            title="Go to Settings & Add Credits"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D9488] to-[#14B8A6] flex items-center justify-center text-white text-xs font-bold cursor-pointer ring-2 ring-teal-500/30"
          >
            {initials}
          </motion.div>
        </div>
      </div>

      {/* Modal for creating a new space */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
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
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-[#1C1917]">Create Learning Space</h2>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="text-[#A8A29E] hover:text-[#78716C]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Space Name *</label>
                    <input
                      autoFocus
                      value={newSpaceName}
                      onChange={(e) => setNewSpaceName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createMutation.mutate()}
                      placeholder="e.g. Machine Learning 101"
                      className="w-full px-4 py-2.5 border border-[#E6E0D6] rounded-xl text-sm outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1C1917] mb-1.5 block">Description</label>
                    <textarea
                      value={newSpaceDesc}
                      onChange={(e) => setNewSpaceDesc(e.target.value)}
                      placeholder="What will you learn here?"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-[#E6E0D6] rounded-xl text-sm outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-teal-500/15 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => createMutation.mutate()}
                      disabled={!newSpaceName.trim() || createMutation.isPending}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
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
    </>
  );
}
