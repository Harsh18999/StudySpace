"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleScroll = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Clamp to viewport
  const menuWidth = 200;
  const menuItemHeight = 36;
  const menuHeight = items.length * menuItemHeight + 16;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.92, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -6 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 overflow-hidden"
        style={{ top: clampedY, left: clampedX, minWidth: menuWidth }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors
              ${item.variant === "danger"
                ? "text-red-600 hover:bg-red-50"
                : "text-slate-700 hover:bg-slate-50"
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {item.icon && (
              <span className={item.variant === "danger" ? "text-red-500" : "text-slate-400"}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Hook for managing context menu state ──────────────────────
import { useState, useCallback } from "react";

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const open = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const close = useCallback(() => setMenu(null), []);

  return { menu, open, close };
}
