"use client";

import { useId, useState } from "react";

import {
  CURRENCY_LABEL,
  SHEET_COLUMNS,
  SHEET_CURRENCIES,
  erpMatrix,
  erpPriceInvalid,
  noErpDisplay,
  type ErpDraft,
  type SheetDraft,
  type VatRate,
} from "@/components/admin/products/sheetDraft";
import { CATALOG_SEGMENTS, productCatalogPreview, type CatalogCurrency, type CatalogSegment } from "@/lib/erpCatalog";
import { formatMoney, parseDecimalInput, tidyPriceInput } from "@/lib/format";
import { stepOnArrowKey } from "@/lib/numberStep";
import { SEGMENT_LABELS } from "@/lib/pricing";
import type { CurrencyType, SheetSegment } from "@/types";

const th =
  "border border-slate-300 bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-200";
const rowHead =
  "w-44 border border-slate-300 bg-slate-50 px-3 py-2 text-left align-middle text-xs font-bold text-slate-700 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-200";
const cell = "border border-slate-300 px-3 py-2 dark:border-white/15";
const note = "mt-0.5 block text-[10px] font-medium normal-case tracking-normal text-slate-500 dark:text-zinc-400";

/** A number to work with from a box as typed; null when it is empty or not a price. */
const amountOf = (raw: string): number | null => {
  const parsed = parseDecimalInput(raw);
  return parsed === null ? null : Number(parsed);
};

const erpInput =
  "h-9 w-full rounded-md border border-slate-300 bg-sky-50/60 px-2 text-right text-sm font-semibold tabular-nums shadow-sm transition-colors placeholder:font-normal placeholder:text-slate-300 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 aria-invalid:border-red-500 aria-invalid:bg-red-50 dark:border-white/15 dark:bg-sky-500/10 dark:placeholder:text-zinc-600 dark:aria-invalid:bg-red-500/10";

/**
 * "ERP ve Katalog Fiyatları", under "Fiyat Tablosu": the product's ERP price
 * per currency and customer group (KDV hariç) — what applying a pricing
 * worksheet writes from its blue "ERP fiyatı" row — and a grid with a column
 * per group: the base its catalogue price starts from, whether the PDF shows
 * it with or without VAT, and what the PDF will print. For the price catalogue
 * only; the storefront never reads it.
 *
 * The base is the group's ERP price, else its KDV hariç price in the table
 * above — never a VAT-inclusive or marked-up figure. VAT, at the sheet's
 * rate, is added only where "KDV dahil göster" is picked.
 */
