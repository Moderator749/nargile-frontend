"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Loader2 } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { lookbookMessages } from "@/lib/i18n/messages/home";
import { downloadLookbookPdf, pdfFileName, pdfImageUrl } from "@/lib/lookbookPdf";
import { lookbookPages, type PageLayout, type PlateShape } from "@/lib/lookbookPages";

/*
 * "Fiyat Listesi": the editorial lookbook every price catalogue is printed as
 * — the admin's (from a pricing file) and a B2B customer's (from the catalog
 * page). Pages of up to four plates, each page laid out for what it holds (see
 * `lookbookPages`); the title, the collection and the date on each page; no logo and no contact block, so it can go to anyone.
 *
 * Design: obsidian type on white, hairline zinc rules, a single carmine
 * (#991b1b) accent. Figures in tabular mono, so signs and decimals line up.
 * On screen it is read as LookbookPreview (the plates in a grid that fits any
 * screen); the file is the A4 pages, one a sheet, made by LookbookDownload
 * without the print dialog.
 *
 * In Arabic (a customer's list on /ar) the sheet mirrors: the title and the
 * labels at the right, the figures aligned to the end of their columns.
 */

export type LookbookCurrency = "TRY" | "USD" | "EUR";

/** One price row of a plate. */
export interface LookbookLine {
  key: string;
  label: string;
  excl: number;
  vat: number;
  total: number;
  currency: LookbookCurrency;
  /** Retail is set apart (rose); the TL decision too (champagne). */
  tone?: "retail" | "final";
  /** Show only the total, without the VAT split (a shelf price, as a shopper reads it). */
  totalOnly?: boolean;
}

/** One product plate. */
export interface LookbookItem {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  /** USD/EUR rates the prices were worked out with, when they were. */
  rates?: { usd: string | null; eur: string | null };
  lines: LookbookLine[];
}

const SYMBOL: Record<LookbookCurrency, string> = { TRY: "TL", USD: "$", EUR: "€" };
/** "6.700,00 TL" (lira after the amount, as everywhere); "$24,41" and "€22,10" before it. */
const money = (n: number, c: LookbookCurrency) => {
  const amount = n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return c === "TRY" ? `${amount}\u00a0${SYMBOL[c]}` : `${SYMBOL[c]}${amount}`;
};
const rate = (v: string | null) =>
  v === null ? null : Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

/** A price split for an invoice, the VAT the difference so the three add up to the kuruş. */
export function splitVat(amount: number, vatRate: number, amountIsBeforeVat: boolean) {
  const round = (n: number) => Math.round(n * 100) / 100;
  const excl = amountIsBeforeVat ? amount : round(amount / (1 + vatRate / 100));
  const total = amountIsBeforeVat ? round(amount * (1 + vatRate / 100)) : amount;
  return { excl, vat: round(total - excl), total };
}

const CARMINE = "#991b1b";
/**
 * The price table: label, before VAT, VAT, total. One grid for the whole
 * table, the header and each row a subgrid of it, so every column lines up;
 * the three price columns are as wide as their widest figure (never squeezed
 * into a neighbour) and the label takes what is left.
 *
 * In a narrow plate (a phone's preview: under 19rem) there is no room for
 * four columns side by side, so each row becomes the label and the total,
 * with the VAT split on a small line beneath — the same figures, nothing
 * overlapping. The A4 file's plates are always wide enough for the columns.
 */
const matrix = "grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-2.5 @max-[19rem]:grid-cols-[minmax(0,1fr)_auto]";
const matrixRow = "col-span-full grid grid-cols-subgrid items-baseline";

/** A carmine corner mark, drawn on two edges of the frame: top start and bottom end. */
function Corner({ at }: { at: "tl" | "br" }) {
  const pos = at === "tl" ? "-start-px -top-px border-s-2 border-t-2" : "-bottom-px -end-px border-b-2 border-e-2";
  return <span aria-hidden className={`pointer-events-none absolute h-[4mm] w-[4mm] ${pos}`} style={{ borderColor: CARMINE }} />;
}

/**
 * The type and spacing of a plate, by the room its slot gives it: an upright
 * grid cell, a full-width row (photo beside the text), or the whole page. One
 * markup, three scales — each class string written out whole, so Tailwind
 * finds it.
 */
const SCALE: Record<
  PlateShape,
  {
    photo: string;
    pad: string;
    code: string;
    rates: string;
    name: string;
    head: string;
    row: string;
    label: string;
    excl: string;
    vat: string;
    total: string;
    retailTotal: string;
  }
