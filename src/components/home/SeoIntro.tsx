"use client";

import { useId, useState } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { DEFAULT_SEO_INTRO } from "@/lib/homepage";
import { homeMessages } from "@/lib/i18n/messages/home";
import { htmlToText, shiftHeadings, toHtml } from "@/lib/richText";
import type { HomeSeoIntro } from "@/types";

const PARAGRAPH = "text-sm leading-relaxed text-gray-600 md:text-base dark:text-zinc-400";

/**
 * The page's one passage about the business, set like a magazine standfirst:
 * a short centred column, a heading, the first paragraph, and "Devamını Oku"
 * for the rest — a buying guide in its own headings, lists and links to the
 * categories, read left to right (or right to left) like any longer text.
 *
 * The copy is "Alt SEO Metni" in Ana Sayfa Düzenleme; any field left empty
 * shows the shop's own (DEFAULT_SEO_INTRO). The rest is the editor's HTML,
 * cleaned when it was saved (as is its translation), or plain text from before
 * the editor, made paragraphs here; its headings sit one level under the
 * passage's own <h2>.
 *
 * The rest is folded, not left out: all of it is in the markup from the
 * server, there to be read by a crawler as much as by a visitor, and its links
 * followed; the fold only hides it from view (and from the keyboard and screen
 * readers while shut). It opens by easing its height from nothing to its own.
 */
export function SeoIntro({ copy }: { copy?: Partial<HomeSeoIntro> | null }) {
  const [open, setOpen] = useState(false);
  const moreId = useId();
  const t = useMessages(homeMessages);
  const title = copy?.title?.trim() || DEFAULT_SEO_INTRO.title;
  const first = copy?.summary?.trim() || DEFAULT_SEO_INTRO.summary;
  const content = copy?.content?.trim();
  // The editor leaves "<p></p>" behind a cleared field: no words, the shop's copy.
  const rest = shiftHeadings(toHtml(content && htmlToText(content) ? content : DEFAULT_SEO_INTRO.content));

  return (
    <section
      id="seo-intro"
      aria-labelledby="seo-intro-heading"
      className="mx-auto max-w-4xl bg-transparent px-4 py-16 text-center"
    >
      <h2
        id="seo-intro-heading"
        className="mb-6 text-balance text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl dark:text-white"
      >
        {title}
      </h2>
      <p className={`whitespace-pre-line ${PARAGRAPH}`}>{first}</p>

      {rest && (
        <>
          <div
            id={moreId}
            inert={!open}
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className={`rich-text mt-4 text-start ${PARAGRAPH}`} dangerouslySetInnerHTML={{ __html: rest }} />
            </div>
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={moreId}
            onClick={() => setOpen((value) => !value)}
            className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            {open ? t.readLess : t.readMore}
            <span aria-hidden>{open ? "↑" : "↓"}</span>
          </button>
        </>
      )}
    </section>
  );
}
