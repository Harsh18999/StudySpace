"use client";
import { motion } from "framer-motion";

interface AnimatedBlobsProps {
  dark?: boolean;
}

export function AnimatedBlobs({ dark = false }: AnimatedBlobsProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute rounded-full filter blur-[80px]"
        style={{
          width: 500,
          height: 500,
          background: dark
            ? "radial-gradient(circle, rgba(99,102,241,0.4), rgba(124,58,237,0.2))"
            : "radial-gradient(circle, rgba(99,102,241,0.25), rgba(165,180,252,0.15))",
          top: "-15%",
          left: "-10%",
        }}
        animate={{ x: [0, 30, -20, 0], y: [0, -25, 20, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full filter blur-[80px]"
        style={{
          width: 380,
          height: 380,
          background: dark
            ? "radial-gradient(circle, rgba(139,92,246,0.4), rgba(167,139,250,0.2))"
            : "radial-gradient(circle, rgba(139,92,246,0.20), rgba(196,181,253,0.12))",
          top: "55%",
          right: "-8%",
        }}
        animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute rounded-full filter blur-[80px]"
        style={{
          width: 300,
          height: 300,
          background: dark
            ? "radial-gradient(circle, rgba(6,182,212,0.3), rgba(14,165,233,0.15))"
            : "radial-gradient(circle, rgba(6,182,212,0.18), rgba(103,232,249,0.10))",
          bottom: "10%",
          left: "30%",
        }}
        animate={{ x: [0, 20, -15, 0], y: [0, -15, 20, 0], scale: [1, 1.05, 0.94, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}