> = {
  tall: {
    photo: "px-5 py-4",
    pad: "px-3",
    code: "text-[9px]",
    rates: "text-[7.5px]",
    name: "mt-1.5 line-clamp-2 text-[10.5px]",
    head: "py-1 text-[6.5px]",
    row: "py-[1.3mm]",
    label: "text-[7.5px]",
    excl: "text-[8.5px]",
    vat: "text-[8px]",
    total: "text-[9px]",
    retailTotal: "text-[10px]",
  },
  wide: {
    photo: "px-6 py-5",
    pad: "px-5",
    code: "text-[11px]",
    rates: "text-[8.5px]",
    name: "mt-2.5 line-clamp-3 text-[16px]",
    head: "py-2 text-[7.5px]",
    row: "py-[2.6mm]",
    label: "text-[9.5px]",
    excl: "text-[11.5px]",
    vat: "text-[10.5px]",
    total: "text-[12.5px]",
    retailTotal: "text-[14.5px]",
  },
  hero: {
    photo: "px-12 py-10",
    pad: "px-6",
    code: "text-[12px]",
    rates: "text-[9px]",
    name: "mt-3 line-clamp-3 text-[20px]",
    head: "py-2 text-[8.5px]",
    row: "py-[2.6mm]",
    label: "text-[10.5px]",
    excl: "text-[13px]",
    vat: "text-[12px]",
    total: "text-[14px]",
    retailTotal: "text-[17px]",
  },
};

/**
 * One product, as a lookbook plate: the piece on its stage, its name, its
 * prices. It fills its slot exactly — the photo takes whatever height (or, in
 * a full-width row, width) the text and prices leave — so a page of plates is
 * always one page, never spilling onto the next.
 */
