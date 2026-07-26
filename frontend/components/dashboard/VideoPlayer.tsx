"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Maximize,
  Download,
  Bookmark,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
} from "lucide-react";
import type { Resource } from "@/lib/types";
import { useUIStore } from "@/store/useStore";

import { VideoDoubtChat } from "./VideoDoubtChat";

interface Props {
  resource: Resource;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VideoPlayer({ resource }: Props) {
  const yt = resource.youtube;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { activeTab, setActiveTab } = useUIStore();

  useEffect(() => {
    setPlaying(false);
    setLoaded(false);
  }, [resource.id]);

  if (!yt) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#F5EFE6] rounded-2xl border border-[#E6E0D6]">
        <p className="text-[#78716C] text-sm font-medium">No video available for this resource.</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${yt.video_id}?enablejsapi=1&modestbranding=1&rel=0&autoplay=${playing ? 1 : 0}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Intentional Dark Stage for Video Contrast */}
      <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-900">
        {!loaded && (
          <div className="absolute inset-0 z-10 bg-slate-900 animate-pulse rounded-2xl flex items-center justify-center">
            <span className="text-xs text-teal-400 font-semibold">Loading player frame…</span>
          </div>
        )}

        <div className="aspect-video">
          <iframe
            ref={iframeRef}
            key={resource.id}
            src={embedUrl}
            title={yt.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Frosted Dark Overlay Controls for Stage Contrast */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
          {/* Play/Pause toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setPlaying(!playing)}
            className="w-9 h-9 rounded-full bg-[#0D9488] hover:bg-[#0F766E] flex items-center justify-center text-white font-bold shadow-md transition-all"
          >
            {playing ? <Pause className="w-4 h-4 fill-white stroke-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white stroke-white" />}
          </motion.button>

          {/* Speed selector */}
          <div className="relative ml-3">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-white/80 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5 border border-white/10"
            >
              <span>{speed}x</span>
              {showSpeedMenu ? <ChevronUp className="w-3 h-3 text-teal-400" /> : <ChevronDown className="w-3 h-3 text-teal-400" />}
            </button>
            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-50 py-1"
                >
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                      className={`block w-full px-4 py-1.5 text-xs text-left transition-colors ${s === speed ? "bg-[#0D9488] text-white font-bold" : "text-white/80 hover:bg-white/10"
                        }`}
                    >
                      {s}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          {/* Bookmark toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setBookmarked(!bookmarked)}
            className={`text-white/80 hover:text-white transition-colors mr-3.5 ${bookmarked ? "!text-amber-400" : ""}`}
            title="Bookmark lesson"
          >
            <Bookmark className={`w-4.5 h-4.5 ${bookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
          </motion.button>

          {/* Fullscreen */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            className="text-white/80 hover:text-teal-400 transition-colors"
            onClick={() => iframeRef.current?.requestFullscreen()}
            title="Fullscreen"
          >
            <Maximize className="w-4.5 h-4.5" />
          </motion.button>
        </div>
      </div>

      {/* Video Metadata Below Player — Creamy Soft Linen Style */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1C1917] tracking-tight leading-snug heading-font">
          {yt.title}
        </h1>

        <div className="flex items-center gap-3 flex-wrap text-xs text-[#78716C]">
          {/* Instructor / Channel (only if available) */}
          {yt.channel_name && (
            <div className="flex items-center gap-1.5 font-semibold text-[#1C1917] bg-[#FFFDF9] border border-[#E6E0D6] px-3 py-1.5 rounded-xl shadow-xs">
              <div className="w-5 h-5 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center text-[10px] font-bold">
                <User className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>{yt.channel_name}</span>
            </div>
          )}

          {/* Duration */}
          {yt.duration && (
            <div className="flex items-center gap-1.5 font-medium bg-[#FFFDF9] border border-[#E6E0D6] px-3 py-1.5 rounded-xl shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#A8A29E]" />
              <span>{yt.duration.slice(0, 8)}</span>
            </div>
          )}

          {bookmarked && (
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-1">
              <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" /> Bookmarked
            </span>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Overview / Transcript / AI Doubt Discussion) */}
      <div className="pt-2">
        <div className="flex border-b border-[#E6E0D6] mb-5 bg-[#FFFDF9] rounded-t-2xl px-2">
          {[
            { id: "overview", label: "Overview" },
            { id: "transcript", label: "Transcript" },
            { id: "discussion", label: "AI Doubt Discussion" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative px-5 py-3 text-xs font-bold transition-all rounded-t-xl heading-font ${
                activeTab === tab.id
                  ? "text-[#0D9488]"
                  : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5EFE6]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D9488] rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-5 text-sm"
            >
              <div className="bg-[#FFFDF9] p-5 rounded-2xl border border-[#E6E0D6] shadow-xs">
                <h3 className="text-base font-bold text-[#1C1917] mb-2 heading-font">Description</h3>
                <p className="text-[#78716C] leading-relaxed text-xs md:text-sm">
                  {yt.description || "No description available for this video."}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === "transcript" && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm text-[#78716C] bg-[#FFFDF9] rounded-2xl p-5 border border-[#E6E0D6] shadow-xs"
            >
              <p className="font-bold text-[#1C1917] mb-2 heading-font">Auto-generated transcript</p>
              <p className="text-[#78716C]">Transcript details will appear here once AI processing completes.</p>
            </motion.div>
          )}

          {activeTab === "discussion" && (
            <motion.div
              key="discussion"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <VideoDoubtChat resource={resource} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
