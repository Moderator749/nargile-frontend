"use client";

import { useRef, type KeyboardEvent } from "react";
import Link from "next/link";

import { formatMoney, tidyPriceInput } from "@/lib/format";
import { cellKey, GRID_SEGMENTS, normalized, verticalMove, type GridSegment } from "@/lib/erpGrid";
import { pickPriceRow } from "@/lib/retailPrice";
import type { AdminProduct, Segment } from "@/types";

const th = "px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500";
const input =
  "h-9 w-full rounded-md border bg-white px-2 text-right text-sm font-semibold tabular-nums shadow-sm transition-colors duration-150 placeholder:font-normal placeholder:text-slate-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:bg-zinc-900 dark:placeholder:text-zinc-600";

/** A product's saved TL ERP price for a group, as the server spells it. */
export function savedErp(product: AdminProduct, segment: GridSegment): string | null {
  return normalized(product.erp_prices?.TRY?.[segment] ?? null);
}

/**
 * "Fiyat Giriş Modu": the products list as a grid of TL ERP prices (KDV
 * hariç), a column per customer group, typed as in a spreadsheet — Tab to the
 * right (then the next row), Enter down, Shift+Enter up, Escape back to the
 * saved price. An edited cell is tinted until it is saved; a cell just saved,
 * green. Under each, the group's site price as it is now; "+%5" where the
 * product's worksheet adds its rate to the ERP price.
 */
export function ErpPriceGrid({
  products,
  segments,
  drafts,
  changed,
  invalid,
  saved,
  disabled,
  onDraft,
}: {
  products: AdminProduct[];
  segments: Segment[] | null;
  drafts: Readonly<Record<string, string>>;
  /** Cells whose typed price differs from the saved one. */
  changed: ReadonlySet<string>;
  /** Cells whose text is not a price. */
  invalid: ReadonlySet<string>;
  /** Cells the last save wrote. */
  saved: ReadonlySet<string>;
  disabled: boolean;
  /** A cell typed into; undefined puts it back to the saved price. */
  onDraft: (key: string, value: string | undefined) => void;
}) {
  const table = useRef<HTMLTableElement>(null);
  const segmentId = (segment: GridSegment) => segments?.find((s) => s.code === segment)?.id;

  function focusCell(row: number, col: number) {
    const cell = table.current?.querySelector<HTMLInputElement>(`[data-erp-cell="${row}:${col}"]`);
    cell?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, row: number, col: number, key: string) {
    if (event.key === "Enter") {
      event.preventDefault();
      focusCell(verticalMove(row, products.length, event.shiftKey), col);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onDraft(key, undefined);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table ref={table} className="w-full min-w-[52rem] table-fixed text-sm">
        <caption className="sr-only">
          Ürünlerin müşteri grubuna göre TL ERP fiyatları (KDV hariç). Enter alttaki ürüne, Tab sağdaki hücreye geçer.
        </caption>
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-white/10">
            <th scope="col" className={`${th} w-32 pl-4`}>
              Ürün Kodu
            </th>
            <th scope="col" className={th}>
              Ürün
            </th>
            {GRID_SEGMENTS.map(({ segment, label }) => (
              <th key={segment} scope="col" className={`${th} w-36 text-right`}>
                {label}
                <span className="block text-[10px] font-medium normal-case tracking-normal text-slate-400 dark:text-zinc-500">
                  ERP · KDV hariç, TL
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {products.map((product, row) => {
            const rule = product.price_rule ?? null;
            const variant = product.variants[0] ?? null;
            return (
              <tr key={product.id} className={product.is_published ? "" : "opacity-70"}>
                <td className="py-2 pl-4 pr-2 align-top">
                  <span className="block truncate pt-2 font-mono text-xs font-medium" title={product.base_code}>
                    {product.base_code}
                  </span>
                </td>
                <td className="px-2 py-2 align-top">
                  <Link
                    href={`/admin/products/${product.id}`}
                    tabIndex={-1}
                    className="block truncate pt-1.5 font-medium hover:text-red-600 dark:hover:text-red-400"
                    title={product.name}
                  >
                    {product.name}
                  </Link>
                  <span
                    className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-zinc-400"
                    title={
                      rule
                        ? "Site fiyatı, ürünün Fiyat Hesaplama Cetveli’ndeki kuralla hesaplanır: ERP fiyatı + uygulanacak oran (perakende: ERP fiyatı)."
                        : "Ürüne uygulanmış bir cetvel yok: site fiyatı ERP fiyatının kendisi olur (KDV eklenerek)."
                    }
                  >
                    {rule
                      ? `Cetvel kuralı${rule.applied_percent && Number(rule.applied_percent) ? ` · +%${Number(rule.applied_percent).toLocaleString("tr-TR")}` : ""}`
                      : "Cetvel yok · site = ERP"}
                  </span>
                </td>
                {GRID_SEGMENTS.map(({ segment, label }, col) => {
                  const key = cellKey(product.id, segment);
                  const stored = savedErp(product, segment);
                  const value = drafts[key] ?? (stored ? tidyPriceInput(stored) : "");
                  const bad = invalid.has(key);
                  const edited = changed.has(key);
                  const site = variant ? pickPriceRow(variant.prices, segmentId(segment)) : null;
                  const rated =
                    rule && segment !== "RETAIL" && rule.segments.includes(segment) && rule.applied_percent && Number(rule.applied_percent);
                  return (
                    <td
                      key={segment}
                      className={`px-2 py-2 align-top transition-colors duration-200 ${
                        bad
                          ? "bg-red-50 dark:bg-red-500/10"
                          : edited
                            ? "bg-sky-50 dark:bg-sky-500/10"
                            : saved.has(key)
                              ? "bg-emerald-50/80 dark:bg-emerald-500/10"
                              : ""
                      }`}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        disabled={disabled}
                        data-erp-cell={`${row}:${col}`}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => onDraft(key, e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, row, col, key)}
                        onBlur={() => {
                          if (drafts[key] !== undefined && !bad) onDraft(key, tidyPriceInput(drafts[key]));
                        }}
                        aria-label={`${product.name} · ${label} ERP fiyatı (KDV hariç, TL)`}
                        aria-invalid={bad || undefined}
                        placeholder="—"
                        className={`${input} ${
                          bad
                            ? "border-red-500"
                            : edited
                              ? "border-sky-400 dark:border-sky-500/60"
                              : "border-slate-300 dark:border-white/15"
                        }`}
                      />
                      <span className="mt-1 flex items-center justify-end gap-1 text-[11px] tabular-nums text-slate-500 dark:text-zinc-400">
                        {rated ? (
                          <span
                            className="rounded bg-slate-100 px-1 font-semibold text-slate-600 dark:bg-white/10 dark:text-zinc-300"
                            title="Cetvelin uygulanacak oranı ERP fiyatına eklenir"
                          >
                            +%{Number(rule.applied_percent).toLocaleString("tr-TR")}
                          </span>
                        ) : null}
                        <span title="Sitedeki fiyat (KDV dahil)">
                          {variant ? (site ? `Site ${formatMoney(site.price_incl_tax, site.currency)}` : "Site —") : "Satışta renk yok"}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
