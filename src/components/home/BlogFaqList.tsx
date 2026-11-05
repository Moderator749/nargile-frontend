"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

const LIST = "divide-y divide-gray-200 dark:divide-white/10";

/**
 * "Blog / SSS"'s list (HomeBlogFaq): the first questions, then the rest folded
 * under "Tüm Yazıları Gör (14)". Folded, not left out: the rest is in the
 * server's HTML, hidden from view (and, while shut, from the keyboard and
 * screen readers), and opens by easing its height from nothing to its own, as
 * "Alt SEO Metni" does. Closing it brings the button back into view, so a
 * long list read to its end does not leave the visitor far below it.
 */
export function BlogFaqList({
  shown,
  rest,
  allLabel,
  lessLabel,
}: {
  shown: ReactNode[];
  rest: ReactNode[];
  allLabel: string;
  lessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const restId = useId();
  const button = useRef<HTMLButtonElement>(null);

  function toggle() {
    setOpen((value) => !value);
    if (open) requestAnimationFrame(() => button.current?.scrollIntoView({ block: "center" }));
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60">
        <div className={LIST}>{shown}</div>
        {rest.length > 0 && (
          <div
            id={restId}
            inert={!open}
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className={`overflow-hidden border-t border-gray-200 dark:border-white/10 ${LIST}`}>{rest}</div>
          </div>
        )}
      </div>
      {rest.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls={restId}
            onClick={toggle}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-900 transition-colors hover:border-red-600 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:border-red-400 dark:hover:text-red-400"
          >
            {open ? lessLabel : allLabel}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "-rotate-180" : ""}`}
              aria-hidden
            />
          </button>
        </div>
      )}
    </>
  );
}
