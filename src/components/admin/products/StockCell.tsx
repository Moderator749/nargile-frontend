"use client";

import { useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { Loader2 } from "lucide-react";

import { adminSetProductStock } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminProduct, AdminVariant } from "@/types";

export const LOW_STOCK = 10;
// The server's bound (app.schemas.admin.VariantStockUpdate).
const STOCK_MAX = 1_000_000;

/** A colour's stock: the central one every buyer draws from. */
export const variantStock = (v: AdminVariant) => v.inventory.find((i) => i.warehouse_type === "RETAIL_STOCK")?.quantity ?? 0;

/** The stock of every colour together. */
export const productStock = (product: AdminProduct) => product.variants.reduce((sum, v) => sum + variantStock(v), 0);

/** The retail stock of every colour together, and how many colours that was. */
export function StockPill({ quantity, colors }: { quantity: number; colors: number }) {
  const tone =
    quantity === 0
      ? "bg-red-600 text-white ring-red-600"
      : quantity < LOW_STOCK
        ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
        : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10";
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${tone}`}>
        {quantity === 0 ? "Yok" : quantity.toLocaleString("tr-TR")}
      </span>
      {colors > 1 && <span className="text-[10px] leading-none text-slate-500 dark:text-zinc-500">{colors} renk</span>}
    </span>
  );
}

const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-center text-sm font-semibold tabular-nums text-slate-900 shadow-sm [appearance:textfield] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

/**
 * The products list's stock column, edited where it stands: a click on the
 * number opens an input (one per colour on a coloured product), Enter or
 * leaving the field saves it through the stock-only endpoint, Escape puts it
 * back. The saved row comes back from the server and replaces the shown one.
 */
export function StockCell({
  product,
  onSaved,
}: {
  product: AdminProduct;
  /** The row as the server now has it. */
  onSaved: (row: AdminProduct) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Enter saves and the field then loses focus: the blur must not save twice.
  const settled = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const colours = product.variants;

  function start() {
    settled.current = false;
    setError(null);
    setDraft(Object.fromEntries(colours.map((v) => [v.id, String(variantStock(v))])));
  }

  function cancel() {
    settled.current = true;
    setDraft(null);
    setError(null);
  }

  async function save() {
    if (!draft || settled.current || saving) return;
    const changed: { id: string; quantity: number }[] = [];
    for (const v of colours) {
      const text = (draft[v.id] ?? "").trim();
      const quantity = Number(text);
      if (text === "" || !Number.isInteger(quantity) || quantity < 0 || quantity > STOCK_MAX) {
        setError(`0 ile ${STOCK_MAX.toLocaleString("tr-TR")} arasında bir tam sayı girin.`);
        return;
      }
      if (quantity !== variantStock(v)) changed.push({ id: v.id, quantity });
    }
    settled.current = true;
    if (changed.length === 0) {
      setDraft(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onSaved(await adminSetProductStock(product.id, changed));
      setDraft(null);
    } catch (err) {
      settled.current = false;
      setError(getApiErrorMessage(err, "Stok kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  // Saved once focus leaves the cell, not when it moves from one colour's field to the next.
  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (box.current?.contains(e.relatedTarget as Node | null)) return;
    void save();
  }

  if (!draft) {
    return (
      <button
        type="button"
        onClick={start}
        title="Stoğu düzenle"
        aria-label={`${product.name} stoğunu düzenle`}
        className="cursor-pointer rounded-lg p-1 transition-[background-color,box-shadow] duration-200 hover:bg-slate-100 hover:ring-1 hover:ring-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:hover:bg-white/5 dark:hover:ring-white/10"
      >
        <StockPill quantity={productStock(product)} colors={colours.length} />
      </button>
    );
  }

  return (
    <div ref={box} onBlur={onBlur} className="mx-auto flex max-w-28 flex-col gap-1.5 text-left">
      {colours.map((v, i) => (
        <label key={v.id} className="block">
          {colours.length > 1 && (
            <span className="block truncate text-[10px] font-medium text-slate-500 dark:text-zinc-400" title={v.color_name ?? undefined}>
              {v.color_name || v.sku}
            </span>
          )}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={STOCK_MAX}
            step={1}
            value={draft[v.id] ?? ""}
            onChange={(e) => setDraft((d) => (d ? { ...d, [v.id]: e.target.value } : d))}
            onKeyDown={onKeyDown}
            onFocus={(e) => e.target.select()}
            autoFocus={i === 0}
            disabled={saving}
            aria-label={colours.length > 1 ? `${product.name}, ${v.color_name || v.sku} stoğu` : `${product.name} stoğu`}
            aria-invalid={error ? true : undefined}
            className={`${inputClass} ${error ? "border-red-500 ring-2 ring-red-500/20" : ""}`}
          />
        </label>
      ))}
      <span className="flex min-h-4 items-center justify-center text-[10px] leading-tight" aria-live="polite">
        {saving ? (
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" aria-label="Kaydediliyor" />
        ) : error ? (
          <span className="text-center text-red-600 dark:text-red-400">{error}</span>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500">Enter: kaydet · Esc: vazgeç</span>
        )}
      </span>
    </div>
  );
}
