"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { uiMessages } from "@/lib/i18n/messages/layout";

/**
 * A slide-over panel from the inline end, built on the native `<dialog>` like
 * `Dialog`: the browser keeps the focus inside, handles Escape and makes the
 * page behind it inert. Closing is the caller's decision — Escape, the
 * backdrop and the close button report it — so the open flag stays the single
 * source of truth.
 *
 * The body is a size container: forms inside lay out by the panel's width
 * (`@3xl:grid-cols-2`), not the window's.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Pinned under the scrolling body: the panel's own actions. */
  footer?: ReactNode;
  /** "md" for a form, "lg" for side-by-side editors. */
  size?: "md" | "lg";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const m = useMessages(uiMessages);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className={`${size === "lg" ? "max-w-6xl" : "max-w-3xl"} my-0 ms-auto me-0 h-dvh max-h-none w-full border-s border-slate-200 bg-slate-50 p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm open:flex open:flex-col motion-safe:transition-[translate] motion-safe:duration-300 motion-safe:ease-out starting:open:translate-x-full rtl:starting:open:-translate-x-full dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100`}
    >
      {open && (
        <>
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6 dark:border-white/10 dark:bg-zinc-900">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight">{title}</h2>
              {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={m.close}
              className="-m-1 rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>
          <div className="@container min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <footer className="border-t border-slate-200 bg-white px-5 py-3 sm:px-6 dark:border-white/10 dark:bg-zinc-900">
              {footer}
            </footer>
          )}
        </>
      )}
    </dialog>
  );
}
