"use client";

import { useId, useState } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { HomeStatement } from "@/types";

const PARAGRAPH = "text-sm leading-relaxed text-gray-600 md:text-base dark:text-neutral-400";

// The first sentence is shown (`copy.lead`); the rest (`copy.rest`)
// waits behind "Devamını Oku".

/**
 * "Sektörde Referans Noktası": the brand in a sentence under the hero row, on
 * the page itself rather than in a box, centred across the row's full width —
 * from the slider's left edge to the cards' right — with the heading above.
 *
 * As with `SeoIntro`, the rest is folded, not left out: it is in the markup
 * from the server for a crawler to read, and the fold only hides it from view
 * (and from the keyboard and screen readers while shut), easing its height
 * from nothing to its own.
 */
export function BrandStatement({ copy }: { copy: HomeStatement }) {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const moreId = useId();
  const t = useMessages(homeMessages);

  return (
    <section aria-labelledby={headingId} className="flex w-full flex-col items-center gap-4 text-center">
      <h2 id={headingId} className="text-center text-2xl font-bold text-gray-900 dark:text-white">
        {copy.heading}
      </h2>

      <div className="w-full text-center">
        <p className={PARAGRAPH}>{copy.lead}</p>
        <div
          id={moreId}
          inert={!open}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className={`mt-2 ${PARAGRAPH}`}>{copy.rest}</p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={moreId}
          onClick={() => setOpen((value) => !value)}
          className="mx-auto mt-4 flex w-fit cursor-pointer items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          {open ? t.readLess : t.readMore}
          <span aria-hidden>{open ? "↑" : "↓"}</span>
        </button>
      </div>
    </section>
  );
}
