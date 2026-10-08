"use client";

import { Palette } from "lucide-react";

import { SheetField, sheetInputClass, sheetLabelClass } from "@/components/admin/products/SheetParts";
import {
  SHEET_COLUMNS,
  stockTotal,
  type ColorDraft,
  type StockDraft,
} from "@/components/admin/products/sheetDraft";

const totalBox =
  "flex h-10 items-center justify-end rounded-lg border border-slate-300 bg-slate-100 px-3 font-mono text-sm font-bold tabular-nums dark:border-white/15 dark:bg-white/[0.06]";
const quotaInput = `${sheetInputClass} text-right tabular-nums`;

/** The four quota boxes of one row: two abreast on a phone, four on a desktop. */
function Quotas({
  idPrefix,
  rowLabel,
  stock,
  onChange,
}: {
  idPrefix: string;
  /** Names each box for a screen reader, which has no column header to lean on. */
  rowLabel: string;
  stock: StockDraft;
  onChange: (stock: StockDraft) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SHEET_COLUMNS.map(({ label, stockField }) => (
        <SheetField key={stockField} id={`${idPrefix}-${stockField}`} label={label}>
          <input
            id={`${idPrefix}-${stockField}`}
            type="text"
            inputMode="numeric"
            value={stock[stockField]}
            onChange={(e) => onChange({ ...stock, [stockField]: e.target.value })}
            placeholder="0"
            aria-label={`${rowLabel}: ${label} stoğu`}
            className={quotaInput}
          />
        </SheetField>
      ))}
    </div>
  );
}

/**
 * "STOK" — the four segment quotas, once per colour.
 *
 * Stock lives on the variant and a variant is a colour, so a product with colour
 * pills gets a block each and a colourless one gets a single block. Adding or
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
  /** The quotas of a colourless product; unused once `colors` is non-empty. */
  stock: StockDraft;
  onColorsChange: (colors: ColorDraft[]) => void;
  onStockChange: (stock: StockDraft) => void;
}) {
  if (colors.length === 0) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex-1">
          <Quotas idPrefix="stock" rowLabel="Stok" stock={stock} onChange={onStockChange} />
        </div>
        <div className="sm:w-32">
          <span className={sheetLabelClass}>Toplam Stok</span>
          <output className={totalBox} aria-live="polite">
            {stockTotal(stock).toLocaleString("tr-TR")}
          </output>
        </div>
      </div>
    );
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
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-zinc-100">
              <Palette className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
              <span className="truncate" title={color.label}>
                {color.label}
              </span>
            </h3>
            <p className="shrink-0 font-mono text-xs tabular-nums text-slate-500 dark:text-zinc-400">
              Toplam <span className="font-bold text-slate-800 dark:text-zinc-100">{stockTotal(color.stock).toLocaleString("tr-TR")}</span>
            </p>
          </div>
          <Quotas
            idPrefix={`stock-${color.key}`}
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
