"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { uiMessages } from "@/lib/i18n/messages/layout";
import { shiftHeadings, toHtml } from "@/lib/richText";

/**
 * A rich text cut to a few lines, the rest one click behind "Devamını Oku".
 *
 * The whole text is always in the DOM — collapsing is a height limit with a
 * fade, not `display: none` or a second request — so Google and screen
 * readers get all of it either way, and expanding is only the reflow of the
 * text itself. A height rather than `line-clamp`, because the text is HTML:
 * line-clamp counts lines only in a single run of text, not across the
 * paragraphs, headings and lists the editor writes.
 *
 * The toggle only appears when the limit actually hides something, which only
 * the browser can tell (it depends on the column width and the font), so it
 * is measured rather than guessed from the character count. Its row is
 * reserved at a fixed height either way, so text that fits does not shift the
 * page when the measurement comes back.
 *
 * The HTML is a rich-text field from the API, cleaned when it was saved (see
 * components/ui/RichText).
 */
export function ReadMore({
  id,
  html,
  lines = 3,
  className = "",
  nested = false,
}: {
  /** The text's element id, for the toggle's aria-controls. */
  id: string;
  html: string;
  /** Lines shown while collapsed, at the text's 1.5rem line height. */
  lines?: number;
  className?: string;
  /** Shown under a heading of its own: the text's headings move one level down. */
  nested?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const m = useMessages(uiMessages);
  const markup = toHtml(html);

  useEffect(() => {
    const el = body.current;
    // Nothing is limited while it is open, so there is nothing to measure: the
    // answer is already yes, which is why the toggle was there to be clicked.
    if (!el || open) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    // Re-measure on a column resize: three lines on a phone are not three lines
    // on a desktop.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, markup]);

  if (!markup) return null;
  const collapsed = !open;
  return (
    <>
      <div
        ref={body}
        id={id}
        className={`rich-text overflow-hidden ${className}`}
        style={
          collapsed
            ? {
                maxHeight: `${lines * 1.5}rem`,
                // Fade the last line out while there is more below it.
                ...(overflows
                  ? { maskImage: "linear-gradient(to bottom, #000 55%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent)" }
                  : {}),
              }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: nested ? shiftHeadings(markup) : markup }}
      />
      <div className="mt-1 flex h-8 items-center">
        {overflows && (
          <button
            type="button"
            onClick={() => setOpen((shown) => !shown)}
            aria-expanded={open}
            aria-controls={id}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {open ? m.showLess : m.readMore}
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                open ? "-rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        )}
      </div>
    </>
  );
}
