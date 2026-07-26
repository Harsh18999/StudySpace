"use client";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center"
      >
        <FileText className="w-8 h-8 text-amber-600" />
      </motion.div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">All Notes</h2>
        <p className="text-slate-500 text-sm mt-1">Select a video and take notes to see them here.</p>
      </div>
    </div>
  );
}
