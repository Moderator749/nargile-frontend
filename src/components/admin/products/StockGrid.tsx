"use client";

import { Minus, Palette, Plus } from "lucide-react";

import { SheetField, sheetInputClass } from "@/components/admin/products/SheetParts";
import { stockTotal, type ColorDraft, type StockDraft } from "@/components/admin/products/sheetDraft";
import { steppedValue, stepOnArrowKey } from "@/lib/numberStep";

const stepButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5";

/**
 * "Mevcut Stok Adedi": the one stock every buyer draws from — Perakende and the
 * Bayi / Toptan / Kafe lists alike — with − / + beside the box (and ↑ / ↓ in
 * it, ×10 with Shift).
 */
function StockCount({
  id,
  rowLabel,
  stock,
  onChange,
}: {
  id: string;
  /** Names the box for a screen reader on a coloured product ("Siyah"). */
  rowLabel: string;
  stock: StockDraft;
  onChange: (stock: StockDraft) => void;
}) {
  const set = (quantity: string) => onChange({ quantity });
  const step = (delta: number) => {
    const next = steppedValue(stock.quantity, delta);
    if (next !== null) set(next);
  };
  return (
    <SheetField id={id} label="Mevcut Stok Adedi">
      <div className="flex max-w-60 items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={stockTotal(stock) === 0}
          aria-label={`${rowLabel}: stoğu bir azalt`}
          className={stepButton}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={stock.quantity}
          onChange={(e) => set(e.target.value)}
          onKeyDown={(e) => stepOnArrowKey(e, set, { integer: true })}
          placeholder="0"
          aria-label={`${rowLabel}: mevcut stok adedi`}
          className={`${sheetInputClass} text-center font-mono text-base font-semibold tabular-nums`}
        />
        <button type="button" onClick={() => step(1)} aria-label={`${rowLabel}: stoğu bir artır`} className={stepButton}>
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </SheetField>
  );
}

/**
 * "STOK" — the stock, once per colour. Every customer group buys from it; only
 * their prices differ (the price table below).
 *
 * Stock lives on the variant and a variant is a colour, so a product with colour
 * pills gets a box each and a colourless one gets a single box. Adding or
 * removing a pill in "Ürün Bilgileri" adds or removes a block here, because both
 * read the very same rows.
 */
export function StockGrid({
  colors,
  stock,
  onColorsChange,
  onStockChange,
}: {
  colors: ColorDraft[];
  /** The stock of a colourless product; unused once `colors` is non-empty. */
  stock: StockDraft;
  onColorsChange: (colors: ColorDraft[]) => void;
  onStockChange: (stock: StockDraft) => void;
}) {
  if (colors.length === 0) {
    return <StockCount id="stock" rowLabel="Ürün" stock={stock} onChange={onStockChange} />;
  }

  const setColorStock = (key: string, next: StockDraft) =>
    onColorsChange(colors.map((c) => (c.key === key ? { ...c, stock: next } : c)));

  return (
    <ul className="space-y-3">
      {colors.map((color) => (
        <li
          key={color.key}
          className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <h3 className="mb-2 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-zinc-100">
            <Palette className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
            <span className="truncate" title={color.label}>
              {color.label}
            </span>
          </h3>
          <StockCount
            id={`stock-${color.key}`}
            rowLabel={color.label}
            stock={color.stock}
            onChange={(next) => setColorStock(color.key, next)}
          />
          {color.sku && (
            <p className="mt-2 font-mono text-[11px] text-slate-500 dark:text-zinc-500">Stok kodu: {color.sku}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
