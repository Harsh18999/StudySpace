"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  FileText,
  Download,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Monitor,
} from "lucide-react";
import type { NoteDetail } from "@/lib/types";
import { aiApi } from "@/lib/api";

interface Props {
  noteId: string;
  onBack: () => void;
}

type ViewerEngine = "office" | "google";

function buildViewerUrl(downloadUrl: string, engine: ViewerEngine): string {
  const encoded = encodeURIComponent(downloadUrl);
  if (engine === "office") {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
  }
  return `https://docs.google.com/gview?url=${encoded}&embedded=true`;
}

export function NotesEditor({ noteId, onBack }: Props) {
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [engine, setEngine] = useState<ViewerEngine>("office");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNote(null);
    setIframeLoaded(false);
    setIframeError(false);
    setIframeKey(0);

    aiApi
      .retrieveNote(noteId)
      .then((res) => {
        setNote(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load note.");
        setLoading(false);
      });
  }, [noteId]);

  const refresh = () => {
    setIframeLoaded(false);
    setIframeError(false);
    setIframeKey((k) => k + 1);
  };

  const switchEngine = (e: ViewerEngine) => {
    setEngine(e);
    setIframeLoaded(false);
    setIframeError(false);
    setIframeKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#0D9488]" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-[#0D9488] absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm text-[#78716C] font-medium">Loading smart note…</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917] self-start">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error ?? "Note not found"}
        </div>
      </div>
    );
  }

  const downloadUrl = note.download_url;
  const viewerUrl = downloadUrl ? buildViewerUrl(downloadUrl, engine) : null;

  return (
    <div className={`flex flex-col gap-3 ${expanded ? "fixed inset-4 z-50 bg-[#FFFDF9] rounded-2xl shadow-2xl border border-[#E6E0D6] p-4" : "h-full"}`}>
      {/* ── Toolbar ───────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap bg-[#FFFDF9] p-2.5 rounded-2xl border border-[#E6E0D6] shadow-xs">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917] px-2.5 py-1.5 rounded-xl hover:bg-[#F5EFE6] transition-all flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Notes
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#0D9488] text-white flex items-center justify-center flex-shrink-0 font-bold">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-[#1C1917] truncate heading-font">{note.title}</span>
          <span className="text-[10px] text-[#A8A29E] flex-shrink-0 hidden md:inline">
            {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Viewer switcher */}
        <div className="flex items-center gap-0.5 p-1 bg-[#F5EFE6] rounded-xl border border-[#E6E0D6] flex-shrink-0">
          <button
            onClick={() => switchEngine("office")}
            title="Microsoft Word Viewer"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              engine === "office" ? "bg-[#FFFDF9] text-[#0D9488] shadow-xs" : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <Monitor className="w-3 h-3" /> Word
          </button>
          <button
            onClick={() => switchEngine("google")}
            title="Google Docs Viewer"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              engine === "google" ? "bg-[#FFFDF9] text-[#0D9488] shadow-xs" : "text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <FileText className="w-3 h-3" /> Google
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={refresh}
            title="Refresh"
            className="w-8 h-8 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center justify-center text-[#78716C] hover:text-[#0D9488] hover:border-teal-300 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Collapse" : "Expand"}
            className="w-8 h-8 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center justify-center text-[#78716C] hover:text-[#0D9488] hover:border-teal-300 transition-all"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          {downloadUrl && (
            <>
              <a
                href={downloadUrl}
                download
                title="Download DOCX"
                className="w-8 h-8 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] flex items-center justify-center text-[#78716C] hover:text-[#0D9488] hover:border-teal-300 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all shadow-xs"
              >
                <ExternalLink className="w-3 h-3 stroke-[2.5]" /> Open
              </a>
            </>
          )}
        </div>
      </div>

      {/* ── Preview pane ──────────────────────────────── */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-[#E6E0D6] bg-[#FAF7F2]" style={{ minHeight: 500 }}>
        {viewerUrl ? (
          <>
            {/* Loading overlay */}
            <AnimatePresence>
              {!iframeLoaded && !iframeError && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.3 } }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#FAF7F2]"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-[#0D9488]" />
                    </div>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0D9488] absolute -bottom-1.5 -right-1.5" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#1C1917] heading-font">
                      {engine === "office" ? "Loading Word Viewer…" : "Loading Google Viewer…"}
                    </p>
                    <p className="text-xs text-[#A8A29E] mt-1">This may take a few seconds</p>
                  </div>
                  {/* Skeleton lines */}
                  <div className="w-56 flex flex-col gap-2.5">
                    {[100, 85, 95, 65, 80, 70].map((w, i) => (
                      <div
                        key={i}
                        className="h-2.5 rounded-full bg-[#E6E0D6] animate-pulse"
                        style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error overlay */}
            {iframeError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#FAF7F2] text-center px-6">
                <AlertCircle className="w-10 h-10 text-[#A8A29E]" />
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">Preview couldn't load</p>
                  <p className="text-xs text-[#78716C] mt-1 max-w-xs">
                    {engine === "office"
                      ? "Word Online requires a public URL. Try switching to Google viewer or download the file."
                      : "Google Viewer couldn't render this file. Try the Word viewer or download the file."}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => switchEngine(engine === "office" ? "google" : "office")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-semibold text-[#1C1917] hover:border-[#0D9488] transition-all"
                  >
                    <Monitor className="w-3.5 h-3.5 text-[#0D9488]" />
                    Try {engine === "office" ? "Google" : "Word"} Viewer
                  </button>
                  <button
                    onClick={refresh}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D6] bg-[#FFFDF9] text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" /> Open File
                    </a>
                  )}
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={viewerUrl}
              className={`w-full h-full border-0 transition-opacity duration-300 ${iframeLoaded && !iframeError ? "opacity-100" : "opacity-0"}`}
              style={{ minHeight: 500 }}
              onLoad={() => setIframeLoaded(true)}
              onError={() => { setIframeError(true); setIframeLoaded(true); }}
              title={note.title}
              allow="fullscreen"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
            <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
            <p className="text-sm font-semibold text-[#1C1917]">Preparing preview…</p>
            <p className="text-xs text-[#A8A29E]">Generating viewer session link</p>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────── */}
      <p className="text-center text-[10px] text-[#A8A29E] flex-shrink-0">
        {engine === "office" ? "Microsoft Word Online" : "Google Docs Viewer"} · Secure temporary access session
      </p>
    </div>
  );
}