export function ErpCatalogPrices({
  erp,
  prices,
  vatRate,
  onChange,
}: {
  erp: ErpDraft;
  prices: SheetDraft["prices"];
  vatRate: VatRate;
  onChange: (erp: ErpDraft) => void;
}) {
  const name = useId();
  // The preview's currency, as the admin picked it; until then the first with
  // an ERP price, else the first the table prices, else TL.
  const [picked, setPicked] = useState<CatalogCurrency | null>(null);
  const typed = (c: CatalogCurrency) => CATALOG_SEGMENTS.some((s) => amountOf(erp.prices[c][s]) !== null);
  const priced = (c: CatalogCurrency) => CATALOG_SEGMENTS.some((s) => amountOf(prices[c][s].excl) !== null);
  const order: CatalogCurrency[] = ["TRY", "USD", "EUR"];
  const currency = picked ?? order.find(typed) ?? order.find(priced) ?? "TRY";

  const catalog = productCatalogPreview({
    erpPrices: erpMatrix(erp.prices),
    display: erp.display,
    currency,
    vatRate,
    priceExcl: Object.fromEntries(CATALOG_SEGMENTS.map((s) => [s, amountOf(prices[currency][s].excl)])) as Record<
      CatalogSegment,
      number | null
    >,
  });
  const chosen = CATALOG_SEGMENTS.some((s) => erp.display[s] !== null);
  const choose = (segment: CatalogSegment, incl: boolean) => onChange({ ...erp, display: { ...erp.display, [segment]: incl } });
  const setPrice = (c: CurrencyType, segment: SheetSegment, value: string) =>
    onChange({ ...erp, prices: { ...erp.prices, [c]: { ...erp.prices[c], [segment]: value } } });
  const money = (amount: number, c: CatalogCurrency) => formatMoney(amount, c);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] table-fixed border-collapse text-sm">
          <caption className="sr-only">Müşteri grubu ve para birimine göre ERP fiyatı (KDV hariç)</caption>
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
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end justify-end gap-3">
        {chosen && (
          <button
            type="button"
            onClick={() => onChange({ ...erp, display: noErpDisplay() })}
            className="h-10 text-xs font-semibold text-slate-500 underline-offset-2 transition-colors duration-200 hover:text-slate-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Gösterim seçimlerini temizle
          </button>
        )}
        <div>
          <span id={`${name}-currency`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
            Önizleme
          </span>
          <div
            role="radiogroup"
            aria-labelledby={`${name}-currency`}
            className="inline-flex h-10 overflow-hidden rounded-lg border border-slate-300 dark:border-white/15"
          >
            {order.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={c === currency}
                onClick={() => setPicked(c)}
                className={`px-3 text-xs font-bold transition-colors duration-200 ${
                  c === currency
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
                }`}
              >
                {CURRENCY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] table-fixed border-collapse text-sm">
          <caption className="sr-only">Müşteri grubuna göre katalog fiyatı ve KDV gösterimi</caption>
          <thead>
            <tr>
              <th scope="col" className={`${th} w-44`}>
                <span className="sr-only">Satır</span>
              </th>
              {CATALOG_SEGMENTS.map((segment) => (
                <th key={segment} scope="col" className={`${th} text-center`}>
                  {SEGMENT_LABELS[segment]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={rowHead}>
                Taban fiyat
                <span className={note}>KDV hariç · grubun ERP fiyatı, yoksa fiyat tablosu</span>
              </th>
              {CATALOG_SEGMENTS.map((segment) => {
                const p = catalog[segment];
                return (
                  <td
                    key={segment}
                    data-erp-base={segment}
                    className={`${cell} text-right tabular-nums ${p?.fromErp ? "bg-sky-50 dark:bg-sky-500/10" : ""}`}
                  >
                    {p === null ? (
                      <span className="text-slate-400 dark:text-zinc-500">—</span>
                    ) : (
                      <>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{money(p.excl, p.currency)}</span>
                        <span className={note}>{p.fromErp ? "ERP" : "Fiyat tablosu"} · KDV hariç</span>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className={rowHead}>
                KDV gösterimi
                <span className={note}>Yalnızca PDF katalog</span>
              </th>
              {CATALOG_SEGMENTS.map((segment) => (
                <td key={segment} className={`${cell} py-1.5`}>
                  <div role="radiogroup" aria-label={`${SEGMENT_LABELS[segment]} KDV gösterimi`} className="flex flex-col gap-1">
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
            <tr>
              <th scope="row" className={rowHead}>
                PDF’te görünecek fiyat
                <span className={note}>Önizleme · KDV %{vatRate}</span>
              </th>
              {CATALOG_SEGMENTS.map((segment) => {
                const p = catalog[segment];
                return (
                  <td
                    key={segment}
                    data-erp-preview={segment}
                    className={`${cell} bg-emerald-50 text-right tabular-nums dark:bg-emerald-500/10`}
                  >
                    {p === null ? (
                      <>
                        <span className="text-slate-400 dark:text-zinc-500">—</span>
                        <span className={note}>Fiyat tablosunda fiyat yok</span>
                      </>
                    ) : p.display === null ? (
                      // Not chosen: the PDF prints the full split.
                      <>
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{money(p.excl, p.currency)}</span>
                        <span className={note}>
                          + {money(p.vat, p.currency)} KDV = {money(p.total, p.currency)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {money(p.display ? p.total : p.excl, p.currency)}
                        </span>
                        <span className={note}>{p.display ? `KDV dahil (%${vatRate})` : "KDV hariç"}</span>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
        ERP fiyatlarını grup grup, KDV hariç girin. Fiyat Hesaplama Cetveli’nde siteye uygulanan cetvelin mavi “ERP fiyatı”
        satırı buraya yazılır (perakendenin KDV dahil ERP fiyatı KDV hariçe çevrilir). Fiyat kataloğunda (PDF) bir grubun ERP
        fiyatı o grubun fiyatının yerine geçer: cetvel satırının para birimindeki, yoksa sırasıyla TL, USD, EUR’dan girilen
        ilki. ERP fiyatı yoksa fiyat tablosundaki KDV hariç fiyat kullanılır; uygulanacak orandan gelen site fiyatı (yeşil
        satır) ERP fiyatının yerine geçmez. KDV yalnızca “KDV dahil göster” seçilen grupta, yukarıdaki KDV oranıyla eklenir;
        seçim yapılmayan grup katalogda KDV hariç, KDV ve toplam olarak birlikte gösterilir. Bu bölüm sitede gösterilmez.
      </p>
    </div>
  );
}
