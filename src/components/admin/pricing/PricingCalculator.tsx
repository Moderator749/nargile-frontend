"use client";

import { Fragment, useEffect, useId, useState, type ReactNode } from "react";
import { CheckCircle2, FilePlus2, Link2, Plus, Rocket, Save, X } from "lucide-react";

import { FileDialog } from "@/components/admin/pricing/FileDialog";
import { SaveDialog, type PriceLine } from "@/components/admin/pricing/SaveDialog";
import { ProductLookup } from "@/components/admin/pricing/ProductLookup";
import { Alert } from "@/components/ui/Alert";

import { getApiErrorMessage } from "@/lib/errors";
import { loadExchangeRates } from "@/lib/money";
import {
  SEGMENT_LABELS,
  computeSheet,
  sameCodeRows,
  savePricing,
  type FileTarget,
  type PricingCurrency,
  type PricingFile,
  type PricingRecord,
  type PricingSegment,
  type PricingSheetInput,
  type VatMode,
} from "@/lib/pricing";
import { type PricingOrigin, originOf, savesOver } from "@/lib/pricingOrigin";
import { refreshStorefront } from "@/lib/revalidate";
import { stepOnArrowKey } from "@/lib/numberStep";

// ── The worksheet as typed ───────────────────────────────────────────────────

export interface ColumnDraft {
  key: number;
  label: string;
  segment: PricingSegment | "";
  percent: string;
  desired: string;
  /** "ERP fiyatı" (blue): a base price typed in place of the calculated one for the "uygulanacak fiyat". */
  erpPrice: string;
}

export interface SheetDraft {
  code: string;
  name: string;
  vatMode: VatMode;
  currency: PricingCurrency;
  cost: string;
  columns: ColumnDraft[];
  retailPercent: string;
  vatRate: string;
  retailDesired: string;
  retailErpPrice: string;
  /** "Uygulanacak oran (%)": added to the classes' base (ERP fiyatı, else calculated) for their price; not Mağaza Fiyatı's or retail's. */
  appliedPercent: string;
  /** Between the classes and retail, each a branch off the last class as retail is (after VAT); for reference, never sent to the site. */
  extras: ColumnDraft[];
  usdRate: string;
  eurRate: string;
  finalTry: string;
}

let nextKey = 0;
export const newColumn = (label = "", segment: PricingSegment | "" = ""): ColumnDraft => ({
  key: nextKey++,
  label,
  segment,
  percent: "",
  desired: "",
  erpPrice: "",
});

/** The price before retail every sheet starts with; renamed in its header. */
export const EXTRA_LABELS = ["Mağaza Fiyatı"];
export const defaultExtras = () => EXTRA_LABELS.map((label) => newColumn(label));

export const emptySheet = (vatMode: VatMode = "EXCL"): SheetDraft => ({
  code: "",
  name: "",
  vatMode,
  currency: "TRY",
  cost: "",
  columns: [newColumn("Bayi Fiyatı", "DEALER"), newColumn("Toptan Fiyatı", "WHOLESALE"), newColumn("Kafe Fiyatı", "CAFE")],
  retailPercent: "",
  vatRate: "20",
  retailDesired: "",
  retailErpPrice: "",
  appliedPercent: "",
  extras: defaultExtras(),
  usdRate: "",
  eurRate: "",
  finalTry: "",
});

/**
 * A number as a Turkish admin types it: "1250,5", "1.250,50", "49,3681", "-5".
 * Up to four decimals — exchange rates and costs need them — where the shared
 * money parser stops at kuruş. Null when empty or unusable.
 */
function num(raw: string): number | null {
  let t = raw.trim().replace(/\s|₺|\$|€|%/g, "");
  if (!t) return null;
  const negative = t.startsWith("-");
  if (negative) t = t.slice(1);
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // "12.500": thousands
  if (!/^\d+(\.\d{1,4})?$/.test(t)) return null;
  return Number(t) * (negative ? -1 : 1);
}
/** For the server: `places` decimals at most (prices 2, rates and percents 4). */
const dec = (raw: string, places = 4) => {
  const n = num(raw);
  return n === null ? null : String(Number(n.toFixed(places)));
};

/** A column's typed figures as numbers, for the arithmetic. */
const typedOf = (c: ColumnDraft) => ({ percent: num(c.percent), desired: num(c.desired), erpPrice: num(c.erpPrice) });

