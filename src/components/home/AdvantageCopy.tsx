"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Dialog } from "@/components/ui/Dialog";

/**
 * An advantage card's words: badge, title, the description clamped to two
 * lines and the note to one, so every card keeps the same height whatever the
 * admin wrote. When anything is cut off, "Devamını oku" opens the whole of it
 * in a dialog; when it all fits, there is no link to tempt a pointless click.
 */
export function AdvantageCopy({
  badge,
  title,
  description,
  note,
}: {
  badge: string;
  title: string;
  description: string;
  note?: string | null;
}) {
  const body = useRef<HTMLParagraphElement>(null);
  const foot = useRef<HTMLParagraphElement>(null);
  const [clipped, setClipped] = useState(false);
  const [open, setOpen] = useState(false);

  // Measured, not guessed from the character count: what fits on two lines
  // depends on the card's width, which changes with the window.
  useLayoutEffect(() => {
    const measure = () => {
      const over = (el: HTMLElement | null) => !!el && el.scrollHeight > el.clientHeight + 1;
      setClipped(over(body.current) || over(foot.current));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (body.current) observer.observe(body.current);
    if (foot.current) observer.observe(foot.current);
    return () => observer.disconnect();
  }, [description, note]);

  return (
    <>
      <p className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">{badge}</p>
      <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover:text-red-600 sm:text-base dark:group-hover:text-red-400">
        {title}
      </h3>
      <p ref={body} className="mt-0.5 line-clamp-2 text-xs font-medium leading-relaxed text-neutral-500 dark:text-zinc-400">
        {description}
      </p>
      {note && (
        <p
          ref={foot}
          className="mt-1.5 line-clamp-1 border-t border-neutral-100 pt-1.5 text-[10px] font-medium leading-4 text-neutral-400 sm:text-[11px] dark:border-white/10 dark:text-zinc-500"
        >
          {note}
        </p>
      )}
      {clipped && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-red-600 transition-colors duration-200 hover:text-red-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:text-red-300"
          aria-haspopup="dialog"
        >
          Devamını oku
          <ArrowRight className="h-3 w-3 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
          <span className="sr-only">: {title}</span>
        </button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={title}>
        {badge && (
          <p className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {badge}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{description}</p>
        {note && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400">
            {note}
          </p>
        )}
      </Dialog>
    </>
  );
}
