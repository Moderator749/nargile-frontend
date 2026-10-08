"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * The product description under the buy box: the first three lines show
 * straight away, the rest is one click behind "Devamını Oku".
 *
 * The whole text is always in the DOM — collapsing is `line-clamp`, not
 * `display: none` — so Google and screen readers get the full description
 * either way, and expanding needs no fetch and no layout beyond the reflow of
 * the text itself.
 *
 * The toggle only appears when three lines actually hide something, which only
 * the browser can tell (it depends on the column width and the font), so it is
 * measured rather than guessed from the character count. Its row is reserved at
 * a fixed height either way, so a product with a two-line description does not
 * shift the page when the measurement comes back.
 */
export function ProductDescription({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const body = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = body.current;
    // Nothing is clamped while it is open, so there is nothing to measure: the
    // answer is already yes, which is why the toggle was there to be clicked.
    if (!el || open) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    // Re-measure on a column resize: three lines on a phone are not three lines
    // on a desktop.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, text]);

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Ürün Açıklaması</h2>
      <p
        ref={body}
        id="urun-aciklamasi"
        className={`mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground ${open ? "" : "line-clamp-3"}`}
      >
        {text}
      </p>
      <div className="mt-2 flex h-9 items-center">
        {overflows && (
          <button
            type="button"
            onClick={() => setOpen((shown) => !shown)}
            aria-expanded={open}
            aria-controls="urun-aciklamasi"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {open ? "Daha Az Göster" : "Devamını Oku"}
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                open ? "-rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>
        )}
      </div>
    </section>
  );
}
