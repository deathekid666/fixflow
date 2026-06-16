"use client";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="bottom-sheet lg:hidden">
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet-panel">
        <div className="bottom-sheet-handle" />
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-5 pb-4">{children}</div>
      </div>
    </div>
  );
}
