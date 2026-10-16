"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/*
 * "Fiyat Listesi": the editorial lookbook every price catalogue is printed as
 * — the admin's (from a pricing file) and a B2B customer's (from the catalog
 * page). Pages of four plates, two by two; the title, the collection and the
 * date on each page; no logo and no contact block, so it can go to anyone.
 *
 * Design: obsidian type on white, hairline zinc rules, a single carmine
 * (#991b1b) accent. Figures in tabular mono, so signs and decimals line up.
 * Printing (see PrintableLookbook) shows only the lookbook, A4, four plates a
 * page, never a plate cut across two; "PDF olarak kaydet" in the print dialog
 * makes the file.
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

const SYMBOL: Record<LookbookCurrency, string> = { TRY: "₺", USD: "$", EUR: "€" };
const money = (n: number, c: LookbookCurrency) =>
  `${SYMBOL[c]}${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
/** Label, before VAT, VAT, total: the same four tracks in the header and every row. */
const matrixCols = "grid grid-cols-[1.15fr_1.2fr_1fr_1.3fr] items-baseline gap-x-2";

/** A carmine corner mark, drawn on two edges of the frame. */
function Corner({ at }: { at: "tl" | "br" }) {
  const pos = at === "tl" ? "-left-px -top-px border-l-2 border-t-2" : "-bottom-px -right-px border-b-2 border-r-2";
  return <span aria-hidden className={`pointer-events-none absolute h-[4mm] w-[4mm] ${pos}`} style={{ borderColor: CARMINE }} />;
}

/** One product, as a lookbook plate: the piece on its stage, its name, its prices. */
function Plate({ item }: { item: LookbookItem }) {
  return (
    // Double hairline: an outer rule, a breath of white, an inner rule.
    <article className="catalog-card relative border border-zinc-300 bg-white p-[1.2mm]">
      <Corner at="tl" />
      <Corner at="br" />
      <div className="flex h-full flex-col border border-zinc-200">
        {/* The photo, flat on white, exactly as the storefront shows it: no
            stage, no shadow added under it. */}
        <div className="flex h-[68mm] items-center justify-center bg-white px-5 py-4">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-300">Görsel yok</span>
          )}
        </div>

        {/* Identification: the code as a carmine-ruled pill, then the name. */}
        <div className="border-t border-zinc-200 px-3 pb-2 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="rounded-sm border px-1.5 py-[1px] font-mono text-[9px] font-semibold tracking-wider"
              style={{ borderColor: CARMINE, color: CARMINE }}
            >
              {item.code || "—"}
            </span>
            {item.rates && (item.rates.usd || item.rates.eur) && (
              <span className="font-mono text-[7.5px] uppercase tracking-wider text-zinc-500 tabular-nums">
                {item.rates.usd && <>USD {rate(item.rates.usd)}</>}
                {item.rates.usd && item.rates.eur && <span className="mx-1 text-zinc-300">·</span>}
                {item.rates.eur && <>EUR {rate(item.rates.eur)}</>}
              </span>
            )}
          </div>
          {/* As stored: CSS capitals in a Turkish page would turn "Steamulation" into "STEAMULATİON". */}
          <p className="mt-1.5 line-clamp-2 text-[10.5px] font-semibold leading-snug text-zinc-900">{item.name || "—"}</p>
        </div>

        {/* The price matrix: muted parts, the eye led to the total; retail set apart. */}
        <div className="mt-auto">
          <div className={`${matrixCols} border-y border-zinc-200 bg-zinc-50 px-3 py-1 text-[6.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500`}>
            {/* The group column, unlabelled: the row names speak for themselves. */}
            <span aria-hidden />
            <span className="text-right">KDV hariç</span>
            <span className="text-right">+ KDV</span>
            <span className="text-right">Toplam</span>
          </div>
          {item.lines.map((l, i) => {
            const retail = l.tone === "retail";
            return (
              <div
                key={l.key}
                className={`${matrixCols} px-3 py-[1.3mm] tabular-nums ${i > 0 ? "border-t border-zinc-200" : ""} ${
                  retail ? "bg-rose-50" : l.tone === "final" ? "bg-amber-50/70" : ""
                }`}
              >
                <span
                  className={`truncate text-[7.5px] font-semibold uppercase tracking-[0.12em] ${retail ? "" : "text-zinc-600"}`}
                  style={retail ? { color: CARMINE } : undefined}
                >
                  {l.label}
                </span>
                {l.totalOnly ? (
                  <>
                    <span aria-hidden />
                    <span aria-hidden />
                  </>
                ) : (
                  <>
                    <span className="whitespace-nowrap text-right font-mono text-[8.5px] text-zinc-500">{money(l.excl, l.currency)}</span>
                    <span className="whitespace-nowrap text-right font-mono text-[8px] text-zinc-400">+{money(l.vat, l.currency)}</span>
                  </>
                )}
                <span
                  className={`whitespace-nowrap text-right font-mono font-bold ${retail ? "text-[10px]" : "text-[9px] text-zinc-900"}`}
                  style={retail ? { color: CARMINE } : undefined}
                >
                  {money(l.total, l.currency)}
                </span>
              </div>
            );
          })}
          {item.lines.length === 0 && <p className="px-3 py-2 text-[8px] text-zinc-400">Fiyat yok</p>}
        </div>
      </div>
    </article>
  );
}

const PER_PAGE = 4;

/** The lookbook: pages of four plates, each page headed by the title, the collection and the date. */
export function Lookbook({ collection, date, items }: { collection: string; date: string; items: LookbookItem[] }) {
  const pages: LookbookItem[][] = [];
  for (let i = 0; i < items.length; i += PER_PAGE) pages.push(items.slice(i, i + PER_PAGE));
  return (
    <div className="catalog-sheet mx-auto space-y-10 text-zinc-900" style={{ width: "100%", maxWidth: "186mm" }}>
      {pages.map((page, n) => (
        <section key={n} className="catalog-page bg-white">
          <header className="relative flex items-end justify-between gap-6 border-b border-zinc-200 pb-3">
            <div>
              <span aria-hidden className="mb-2 block h-[3px] w-6" style={{ background: CARMINE }} />
              <h1 className="text-[30px] font-semibold leading-none tracking-[-0.02em]">Fiyat Listesi</h1>
            </div>
            <p className="text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-800">{collection}</span>
              <span className="mt-1 block font-mono text-[9px] tracking-wider text-zinc-500 tabular-nums">
                {date}
                {pages.length > 1 && <> · {String(n + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}</>}
              </span>
            </p>
            {/* The carmine stroke under the title, on the hairline. */}
            <span aria-hidden className="absolute -bottom-px left-0 h-[2px] w-[34mm]" style={{ background: CARMINE }} />
          </header>
          <div className="mt-[6mm] grid grid-cols-2 gap-[6mm]">
            {page.map((item) => (
              <Plate key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const PRINT_ROOT = "price-catalog-print";

/**
 * Puts a print-only copy of `children` at the end of <body> and the rules that
 * print nothing else — the site's header, a sidebar, the toolbar — on A4.
 */
export function PrintableLookbook({ children }: { children: React.ReactNode }) {
  // The copy goes to the end of <body>, which exists only in the browser.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <>
      <style>{`
        #${PRINT_ROOT} { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body > *:not(#${PRINT_ROOT}) { display: none !important; }
          #${PRINT_ROOT} { display: block !important; }
          html, body { background: #fff !important; }
          .catalog-card { break-inside: avoid; page-break-inside: avoid; }
          .catalog-sheet > .catalog-page { margin: 0 !important; }
          .catalog-page + .catalog-page { break-before: page; page-break-before: always; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {mounted && createPortal(<div id={PRINT_ROOT}>{children}</div>, document.body)}
    </>
  );
}

/** Waits for every photo in the print copy (or the PDF would have empty frames), then prints. */
export async function printLookbook(): Promise<void> {
  await Promise.all(
    [...document.querySelectorAll<HTMLImageElement>(`#${PRINT_ROOT} img`)].map((img) =>
      img.complete
        ? null
        : new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
          }),
    ),
  );
  window.print();
}
