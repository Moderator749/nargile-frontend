"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A modal built on the native `<dialog>`, so the browser handles the focus trap,
 * the Escape key and the inert background rather than us re-implementing them.
 *
 * It renders nothing until it is opened, and closing is always the caller's
 * decision: Escape and the backdrop report a close instead of performing one,
 * which keeps the open flag the single source of truth.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Escape closes it: tell the caller rather than letting the DOM and the
      // open flag drift apart.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      // The backdrop is the dialog's own box outside the panel below.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-auto max-h-[85dvh] w-[calc(100vw-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm open:flex open:flex-col dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="-m-1 rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
    </dialog>
  );
}
