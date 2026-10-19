"use client";

import {
  CURRENCY_LABEL,
  SHEET_COLUMNS,
  SHEET_CURRENCIES,
  typedCell,
  type CellDraft,
  type SheetDraft,
  type VatRate,
} from "@/components/admin/products/sheetDraft";
import { parseDecimalInput, tidyPriceInput } from "@/lib/format";
import type { CurrencyType, SheetSegment } from "@/types";

const cellInput =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-right text-sm tabular-nums shadow-sm transition-colors placeholder:text-slate-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 aria-invalid:border-red-500 aria-invalid:bg-red-50 dark:border-white/15 dark:bg-zinc-900 dark:placeholder:text-zinc-600 dark:aria-invalid:bg-red-500/10";

/** Typed, but not a price ("12,345", "abc"): marked, and the form will not save it. */
const invalid = (raw: string) => !!raw.trim() && parseDecimalInput(raw) === null;

/**
 * The sheet's price matrix: a row per currency, a column per customer group, and
 * two boxes per cell. The admin types either price — net (KDV hariç) or gross
 * (KDV dahil) — and the other follows from the sheet's KDV rate, so the two
 * always agree with each other and with the rate. Either decimal mark works
 * ("183,33" or "183.33"); leaving a box tidies it to "183,33".
 */
export function PricingGrid({
  prices,
  vatRate,
  onChange,
}: {
  prices: SheetDraft["prices"];
  vatRate: VatRate;
  onChange: (currency: CurrencyType, segment: SheetSegment, cell: CellDraft) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">Müşteri grubu ve para birimine göre fiyat tablosu</caption>
        <thead>
          <tr>
            <th scope="col" className="w-20 border border-slate-300 bg-slate-100 px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide dark:border-white/15 dark:bg-white/[0.06]">
              Para br.
            </th>
            {SHEET_COLUMNS.map(({ segment, label }) => (
              <th
                key={segment}
                scope="col"
                className="border border-slate-300 bg-slate-100 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide dark:border-white/15 dark:bg-white/[0.06]"
              >
                {label}
              </th>
            ))}
          </tr>
          <tr>
            <th scope="col" className="border border-slate-300 px-2 py-1 text-left text-[10px] font-medium text-slate-500 dark:border-white/15 dark:text-zinc-400">
              <span className="sr-only">Satır</span>
            </th>
            {SHEET_COLUMNS.map(({ segment }) => (
              <th key={segment} scope="col" className="border border-slate-300 px-2 py-1 dark:border-white/15">
                <span className="grid grid-cols-2 gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  <span>KDV hariç</span>
                  <span>KDV dahil</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHEET_CURRENCIES.map((currency) => (
            <tr key={currency}>
              <th scope="row" className="border border-slate-300 bg-slate-50 px-2 py-2 text-left text-xs font-bold dark:border-white/15 dark:bg-white/[0.03]">
                {CURRENCY_LABEL[currency]}
              </th>
              {SHEET_COLUMNS.map(({ segment, label }) => {
                const cell = prices[currency][segment];
                return (
                  <td key={segment} className="border border-slate-300 p-1.5 dark:border-white/15">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cell.excl}
                        onChange={(e) => onChange(currency, segment, typedCell(cell, "excl", e.target.value, vatRate))}
                        onBlur={() => onChange(currency, segment, { ...cell, excl: tidyPriceInput(cell.excl) })}
                        aria-invalid={invalid(cell.excl) || undefined}
                        aria-label={`${label} ${CURRENCY_LABEL[currency]} KDV hariç fiyat`}
                        placeholder="0,00"
                        className={cellInput}
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cell.incl}
                        onChange={(e) => onChange(currency, segment, typedCell(cell, "incl", e.target.value, vatRate))}
                        onBlur={() => onChange(currency, segment, { ...cell, incl: tidyPriceInput(cell.incl) })}
                        aria-invalid={invalid(cell.incl) || undefined}
                        aria-label={`${label} ${CURRENCY_LABEL[currency]} KDV dahil fiyat`}
                        placeholder="0,00"
                        className={cellInput}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
