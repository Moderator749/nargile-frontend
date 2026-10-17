"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PARAGRAPH = "text-sm leading-relaxed text-gray-600 md:text-base dark:text-neutral-400";

/** The first sentence is shown; the rest waits behind "Devamını Oku". */
const LEAD = "Nargile kültürünü modern mühendislik ve birinci sınıf materyallerle yeniden tanımlıyoruz.";
const REST =
  "Sadece bir donanım değil; estetik, performans ve uzun ömürlülüğü bir araya getiren premium bir deneyim sunuyoruz.";

/** Where the statement leads: the whole catalog. */
const COLLECTION_HREF = "/catalog";

/**
 * "Sektörde Referans Noktası": the brand in a sentence, as a wide band under
 * the hero row — the heading on the right from `md`, the text on the left.
 *
 * As with `SeoIntro`, the rest is folded, not left out: it is in the markup
 * from the server for a crawler to read, and the fold only hides it from view
 * (and from the keyboard and screen readers while shut), easing its height
 * from nothing to its own.
 */
export function BrandStatement() {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const moreId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row-reverse md:p-8 dark:border-white/[0.06] dark:bg-zinc-900"
    >
      <div className="md:w-1/3 md:text-right">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-400">Güvenilir Marka</p>
        <h2 id={headingId} className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          Sektörde Referans Noktası
        </h2>
      </div>

      <div className="text-left md:w-2/3">
        <p className={PARAGRAPH}>{LEAD}</p>
        <div
          id={moreId}
          inert={!open}
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className={`mt-2 ${PARAGRAPH}`}>{REST}</p>
            <Link
              href={COLLECTION_HREF}
              className="mt-4 inline-flex w-fit items-center whitespace-nowrap font-semibold text-gray-900 transition-colors hover:text-red-700 dark:text-white dark:hover:text-red-400"
            >
              Koleksiyonu Keşfet
              <ArrowUpRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={moreId}
          onClick={() => setOpen((value) => !value)}
          className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          {open ? "Daralt" : "Devamını Oku"}
          <span aria-hidden>{open ? "↑" : "↓"}</span>
        </button>
      </div>
    </section>
  );
}