const SYMBOL: Record<PricingCurrency, string> = { TRY: "₺", USD: "$", EUR: "€" };
const fmt = (n: number | null, currency: PricingCurrency) =>
  n === null
    ? "—"
    : `${SYMBOL[currency]}${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Pieces ───────────────────────────────────────────────────────────────────

// ── Spreadsheet styling ──────────────────────────────────────────────────────
// Excel's own fills: #F2F2F2 for headers, #FCE4D6 for the formula row,
// #E2EFDA for the row the admin fills in. One 1px grid line everywhere.

const td = "border border-slate-300 dark:border-zinc-600";
/** A cell that keeps its content inside it: a long figure is cut, never pushes the grid wider. */
const clip = "overflow-hidden";
const headFill = "bg-[#F2F2F2] dark:bg-zinc-800";
const orangeFill = "bg-[#FCE4D6] text-orange-950 dark:bg-orange-500/15 dark:text-orange-100";
const greenFill = "bg-[#E2EFDA] dark:bg-emerald-500/15";
/** The "ERP fiyatı" row under the formula row: Excel's light blue. */
const blueFill = "bg-[#DDEBF7] text-sky-950 dark:bg-sky-500/15 dark:text-sky-100";
const headText = "text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-700 dark:text-zinc-200";
/** Bayi, Toptan, Kafe and Mağaza Fiyatı: with the cost and retail, the six boxes that always fit. */
const STANDARD_STEPS = 4;
/** An input that is the cell itself, as in a spreadsheet. */
const cellBase =
  "block h-8 w-full border-0 bg-transparent px-1.5 text-center font-mono text-sm tabular-nums text-slate-900 focus:outline-2 focus:-outline-offset-2 focus:outline-red-500 dark:text-zinc-100";
const cellInput = `${cellBase} placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-400`;
/** A cell whose automatic figure stands in it, as its own value, until one is typed. */
const priceInput = `${cellBase} placeholder:text-slate-900 dark:placeholder:text-zinc-100`;
const smallSelect =
  "block h-6 w-full rounded border border-slate-300 bg-white px-1 text-[10px] font-semibold text-slate-700 focus:border-red-500 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200";

/** "%15" as a small input inside a header cell. */
function PercentBadge({ label, value, onChange, prefix = "%" }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <span className="mt-1 flex h-6 items-center rounded border border-slate-300 bg-white px-1 dark:border-zinc-600 dark:bg-zinc-900">
      <span className="whitespace-nowrap text-[10px] font-bold text-slate-400">{prefix}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => stepOnArrowKey(e, (v) => onChange(v))}
        aria-label={label}
        placeholder="0"
        className="w-full min-w-0 border-0 bg-transparent px-0.5 text-right font-mono text-xs font-semibold text-slate-900 focus:outline-none dark:text-zinc-100"
      />
    </span>
  );
}

/** The "(+)" between two steps: each is the one before plus its percent. */
function StepPlus({ rowSpan, onAdd, disabled }: { rowSpan?: number; onAdd?: () => void; disabled?: boolean }) {
  return (
    <td rowSpan={rowSpan} className={`${td} bg-white text-center align-middle dark:bg-zinc-950`}>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          aria-label="Ara kademe ekle"
          title="Ara kademe ekle"
          className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 disabled:opacity-40"
        >
          <Plus className="h-3 w-3" aria-hidden />
        </button>
      ) : (
        <span className="text-xs font-bold text-slate-400" aria-hidden>
          +
        </span>
      )}
    </td>
  );
}

// ── The calculator ───────────────────────────────────────────────────────────

const OUTLINE_BUTTON =
  "inline-flex h-9 items-center gap-1.5 border border-slate-400 bg-white px-3 text-xs font-bold uppercase tracking-wide text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";
const RED_BUTTON =
  "inline-flex h-9 items-center gap-1.5 border border-red-700 bg-red-600 px-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * The worksheet, laid out like "Cetvel 1": one spreadsheet grid. The product
 * across the top; under it each step's header with its percent; then the
 * formula row (orange) — one unbroken chain, each step the previous calculated
 * value plus its percent, retail after VAT — and the row of prices to apply
 * (green), typed when the calculated one is not the one wanted. Typing in green
 * never moves the orange row; it only decides what goes to the site.
 *
 * Three buttons, each saying where the row goes: "Taslak olarak kaydet",
 * "Dosyaya kaydet" (a file picked, or a new one), "Dosya ve sitede ürüne
 * kaydet" (and onto the product). A sheet loaded from a row is saved over it
 * while its code is unchanged — moved where the button says; anything else is
 * a new row, unless its code is saved already, in a file or the drafts: then
 * SaveDialog asks "Üstüne Yaz" or "Yeni Kayıt".
 */
/** Where a save goes: Taslaklar, or a file (picked, or a new one by name). */
type Dest = { kind: "draft" } | { kind: "file"; target: FileTarget };

export function PricingCalculator({
  title,
  initial,
  origin: loadedFrom = null,
  files,
  onSaved,
}: {
  /** "Cetvel 1 · KDV hariç maliyet". The sheet's VAT basis is `initial.vatMode`. */
  title: string;
  initial: SheetDraft;
  /** The saved row `initial` was loaded from ("Cetvele yükle"); null for a new sheet. */
  origin?: PricingOrigin | null;
  /** The files "Dosyaya kaydet" offers. */
  files: PricingFile[];
  /** A row was saved (and perhaps applied): the lists should refresh. */
  onSaved: () => void;
}) {
  const headingId = useId();
  const [d, setD] = useState<SheetDraft>(initial);
  // The row "Kaydet" writes over: the one loaded, or the one this sheet last
  // saved, so saving again never leaves a second copy behind.
  const [origin, setOrigin] = useState<PricingOrigin | null>(loadedFrom);
  // The file dialog of "Dosyaya kaydet" / "Dosya ve sitede ürüne kaydet".
  const [fileDialog, setFileDialog] = useState<{ apply: boolean } | null>(null);
  // "Bu ürün koduyla bir kayıt zaten var" (SaveDialog): the save it holds back.
  const [ask, setAsk] = useState<{ dest: Dest; apply: boolean; matches: PricingRecord[] } | null>(null);
  const [busy, setBusy] = useState<"draft" | "file" | "apply" | null>(null);
  // "Kaydedildi", for a few seconds in the corner.
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: ReactNode } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const set = (patch: Partial<SheetDraft>) => {
    setD((s) => ({ ...s, ...patch }));
    setResult(null);
  };
  const setColumn = (key: number, patch: Partial<ColumnDraft>) =>
    set({ columns: d.columns.map((c) => (c.key === key ? { ...c, ...patch } : c)) });
  const addColumn = () => set({ columns: [...d.columns, newColumn()] });
  const setExtra = (key: number, patch: Partial<ColumnDraft>) =>
    set({ extras: d.extras.map((c) => (c.key === key ? { ...c, ...patch } : c)) });

  const foreign = d.currency !== "TRY";
  // A foreign sheet starts on the day's TCMB rates; the admin can type others.
  useEffect(() => {
    if (!foreign || (d.usdRate && d.eurRate)) return;
    let alive = true;
    void loadExchangeRates().then((r) => {
      if (!alive || !r) return;
      const tr = (v: string) => Number(v).toFixed(4).replace(".", ",");
      setD((s) => ({ ...s, usdRate: s.usdRate || tr(r.rates.USD), eurRate: s.eurRate || tr(r.rates.EUR) }));
    });
    return () => {
      alive = false;
    };
  }, [foreign, d.usdRate, d.eurRate]);

  const calc = computeSheet({
    cost: num(d.cost),
    columns: d.columns.map(typedOf),
    extras: d.extras.map(typedOf),
    retail: {
      percent: num(d.retailPercent),
      desired: num(d.retailDesired),
      erpPrice: num(d.retailErpPrice),
      vatRate: num(d.vatRate),
    },
    appliedPercent: num(d.appliedPercent),
    vatMode: d.vatMode,
    currency: d.currency,
    usdRate: num(d.usdRate),
    eurRate: num(d.eurRate),
  });


  // What the server takes; null with the reason when the sheet is not complete.
  const used = d.columns.map((c) => c.segment).filter(Boolean);
  // The extras are optional and independent: one with a percent is sent, one
  // without is not — unless something was typed in it that would be lost.
  const sentExtras = d.extras.filter((c) => num(c.percent) !== null);
  const strayExtra = d.extras.some((c) => num(c.percent) === null && (c.percent.trim() || c.desired.trim()));
  const problem =
    num(d.cost) === null || num(d.cost)! <= 0
      ? "Maliyeti girin."
      : [...d.columns, ...sentExtras].some((c) => !c.label.trim())
        ? "Her fiyat sınıfına bir ad verin."
        : d.columns.some((c) => num(c.percent) === null) || num(d.retailPercent) === null
          ? "Her sütunun kâr oranını girin (0 da olabilir)."
          : strayExtra
            ? "Mağaza fiyatına önce kâr oranını girin (boşsa kaydedilmez)."
            : [...d.columns, ...d.extras].some((c) => c.erpPrice.trim() && !(num(c.erpPrice)! > 0)) ||
                (d.retailErpPrice.trim() && !(num(d.retailErpPrice)! > 0))
              ? "ERP fiyatlarını sayı olarak girin (ya da boş bırakın)."
              : d.appliedPercent.trim() && num(d.appliedPercent) === null
                ? "Uygulanacak oranı sayı olarak girin (ya da boş bırakın)."
              : num(d.vatRate) === null
                ? "Perakende için KDV oranını girin."
                : new Set(used).size !== used.length
                  ? "Bir müşteri grubu yalnızca bir sütuna bağlanabilir."
                  : null;
  const payload = (): PricingSheetInput => ({
    product_code: d.code.trim(),
    product_name: d.name.trim(),
    vat_mode: d.vatMode,
    currency: d.currency,
    cost: dec(d.cost)!,
    columns: d.columns.map((c) => ({
      label: c.label.trim(),
      segment: c.segment || null,
      percent: dec(c.percent)!,
      desired: dec(c.desired, 2),
      erp_price: dec(c.erpPrice, 2),
    })),
    retail: {
      percent: dec(d.retailPercent)!,
      vat_rate: dec(d.vatRate, 2)!,
      desired: dec(d.retailDesired, 2),
      erp_price: dec(d.retailErpPrice, 2),
    },
    extras: sentExtras.map((c) => ({
      label: c.label.trim(),
      percent: dec(c.percent)!,
      desired: dec(c.desired, 2),
      erp_price: dec(c.erpPrice, 2),
    })),
    applied_percent: dec(d.appliedPercent),
    usd_rate: foreign ? dec(d.usdRate) : null,
    eur_rate: foreign ? dec(d.eurRate) : null,
    final_try: foreign ? dec(d.finalTry, 2) : null,
  });

  const code = d.code.trim();
  // Saved over without a question, as a document is: the row the sheet was
  // loaded from (or last saved as), its code unchanged. The server decides the
  // same way; this only says so on the screen.
  const tied = savesOver(origin, code);

  /**
   * Every button's save: the server saves over the tied row, or adds one — or,
   * the code being saved already somewhere, answers with those rows, and
   * SaveDialog asks. The row goes where the button said (`dest`); the sheet is
   * then tied to it.
   */
  async function save(dest: Dest, apply: boolean, mode: "auto" | "overwrite" | "new" = "auto", overwriteId?: string) {
    if (problem) return;
    setBusy(apply ? "apply" : dest.kind);
    setResult(null);
    try {
      const r = await savePricing(payload(), {
        recordId: origin?.id,
        mode,
        overwriteId,
        place: dest.kind === "draft" ? { kind: "draft" } : { kind: "file", target: dest.target },
        apply,
      });
      setOrigin(originOf(r.record));
      setFileDialog(null);
      setAsk(null);
      // "“Ekim” dosyasına kaydedildi", "Taslaklardaki kayıt güncellendi".
      const into = r.record.file_name ? `“${r.record.file_name}” dosyasına` : "Taslaklara";
      const inside = r.record.file_name ? `“${r.record.file_name}” dosyasındaki` : "Taslaklardaki";
      if (r.applied) {
        await refreshStorefront();
        setToast("Kaydedildi ve siteye uygulandı.");
        setResult({
          kind: "success",
          text: (
            <>
              {r.overwritten ? `${inside} kayıt güncellendi` : `${into} kaydedildi`} ve{" "}
              <strong>{r.applied.product_name}</strong> ürününün{" "}
              {r.applied.variants_updated > 1 ? `${r.applied.variants_updated} rengine` : "fiyatlarına"} uygulandı:{" "}
              {r.applied.prices.map((p) => `${p.label} ${fmt(Number(p.price_incl_tax), p.currency)} (KDV dahil)`).join(" · ")}
              {r.applied.skipped.length > 0 && ` · Siteye yazılmayan: ${r.applied.skipped.join(", ")}`}
            </>
          ),
        });
      } else {
        setToast(r.overwritten ? `${inside} kayıt güncellendi.` : `${into} kaydedildi.`);
      }
      onSaved();
    } catch (err) {
      const matches = sameCodeRows(err);
      if (matches) {
        setFileDialog(null);
        setAsk({ dest, apply, matches });
        return;
      }
      setAsk(null);
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setBusy(null);
    }
  }

  // What the product will get: each class tied to a customer group, and retail.
  const basis = d.vatMode === "EXCL" ? "KDV hariç" : "KDV dahil";
  const applyLines: PriceLine[] = [
    ...d.columns.flatMap((c, i) =>
      c.segment && calc.columns[i]?.price != null
        ? [{ label: c.label.trim() || SEGMENT_LABELS[c.segment], value: `${fmt(calc.columns[i].price, d.currency)} ${basis}` }]
        : [],
    ),
    foreign && num(d.finalTry) !== null
      ? { label: "Perakende (son karar)", value: `${fmt(num(d.finalTry), "TRY")} KDV dahil` }
      : { label: "Perakende", value: `${fmt(calc.retail.price, d.currency)} KDV dahil` },
  ];

  // On a before-VAT sheet, the orange retail cell says how it got there.
  const vatShown = d.vatMode === "EXCL" && calc.retailBeforeVat !== null && calc.retail.computed !== null;
  // Label, cost, then a "+" and a step per column, a "+" and a step per extra, "+", retail, (TL).
  const span = 2 + d.columns.length * 2 + 2 + d.extras.length * 2 + (foreign ? 1 : 0);
  const steps = d.columns.length + d.extras.length;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
        {title}
      </h2>

      {/* No scrolling box at all for the standard six: the grid is the width
          of the page. Past those, it scrolls inside its own box. */}
      <div className={steps > STANDARD_STEPS ? "overflow-x-auto" : undefined}>
        <table
          className="w-full table-fixed border-collapse bg-white text-sm dark:bg-zinc-950"
          // The steps share the width equally, so the standard six boxes (cost,
          // three classes, retail, the extra) always fit. Past those, each added
          // box keeps a usable width and the grid scrolls inside its box instead.
          style={steps > STANDARD_STEPS ? { minWidth: `${6.5 + steps * 9.25 + 1.25 + 2 * 8 + (foreign ? 8 : 0)}rem` } : undefined}
        >
          {/* Only the label and "+" columns have a width; the steps split the
              rest. Set here because a fixed table otherwise takes its widths
              from the first row, which is the merged product name. */}
          <colgroup>
            <col className="w-[6.5rem]" />
            <col />
            {d.columns.map((c) => (
              <Fragment key={c.key}>
                <col className="w-5" />
                <col />
              </Fragment>
            ))}
            {d.extras.map((c) => (
              <Fragment key={c.key}>
                <col className="w-5" />
                <col />
              </Fragment>
            ))}
            <col className="w-5" />
            <col />
            {foreign && <col />}
          </colgroup>
          <tbody>
            {/* Row 1: the product. */}
            <tr>
              <td className={`${td} px-2 py-1 align-top`}>
                <ProductLookup
                  compact
                  label="Ürün kodu"
                  mono
                  value={d.code}
                  onChange={(code) => set({ code })}
                  onPick={(p) => set({ code: p.base_code, name: p.name })}
                />
              </td>
              <td colSpan={span - 1} className={`${td} px-2 py-1 align-top`}>
                <ProductLookup
                  compact
                  label="Ürün adı"
                  value={d.name}
                  onChange={(name) => set({ name })}
                  onPick={(p) => set({ code: p.base_code, name: p.name })}
                />
              </td>
            </tr>

            {/* Row 2: what each column is, with its percent. */}
            <tr className={headFill}>
              <th scope="col" className={`${td} ${clip} px-1.5 py-1.5 text-left align-top`}>
                <span className={headText}>Para birimi</span>
                <select
                  value={d.currency}
                  onChange={(e) => set({ currency: e.target.value as PricingCurrency })}
                  aria-label="Para birimi"
                  className={`${smallSelect} mt-1`}
                >
                  <option value="TRY">TL</option>
                  <option value="USD">USD (Dolar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </th>
              <th scope="col" className={`${td} ${clip} px-1.5 py-1.5 text-left align-top`}>
                <span className={headText}>{d.vatMode === "EXCL" ? "KDV hariç maliyet" : "KDV dahil maliyet"}</span>
                {/* The sheet's VAT rate, set at its start: retail adds it on a
                    before-VAT sheet, and every price is stored with it. */}
                <PercentBadge label="KDV oranı" prefix="KDV %" value={d.vatRate} onChange={(vatRate) => set({ vatRate })} />
                <span className="mt-1 block text-[10px] font-normal text-slate-500 dark:text-zinc-400">{SYMBOL[d.currency]} cinsinden</span>
              </th>
              {d.columns.map((c) => (
                <ColumnHead
                  key={c.key}
                  column={c}
                  onChange={(patch) => setColumn(c.key, patch)}
                  onRemove={() => set({ columns: d.columns.filter((x) => x.key !== c.key) })}
                />
              ))}
              {d.extras.map((c, i) => (
                <ExtraHead
                  key={c.key}
                  column={c}
                  onChange={(patch) => setExtra(c.key, patch)}
                  // The "+" right after the classes adds one, wherever retail is.
                  onAdd={i === 0 ? addColumn : undefined}
                  addDisabled={d.columns.length >= 12}
                />
              ))}
              <StepPlus
                rowSpan={4}
                onAdd={d.extras.length === 0 ? addColumn : undefined}
                disabled={d.columns.length >= 12}
              />
              <th scope="col" className={`${td} ${clip} px-1.5 py-1.5 text-left align-top`}>
                <span className={`${headText} text-red-700 dark:text-red-300`}>KDV dahil perakende fiyat</span>
                <PercentBadge label="Perakende kâr oranı" value={d.retailPercent} onChange={(retailPercent) => set({ retailPercent })} />
              </th>
              {foreign && (
                <th scope="col" className={`${td} ${clip} px-1.5 py-1.5 text-left align-top`}>
                  <span className={headText}>TL fiyat</span>
                  <span className="mt-1 block text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                    Perakende × {d.currency === "USD" ? "dolar" : "euro"} kuru
                  </span>
                </th>
              )}
            </tr>

            {/* Row 3: the formula chain. */}
            <tr>
              <th scope="row" className={`${td} ${headFill} px-2 text-left ${headText}`}>
                Hesaplanan
              </th>
              <td className={`${td} ${clip} p-0`}>
                <input
                  inputMode="decimal"
                  value={d.cost}
                  onChange={(e) => set({ cost: e.target.value })}
                  onKeyDown={(e) => stepOnArrowKey(e, (v) => set({ cost: v }))}
                  placeholder="Maliyet"
                  aria-label="Maliyet fiyatı"
                  className={`${cellInput} font-semibold`}
                />
              </td>
              {d.columns.map((c, i) => (
                <td key={c.key} className={`${td} ${clip} ${orangeFill} px-1 text-center font-mono text-[13px] font-semibold tabular-nums`}>
                  <span
                    className="block truncate"
                    title={fmt(calc.columns[i].computed, d.currency)}
                    aria-label={`${c.label || "Sütun"} hesaplanan fiyat`}
                  >
                    {fmt(calc.columns[i].computed, d.currency)}
                  </span>
                </td>
              ))}
              {d.extras.map((c, i) => (
                <td key={c.key} className={`${td} ${clip} ${orangeFill} px-1 py-0.5 text-center`}>
                  <span
                    className="block truncate font-mono text-[13px] font-bold tabular-nums"
                    title={fmt(calc.extras[i].computed, d.currency)}
                    aria-label={`${c.label || "Mağaza fiyatı"} hesaplanan fiyat (KDV dahil)`}
                  >
                    {fmt(calc.extras[i].computed, d.currency)}
                  </span>
                  {d.vatMode === "EXCL" && calc.extras[i].computed !== null && (
                    <span className="block truncate font-mono text-[9px] leading-3 text-orange-800/80 dark:text-orange-200/70">
                      {fmt(calc.extras[i].beforeVat, d.currency)} + %{d.vatRate.trim() || "0"} KDV
                    </span>
                  )}
                </td>
              ))}
              <td className={`${td} ${clip} ${orangeFill} px-1 py-0.5 text-center`}>
                <span
                  className="block truncate font-mono text-[13px] font-bold tabular-nums"
                  title={fmt(calc.retail.computed, d.currency)}
                  aria-label="Perakende hesaplanan fiyat (KDV dahil)"
                >
                  {fmt(calc.retail.computed, d.currency)}
                </span>
                {vatShown && (
                  <span className="block truncate font-mono text-[9px] leading-3 text-orange-800/80 dark:text-orange-200/70">
                    {fmt(calc.retailBeforeVat, d.currency)} + %{d.vatRate.trim() || "0"} KDV
                  </span>
                )}
              </td>
              {foreign && (
                <td className={`${td} ${clip} ${orangeFill} px-1 text-center font-mono text-[13px] font-semibold tabular-nums`}>
                  <span className="block truncate" title={fmt(calc.tryPrice, "TRY")} aria-label="TL fiyat">
                    {fmt(calc.tryPrice, "TRY")}
                  </span>
                </td>
              )}
            </tr>

            {/* Row 4: "ERP fiyatı", a base price the admin may type per column,
                in place of the calculated one. Empty unless typed. */}
            <tr>
              <th scope="row" className={`${td} ${headFill} px-2 text-left ${headText} text-sky-800 dark:text-sky-300`}>
                ERP fiyatı
              </th>
              <td className={`${td} bg-slate-50 dark:bg-zinc-900`} />
              {d.columns.map((c) => (
                <ErpCell
                  key={c.key}
                  label={`${c.label || "Sütun"} ERP fiyatı`}
                  value={c.erpPrice}
                  onChange={(erpPrice) => setColumn(c.key, { erpPrice })}
                />
              ))}
              {d.extras.map((c) => (
                <ErpCell
                  key={c.key}
                  label={`${c.label || "Mağaza fiyatı"} ERP fiyatı (KDV ${d.vatMode === "INCL" ? "dahil" : "hariç"})`}
                  value={c.erpPrice}
                  onChange={(erpPrice) => setExtra(c.key, { erpPrice })}
                />
              ))}
              <ErpCell
                label={`Perakende ERP fiyatı (KDV ${d.vatMode === "INCL" ? "dahil" : "hariç"})`}
                value={d.retailErpPrice}
                onChange={(retailErpPrice) => set({ retailErpPrice })}
              />
              {foreign && <td className={`${td} bg-slate-50 dark:bg-zinc-900`} />}
            </tr>

            {/* Row 5: the rate, under the cost, and the prices to apply: each
                column's ERP fiyatı (else its calculated price) plus the rate,
                unless a price is typed over it. */}
            <tr>
              <th scope="row" className={`${td} ${headFill} px-2 text-left ${headText} text-emerald-800 dark:text-emerald-300`}>
                Uygulanacak oran (%)
              </th>
              <td className={`${td} ${clip} ${greenFill} p-0`}>
                <span className="flex h-8 items-center ps-1.5">
                  <span className="text-[10px] font-bold text-emerald-800/70 dark:text-emerald-300/70" aria-hidden>
                    %
                  </span>
                  <input
                    inputMode="decimal"
                    value={d.appliedPercent}
                    onChange={(e) => set({ appliedPercent: e.target.value })}
                    onKeyDown={(e) => stepOnArrowKey(e, (v) => set({ appliedPercent: v }))}
                    placeholder="0"
                    aria-label="Uygulanacak oran (%)"
                    className={`${cellInput} font-semibold`}
                  />
                </span>
              </td>
              {d.columns.map((c, i) => (
                <PriceCell
                  key={c.key}
                  label={`${c.label || "Sütun"} uygulanacak fiyat`}
                  value={c.desired}
                  auto={calc.columns[i].auto}
                  currency={d.currency}
                  onChange={(desired) => setColumn(c.key, { desired })}
                />
              ))}
              {d.extras.map((c, i) => (
                <PriceCell
                  key={c.key}
                  label={`${c.label || "Mağaza fiyatı"} uygulanacak fiyat (KDV dahil)`}
                  value={c.desired}
                  auto={calc.extras[i].auto}
                  currency={d.currency}
                  onChange={(desired) => setExtra(c.key, { desired })}
                  strong
                />
              ))}
              <PriceCell
                label="Perakende uygulanacak fiyat (KDV dahil)"
                value={d.retailDesired}
                auto={calc.retail.auto}
                currency={d.currency}
                onChange={(retailDesired) => set({ retailDesired })}
                strong
              />
              {foreign && (
                <td className={`${td} ${clip} bg-red-50 p-0 dark:bg-red-500/10`}>
                  <input
                    inputMode="decimal"
                    value={d.finalTry}
                    onChange={(e) => set({ finalTry: e.target.value })}
                    onKeyDown={(e) => stepOnArrowKey(e, (v) => set({ finalTry: v }))}
                    placeholder="son karar (TL)"
                    aria-label="Son karar (TL, KDV dahil)"
                    className={`${cellInput} font-semibold text-red-900 dark:text-red-100`}
                  />
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Under the grid: the rates on the left (USD/EUR), the buttons on the right. */}
      {/* The row "Kaydet" writes over: the one loaded, or the one this sheet last saved. */}
      {origin && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
          <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Düzenlenen kayıt: <strong className="font-mono">{origin.code || "kodsuz"}</strong>
            {origin.name && ` ${origin.name}`}
            {origin.fileName && (
              <span className="ml-1.5 rounded bg-sky-100 px-1.5 py-0.5 font-medium dark:bg-sky-500/20">{origin.fileName}</span>
            )}
            .{" "}
            {tied
              ? "Kaydettiğinizde bu kaydın üstüne yazılır; kayıt bastığınız butonun yerine (Taslaklar ya da seçtiğiniz dosya) geçer."
              : "Ürün kodunu değiştirdiniz: kaydettiğinizde yeni bir kayıt eklenir (bu kod kayıtlıysa önce sorulur); düzenlenen kayıt olduğu gibi kalır."}
          </span>
          <button
            type="button"
            onClick={() => setOrigin(null)}
            disabled={!!busy}
            className="ml-auto inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline disabled:opacity-50"
            title="Bu cetvel kayıttan ayrılır: sonraki kayıt yeni bir satır olur (kod kayıtlıysa sorulur)."
          >
            <X className="h-3.5 w-3.5" aria-hidden /> Kayıttan ayır
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {foreign &&
            (
              [
                ["usdRate", "Dolar kuru"],
                ["eurRate", "Euro kuru"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center border border-slate-300 dark:border-zinc-600">
                <span className={`${headFill} ${headText} border-r border-slate-300 px-2 py-2 dark:border-zinc-600`}>{label}</span>
                <input
                  inputMode="decimal"
                  value={d[k]}
                  onChange={(e) => set({ [k]: e.target.value })}
                  onKeyDown={(e) => stepOnArrowKey(e, (v) => set({ [k]: v }))}
                  className={`${cellInput} w-24 bg-white dark:bg-zinc-950`}
                />
              </label>
            ))}
          {foreign && <span className="text-[11px] text-slate-500 dark:text-zinc-400">TCMB kuru; değiştirebilirsiniz.</span>}
          {problem && <span className="text-[11px] text-slate-500 dark:text-zinc-400">{problem}</span>}
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <button type="button" disabled={!!problem || !!busy} onClick={() => void save({ kind: "draft" }, false)} className={OUTLINE_BUTTON}>
            <Save className="h-3.5 w-3.5" aria-hidden /> {busy === "draft" ? "Kaydediliyor…" : "Taslak olarak kaydet"}
          </button>
          <button type="button" disabled={!!problem || !!busy} onClick={() => setFileDialog({ apply: false })} className={OUTLINE_BUTTON}>
            <FilePlus2 className="h-3.5 w-3.5" aria-hidden /> Dosyaya kaydet
          </button>
          <button
            type="button"
            disabled={!!problem || !!busy || !code}
            onClick={() => setFileDialog({ apply: true })}
            title={!code ? "Siteye kaydetmek için ürün kodu gerekli" : undefined}
            className={RED_BUTTON}
          >
            <Rocket className="h-3.5 w-3.5" aria-hidden /> {busy === "apply" ? "Uygulanıyor…" : "Dosya ve sitede ürüne kaydet"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
        Turuncu satır kendi formül zinciriyle hesaplanır: bayi → toptan → kafe → mağaza fiyatı → perakende. Mavi satıra
        (ERP fiyatı) isterseniz sütun için bir taban fiyat yazın. Cetvel 1’de mavi satır KDV hariçtir: ürünün ERP
        fiyatlarına olduğu gibi yazılır, perakende ve mağaza fiyatında yeşil satır ona KDV’yi ekler (595 + %20 KDV = 714).
        Cetvel 2’de mavi satır KDV dahildir: yeşil satır ona yalnızca oranı ekler (115 + %5 = 120,75), ürünün ERP
        fiyatlarına KDV’si çıkarılarak yazılır (115 / 1,20 = 95,83) ve dört grup da “KDV dahil göster” olur. Yeşil satır siteye gönderilen fiyattır: ERP fiyatı —
        boşsa hesaplanan fiyat — bayi, toptan ve kafede maliyetin altındaki uygulanacak oran eklenerek kendiliğinden
        dolar; mağaza fiyatı ve perakendeye oran eklenmez, yeşil satırları ERP fiyatının (boşsa hesaplananın) kendisidir.
        Yeşil satıra fiyat yazarsanız (ör. 199,90) o fiyat geçerli olur. Hiçbiri zinciri değiştirmez. Mağaza fiyatı ve
        perakende KDV dahildir:{" "}
        {d.vatMode === "EXCL"
          ? "maliyet KDV hariç olduğundan KDV perakende adımında eklenir."
          : "maliyet zaten KDV dahil olduğundan perakendeye ayrıca KDV eklenmez; KDV oranı fiyatların KDV hariç karşılığı için kullanılır."}{" "}
        Perakende, mağaza fiyatının KDV’siz adımının üzerine hesaplanır (KDV bir kez eklenir). Mağaza fiyatı isteğe bağlıdır
        (kâr oranı boşsa kaydedilmez ve perakende kafe fiyatının üzerine hesaplanır), kayda girer ama siteye
        yazılmaz.
      </p>

      {result && (
        <div className="mt-3">
          <Alert variant={result.kind === "success" ? "success" : "error"}>{result.text}</Alert>
        </div>
      )}

      {fileDialog && (
        <FileDialog
          files={files}
          initialFileId={origin?.fileId ?? null}
          title={fileDialog.apply ? "Dosyaya kaydet ve siteye uygula" : "Dosyaya kaydet"}
          note={
            fileDialog.apply
              ? `“${code}” kodlu ürünün fiyatları bu satırla değiştirilecek, satıştaki tüm renklerinde (yeşil satır): ${applyLines
                  .map((l) => `${l.label} ${l.value}`)
                  .join(" · ")}. Müşteri grubu seçilmemiş sütunlar ve mağaza fiyatı siteye gönderilmez.`
              : undefined
          }
          confirmLabel={fileDialog.apply ? "Kaydet ve uygula" : "Kaydet"}
          busy={busy !== null}
          onConfirm={(target) => void save({ kind: "file", target }, fileDialog.apply)}
          onClose={() => setFileDialog(null)}
        />
      )}

      {ask && (
        <SaveDialog
          code={code}
          matches={ask.matches}
          apply={
            ask.apply
              ? {
                  prices: applyLines,
                  note: `“${code}” kodlu ürünün satıştaki tüm renklerine yazılır (yeşil satır). Müşteri grubu seçilmemiş sütunlar ve mağaza fiyatı siteye gönderilmez.`,
                }
              : null
          }
          busy={busy !== null}
          onOverwrite={(record) => void save(ask.dest, ask.apply, "overwrite", record.id)}
          onSaveNew={() => void save(ask.dest, ask.apply, "new")}
          onClose={() => setAsk(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[70] flex max-w-sm items-start gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-900/20"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {toast}
        </div>
      )}
    </section>
  );
}

/** A blue "ERP fiyatı": a base price typed by hand, empty until it is. */
function ErpCell({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <td className={`${td} ${clip} ${blueFill} p-0`}>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => stepOnArrowKey(e, (v) => onChange(v))}
        aria-label={label}
        className={`${cellInput} font-semibold`}
      />
    </td>
  );
}

/**
 * A green "uygulanacak fiyat", the price the column sends: its base plus the
 * rate stands in it on its own; a price typed over it wins.
 */
function PriceCell({
  label,
  value,
  auto,
  currency,
  onChange,
  strong,
}: {
  label: string;
  value: string;
  auto: number | null;
  currency: PricingCurrency;
  onChange: (value: string) => void;
  strong?: boolean;
}) {
  const shown = auto === null ? "" : auto.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <td className={`${td} ${clip} ${greenFill} p-0`}>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => stepOnArrowKey(e, (v) => onChange(v))}
        placeholder={shown || "—"}
        title={value ? undefined : auto === null ? undefined : `${fmt(auto, currency)} — yazarak değiştirebilirsiniz`}
        aria-label={label}
        className={`${priceInput} ${strong ? "font-semibold" : ""}`}
      />
    </td>
  );
}

/**
 * A price before retail ("Mağaza Fiyatı"), preceded by its "(+)": its name, to
 * rename, and its percent — as retail's header, after VAT, for reference only.
 */
function ExtraHead({
  column: c,
  onChange,
  onAdd,
  addDisabled,
}: {
  column: ColumnDraft;
  onChange: (patch: Partial<ColumnDraft>) => void;
  onAdd?: () => void;
  addDisabled?: boolean;
}) {
  return (
    <>
      <StepPlus rowSpan={4} onAdd={onAdd} disabled={addDisabled} />
      <th scope="col" className={`${td} ${clip} px-1.5 py-1.5 text-left align-top`}>
        <input
          value={c.label}
          maxLength={40}
          onChange={(e) => onChange({ label: e.target.value })}
          aria-label="Mağaza fiyatının adı"
          className={`${headText} h-5 w-full min-w-0 border-0 border-b border-transparent bg-transparent p-0 text-red-700 hover:border-slate-400 focus:border-red-500 focus:outline-none dark:text-red-300`}
        />
        <PercentBadge label={`${c.label || "Mağaza fiyatı"} kâr oranı`} value={c.percent} onChange={(percent) => onChange({ percent })} />
        <span className="mt-1 block text-[10px] font-normal leading-3 text-slate-500 dark:text-zinc-400">KDV dahil · siteye yazılmaz</span>
      </th>
    </>
  );
}

/** A price class's header cell, preceded by its "(+)": name, %, where it goes. */
function ColumnHead({
  column: c,
  onChange,
  onRemove,
}: {
  column: ColumnDraft;
  onChange: (patch: Partial<ColumnDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <>
      {/* Its "+" spans the header, formula, ERP and price rows. */}
      <StepPlus rowSpan={4} />
      <th scope="col" className={`${td} ${clip} px-1.5 py-1.5 text-left align-top`}>
        <span className="flex items-start gap-0.5">
          <input
            value={c.label}
            maxLength={40}
            onChange={(e) => onChange({ label: e.target.value })}
            aria-label="Fiyat sınıfının adı"
            className={`${headText} h-5 min-w-0 flex-1 border-0 border-b border-transparent bg-transparent p-0 hover:border-slate-400 focus:border-red-500 focus:outline-none`}
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`${c.label || "Sütunu"} kaldır`}
            title="Sütunu kaldır"
            className="text-slate-400 hover:text-red-600"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
        <PercentBadge label={`${c.label || "Sütun"} kâr oranı`} value={c.percent} onChange={(percent) => onChange({ percent })} />
        <select
          value={c.segment}
          onChange={(e) => onChange({ segment: e.target.value as PricingSegment | "" })}
          aria-label={`${c.label || "Sütun"}: sitede hangi fiyat`}
          className={`${smallSelect} mt-1`}
        >
          <option value="">Siteye yazılmaz</option>
          {(["DEALER", "WHOLESALE", "CAFE"] as const).map((sgm) => (
            <option key={sgm} value={sgm}>
              → {SEGMENT_LABELS[sgm]} fiyatı
            </option>
          ))}
        </select>
      </th>
    </>
  );
}