function Plate({ item, shape }: { item: LookbookItem; shape: PlateShape }) {
  const s = SCALE[shape];
  const t = useMessages(lookbookMessages);
  const wide = shape === "wide";
  return (
    // Double hairline: an outer rule, a breath of white, an inner rule.
    <article className="catalog-card relative h-full min-h-0 break-inside-avoid border border-zinc-300 bg-white p-[1.2mm]">
      <Corner at="tl" />
      <Corner at="br" />
      <div className={`flex h-full min-h-0 border border-zinc-200 ${wide ? "flex-row" : "flex-col"}`}>
        {/* The photo, flat on white, exactly as the storefront shows it: no
            stage, no shadow added under it. */}
        <div
          className={`flex min-h-0 items-center justify-center bg-white ${s.photo} ${
            wide ? "w-[46%] shrink-0 border-e border-zinc-200" : "flex-1"
          }`}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-300">{t.noImage}</span>
          )}
        </div>

        <div className={`flex min-w-0 flex-col ${wide ? "flex-1" : "shrink-0"}`}>
          {/* Identification: the code as a carmine-ruled pill, then the name. */}
          <div className={`${s.pad} pb-2 pt-2.5 ${wide ? "" : "border-t border-zinc-200"}`}>
            <div className="flex items-center justify-between gap-2">
              <span
                // One line whatever the code ("NT770 G"): the pill never wraps or shrinks.
                className={`shrink-0 whitespace-nowrap rounded-sm border px-1.5 py-[1px] font-mono font-semibold tracking-wider ${s.code}`}
                style={{ borderColor: CARMINE, color: CARMINE }}
              >
                {item.code || "—"}
              </span>
              {item.rates && (item.rates.usd || item.rates.eur) && (
                <span className={`font-mono uppercase tracking-wider text-zinc-500 tabular-nums ${s.rates}`}>
                  {item.rates.usd && <>USD {rate(item.rates.usd)}</>}
                  {item.rates.usd && item.rates.eur && <span className="mx-1 text-zinc-300">·</span>}
                  {item.rates.eur && <>EUR {rate(item.rates.eur)}</>}
                </span>
              )}
            </div>
            {/* As stored: CSS capitals in a Turkish page would turn "Steamulation" into "STEAMULATİON". */}
            {/* A little more than snug, with room below the last line: the clamp
                cuts at the box, and Turkish capitals' dots and descenders need it. */}
            <p className={`pb-px font-semibold leading-[1.4] text-zinc-900 ${s.name}`}>{item.name || "—"}</p>
          </div>

          {/* The price matrix: muted parts, the eye led to the total; retail set apart. */}
          <div className="@container mt-auto">
            <div className={matrix}>
              <div
                className={`${matrixRow} border-y border-zinc-200 bg-zinc-50 ${s.pad} ${s.head} font-semibold uppercase leading-none tracking-[0.14em] text-zinc-500 @max-[19rem]:hidden`}
              >
                {/* The group column, unlabelled: the row names speak for themselves. */}
                <span aria-hidden />
                <span className="text-end">{t.exclVat}</span>
                <span className="text-end">{t.vat}</span>
                <span className="text-end">{t.total}</span>
              </div>
              {item.lines.map((l, i) => {
                const retail = l.tone === "retail";
                return (
                  <div
                    key={l.key}
                    className={`${matrixRow} ${s.pad} ${s.row} gap-y-0.5 leading-tight tabular-nums ${
                      i > 0 ? "border-t border-zinc-200" : "@max-[19rem]:border-t @max-[19rem]:border-zinc-200"
                    } ${retail ? "bg-rose-50" : l.tone === "final" ? "bg-amber-50/70" : ""}`}
                  >
                    <span
                      className={`min-w-0 truncate font-semibold uppercase tracking-[0.12em] ${s.label} ${retail ? "" : "text-zinc-600"}`}
                      style={retail ? { color: CARMINE } : undefined}
                    >
                      {l.label}
                    </span>
                    {l.totalOnly ? (
                      <>
                        <span aria-hidden className="@max-[19rem]:hidden" />
                        <span aria-hidden className="@max-[19rem]:hidden" />
                      </>
                    ) : (
                      <>
                        <span className={`whitespace-nowrap text-end font-mono text-zinc-500 ${s.excl} @max-[19rem]:hidden`}>
                          {money(l.excl, l.currency)}
                        </span>
                        <span className={`whitespace-nowrap text-end font-mono text-zinc-400 ${s.vat} @max-[19rem]:hidden`}>
                          +{money(l.vat, l.currency)}
                        </span>
                      </>
                    )}
                    <span
                      className={`whitespace-nowrap text-end font-mono font-bold ${retail ? s.retailTotal : `${s.total} text-zinc-900`}`}
                      style={retail ? { color: CARMINE } : undefined}
                    >
                      {money(l.total, l.currency)}
                    </span>
                    {/* A narrow plate's VAT split, under the label and the total. */}
                    {!l.totalOnly && (
                      <span className={`col-span-full hidden font-mono text-zinc-500 @max-[19rem]:block ${s.vat}`}>
                        {money(l.excl, l.currency)} <span className="font-sans uppercase tracking-wider">{t.exclVat}</span>
                        <span className="mx-1 text-zinc-300">·</span>+{money(l.vat, l.currency)}{" "}
                        <span className="font-sans uppercase tracking-wider">{t.vat.replace(/^\+\s*/, "")}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {item.lines.length === 0 && <p className={`${s.pad} py-2 text-[8px] text-zinc-400`}>{t.noPrice}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * The plates' grid, by how many the page holds (see `lookbookPages`). The
 * rows share the page's height evenly whatever is in them — `grid-rows-*` is
 * `minmax(0, 1fr)` — which is what keeps a page to one sheet.
 */
const GRID: Record<PageLayout, string> = {
  single: "grid-cols-1 grid-rows-1",
  pair: "grid-cols-1 grid-rows-2",
  trio: "grid-cols-2 grid-rows-2",
  quad: "grid-cols-2 grid-rows-2",
};

/**
 * The lookbook: A4 pages of up to four plates, each laid out for the plates it
 * holds, each headed by the title, the collection and the date.
 *
 * A page is the printable area's own shape (186 × 272 mm: A4 less the 12 mm
 * margins, a millimetre spare), so on paper it is exactly one sheet, and on
 * screen the preview is the pages as they will print.
 */
export function Lookbook({ collection, date, items }: { collection: string; date: string; items: LookbookItem[] }) {
  const pages = lookbookPages(items);
  const t = useMessages(lookbookMessages);
  return (
    <div className="catalog-sheet mx-auto space-y-10 text-zinc-900" style={{ width: "100%", maxWidth: "186mm" }}>
      {pages.map((page, n) => (
        <section
          key={n}
          data-layout={page.layout}
          className="catalog-page flex aspect-[186/272] flex-col overflow-hidden bg-white"
        >
          <header className="relative flex shrink-0 items-end justify-between gap-6 border-b border-zinc-200 pb-3">
            <div>
              <span aria-hidden className="mb-2 block h-[3px] w-6" style={{ background: CARMINE }} />
              <h1 className="text-[30px] font-semibold leading-none tracking-[-0.02em]">{t.title}</h1>
            </div>
            <p className="text-end">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-800">{collection}</span>
              <span className="mt-1 block font-mono text-[9px] tracking-wider text-zinc-500 tabular-nums">
                {date}
                {pages.length > 1 && <> · {String(n + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</>}
              </span>
            </p>
            {/* The carmine stroke under the title, on the hairline. */}
            <span aria-hidden className="absolute -bottom-px start-0 h-[2px] w-[34mm]" style={{ background: CARMINE }} />
          </header>
          <div className={`mt-[6mm] grid min-h-0 flex-1 gap-[6mm] ${GRID[page.layout]}`}>
            {page.slots.map(({ item, shape }, i) => (
              // The third of a trio runs under both of the first two.
              <div key={item.id} className={`min-h-0 ${page.layout === "trio" && i === 2 ? "col-span-2" : ""}`}>
                <Plate item={item} shape={shape} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * The catalogue on screen, for reading on any device: the same plates as the
 * PDF, one to a row on a phone and two or three side by side on a wider
 * screen, under the title, the collection and the date. The A4 pages are for
 * the file (see LookbookDownload), not for the screen: shrunk to a phone they
 * would be unreadable.
 */
export function LookbookPreview({ collection, date, items }: { collection: string; date: string; items: LookbookItem[] }) {
  const t = useMessages(lookbookMessages);
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-zinc-900 shadow-sm [color-scheme:light] sm:p-6">
      <header className="relative mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-zinc-200 pb-3">
        <div>
          <span aria-hidden className="mb-2 block h-[3px] w-6" style={{ background: CARMINE }} />
          <h2 className="text-2xl font-semibold leading-none tracking-[-0.02em] sm:text-[30px]">{t.title}</h2>
        </div>
        <p className="text-end">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-800">{collection}</span>
          <span className="mt-1 block font-mono text-[9px] tracking-wider text-zinc-500 tabular-nums">{date}</span>
        </p>
        <span aria-hidden className="absolute -bottom-px start-0 h-[2px] w-24" style={{ background: CARMINE }} />
      </header>
      {/* Two side by side only where each is wide enough for the price columns. */}
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          // A quarter page's proportions (90 × 119 mm), so a plate looks as it does in the file;
          // on a phone a fixed height instead, so its stacked prices leave the photo room.
          <li key={item.id} className="h-[28rem] min-h-0 md:aspect-[90/119] md:h-auto">
            <Plate item={item} shape="tall" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "PDF İndir": the A4 lookbook as a real .pdf file, made in the browser (see
 * `lib/lookbookPdf`) — never the print dialog. While the file is made, the
 * pages are drawn off screen at their own size, whatever the screen, and
 * taken away again after; the button says how far it has got.
 */
export function LookbookDownload({
  collection,
  date,
  items,
  fileTitle,
  labels,
  className,
}: {
  collection: string;
  date: string;
  items: LookbookItem[];
  /** The file's name, without ".pdf". */
  fileTitle: string;
  labels: { download: string; preparing: (done: number, total: number) => string; failed: string };
  className: string;
}) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const source = useRef<HTMLDivElement>(null);
  const busy = progress !== null;
  // The photos through the site's own optimiser: same-origin, so the snapshot may read them.
  const pdfItems = useMemo(() => items.map((i) => ({ ...i, imageUrl: pdfImageUrl(i.imageUrl) })), [items]);

  useEffect(() => {
    if (!busy || !source.current) return;
    let cancelled = false;
    downloadLookbookPdf(source.current, pdfFileName(fileTitle), (done, total) => {
      if (!cancelled) setProgress({ done, total });
    })
      .catch(() => {
        if (!cancelled) setError(labels.failed);
      })
      .finally(() => {
        if (!cancelled) setProgress(null);
      });
    return () => {
      cancelled = true;
    };
    // Once per click: `busy` turning on is the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setProgress({ done: 0, total: 0 });
        }}
        disabled={busy}
        aria-busy={busy}
        className={className}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileDown className="h-4 w-4" aria-hidden />}
        {busy && progress.total > 0 ? labels.preparing(progress.done, progress.total) : labels.download}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {busy &&
        createPortal(
          // Off screen, not hidden: a hidden page has no layout to photograph.
          <div
            ref={source}
            aria-hidden
            className="pointer-events-none fixed top-0 bg-white [color-scheme:light]"
            style={{ left: "-10000px", width: "186mm" }}
          >
            <Lookbook collection={collection} date={date} items={pdfItems} />
          </div>,
          document.body,
        )}
    </>
  );
}
