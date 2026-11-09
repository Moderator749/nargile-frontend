"use client";

import { useId } from "react";

import {
  CURRENCY_LABEL,
  SHEET_COLUMNS,
  SHEET_CURRENCIES,
  erpPriceInvalid,
  noErpDisplay,
  type ErpDraft,
} from "@/components/admin/products/sheetDraft";
import { CATALOG_SEGMENTS, type CatalogSegment } from "@/lib/erpCatalog";
import { tidyPriceInput } from "@/lib/format";
import { stepOnArrowKey } from "@/lib/numberStep";
import type { CurrencyType, SheetSegment } from "@/types";

const th =
  "border border-slate-300 bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-200";
const rowHead =
  "w-44 border border-slate-300 bg-slate-50 px-3 py-2 text-left align-middle text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-200";
const note = "mt-0.5 block text-[10px] font-medium normal-case tracking-normal text-slate-500 dark:text-zinc-400";
/** The table's look, for a category's bulk "KDV gösterimi" (CategoryBulkSettings) to match it. */
export const erpTableClass = { th, rowHead, note } as const;
const erpInput =
  "h-9 w-full rounded-md border border-slate-300 bg-sky-50/60 px-2 text-right text-sm font-semibold tabular-nums shadow-sm transition-colors placeholder:font-normal placeholder:text-slate-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 aria-invalid:border-red-500 aria-invalid:bg-red-50 dark:border-white/15 dark:bg-sky-500/10 dark:placeholder:text-zinc-600 dark:aria-invalid:bg-red-500/10";

/**
 * "ERP ve Katalog Fiyatları", under "Fiyat Tablosu": one table, a column per
 * customer group. Its currency rows hold the product's ERP price (KDV hariç)
 * — what applying a pricing worksheet writes from its blue "ERP fiyatı" row —
 * and its last row how the price catalogue (PDF) shows the group's price:
 * "KDV hariç göster", "KDV dahil göster", or, with neither picked, the full
 * split. For the price catalogue only; the storefront never reads it.
 */
export function ErpCatalogPrices({ erp, onChange }: { erp: ErpDraft; onChange: (erp: ErpDraft) => void }) {
  const name = useId();
  const chosen = CATALOG_SEGMENTS.some((s) => erp.display[s] !== null);
  const choose = (segment: CatalogSegment, incl: boolean) => onChange({ ...erp, display: { ...erp.display, [segment]: incl } });
  const setPrice = (c: CurrencyType, segment: SheetSegment, value: string) =>
    onChange({ ...erp, prices: { ...erp.prices, [c]: { ...erp.prices[c], [segment]: value } } });

  return (
    <div className="space-y-1.5">
      {/* At the table's top right; its line is kept while hidden, so the table never jumps. */}
      <div className="flex h-5 items-center justify-end">
        <button
          type="button"
          onClick={() => onChange({ ...erp, display: noErpDisplay() })}
          className={`text-xs font-semibold text-slate-500 underline-offset-2 transition-colors duration-200 hover:text-slate-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100 ${chosen ? "" : "invisible"}`}
          tabIndex={chosen ? undefined : -1}
          aria-hidden={chosen ? undefined : true}
        >
          Gösterim seçimlerini temizle
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] table-fixed border-collapse text-sm">
          <caption className="sr-only">Müşteri grubu ve para birimine göre ERP fiyatı (KDV hariç) ve katalogda KDV gösterimi</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} w-44 text-left`}>
                ERP fiyatı
                <span className={note}>KDV hariç</span>
              </th>
              {SHEET_COLUMNS.map(({ segment, label }) => (
                <th key={segment} scope="col" className={`${th} text-center`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHEET_CURRENCIES.map((c) => (
              <tr key={c}>
                <th scope="row" className={rowHead}>
                  {CURRENCY_LABEL[c]}
                </th>
                {SHEET_COLUMNS.map(({ segment, label }) => {
                  const value = erp.prices[c][segment];
                  return (
                    <td key={segment} className="border border-slate-300 p-1.5 dark:border-white/15">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={value}
                        onChange={(e) => setPrice(c, segment, e.target.value)}
                        onKeyDown={(e) => stepOnArrowKey(e, (v) => setPrice(c, segment, v))}
                        onBlur={() => setPrice(c, segment, tidyPriceInput(value))}
                        aria-invalid={erpPriceInvalid(value) || undefined}
                        aria-label={`${label} ${CURRENCY_LABEL[c]} ERP fiyatı (KDV hariç)`}
                        data-erp-input={`${c}-${segment}`}
                        placeholder="—"
                        className={erpInput}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row" className={rowHead}>
                KDV gösterimi
                <span className={note}>Yalnızca PDF katalog</span>
              </th>
              {SHEET_COLUMNS.map(({ segment, label }) => (
                <td key={segment} className="border border-slate-300 px-3 py-2 dark:border-white/15">
                  <div role="radiogroup" aria-label={`${label} KDV gösterimi`} className="flex flex-col gap-1.5">
                    {([false, true] as const).map((incl) => (
                      <label
                        key={String(incl)}
                        className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-zinc-200"
                      >
                        <input
                          type="radio"
                          name={`${name}-${segment}`}
                          checked={erp.display[segment] === incl}
                          onChange={() => choose(segment, incl)}
                          className="h-3.5 w-3.5 accent-red-600"
                        />
                        {incl ? "KDV dahil göster" : "KDV hariç göster"}
                      </label>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="pt-1.5 text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
        ERP fiyatlarını grup grup, KDV hariç girin. Fiyat Hesaplama Cetveli’nde siteye uygulanan cetvelin mavi “ERP fiyatı”
        satırı buraya yazılır (perakendenin KDV dahil ERP fiyatı KDV hariçe çevrilir). Fiyat kataloğunda (PDF) bir grubun ERP
        fiyatı o grubun fiyatının yerine geçer: kataloğun para birimindeki, yoksa sırasıyla TL, USD, EUR’dan girilen ilki. ERP
        fiyatı yoksa fiyat tablosundaki KDV hariç fiyat kullanılır; uygulanacak orandan gelen site fiyatı (yeşil satır) ERP
        fiyatının yerine geçmez. KDV yalnızca “KDV dahil göster” seçilen grupta, yukarıdaki KDV oranıyla eklenir; seçim
        yapılmayan grup katalogda KDV hariç, KDV ve toplam olarak birlikte gösterilir. Bu bölüm sitede gösterilmez.
      </p>
    </div>
  );
}
