"use client";

import {
  CURRENCY_LABEL,
  SHEET_COLUMNS,
  SHEET_CURRENCIES,
  withVat,
  type CellDraft,
  type SheetDraft,
  type VatRate,
} from "@/components/admin/products/sheetDraft";
import type { CurrencyType, SheetSegment } from "@/types";

const cellInput =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-right text-sm tabular-nums shadow-sm transition-colors placeholder:text-slate-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:placeholder:text-zinc-600";

/**
 * The sheet's price matrix: a row per currency, a column per customer group, and
 * two boxes per cell. The admin types the net price (KDV hariç) and the gross box
 * (KDV dahil) follows from the sheet's KDV rate — read-only, so the two can never
 * disagree with each other or with the rate.
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
                  <span>KDV dahil (otom.)</span>
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
                        onChange={(e) =>
                          onChange(currency, segment, { excl: e.target.value, incl: withVat(e.target.value, vatRate) })
                        }
                        aria-label={`${label} ${CURRENCY_LABEL[currency]} KDV hariç fiyat`}
                        placeholder="0,00"
                        className={cellInput}
                      />
                      <input
                        type="text"
                        value={cell.incl}
                        readOnly
                        tabIndex={-1}
                        aria-label={`${label} ${CURRENCY_LABEL[currency]} KDV dahil fiyat (otomatik)`}
                        placeholder="0,00"
                        className={`${cellInput} cursor-default bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-zinc-300`}
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
