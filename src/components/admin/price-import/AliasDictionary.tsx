"use client";

import { useState } from "react";
import { BookMarked, Loader2, Search, Trash2 } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { ProductThumb } from "@/components/admin/price-import/ProductThumb";
import { formatDate } from "@/lib/format";
import type { PriceImportAlias } from "@/types";

const fold = (text: string) => text.toLocaleLowerCase("tr-TR").replace(/[\s\-_.]/g, "");

/**
 * "Kayıtlı eşleştirmeler": every workbook name tied to a product, by
 * suggestion or by hand — the dictionary each upload is matched against first.
 * Filterable, and each can be removed (with a second click, as a mistake here
 * prices the wrong product on every later upload).
 */
export function AliasDictionary({
  aliases,
  loading,
  removing,
  onRemove,
}: {
  aliases: PriceImportAlias[];
  loading: boolean;
  removing: number | null;
  onRemove: (alias: PriceImportAlias) => void;
}) {
  const [filter, setFilter] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);
  const term = fold(filter);
  const shown = term
    ? aliases.filter((a) => [a.excel_name, a.product_code, a.product_name].some((t) => fold(t).includes(term)))
    : aliases;

  return (
    <details className={`${panelClass} mt-6`}>
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold">
        <BookMarked className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden />
        Kayıtlı eşleştirmeler ({loading ? "…" : aliases.length})
        <span className="font-normal text-slate-500 dark:text-zinc-400">— her yüklemede önce bunlara bakılır</span>
      </summary>
      <div className="border-t border-slate-200 dark:border-white/10">
        {aliases.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-zinc-400">
            {loading ? "Yükleniyor…" : "Henüz kayıtlı eşleştirme yok. Bir öneriyi onayladığınızda burada görünür."}
          </p>
        ) : (
          <>
            <div className="relative px-4 py-3">
              <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Excel adı, kod veya ürün adıyla süz"
                aria-label="Kayıtlı eşleştirmeleri süz"
                className="block h-9 w-full max-w-sm rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-white/15 dark:bg-zinc-950"
              />
            </div>
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
              {shown.map((alias) => (
                <li key={alias.id} className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="font-mono text-xs font-semibold sm:w-44 sm:shrink-0">{alias.excel_name}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <ProductThumb src={alias.image_url} size={40} />
                    <span className="min-w-0">
                      <span className="block font-mono text-xs font-semibold">{alias.product_code}</span>
                      <span className="block truncate text-xs text-slate-600 dark:text-zinc-300">{alias.product_name}</span>
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 sm:w-24 sm:shrink-0">{formatDate(alias.created_at)}</span>
                  {confirming === alias.id ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(null);
                          onRemove(alias);
                        }}
                        className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-500"
                      >
                        Sil
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
                      >
                        Vazgeç
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(alias.id)}
                      disabled={removing !== null}
                      aria-label={`“${alias.excel_name}” eşleştirmesini sil`}
                      className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:self-auto dark:hover:bg-red-500/10"
                    >
                      {removing === alias.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
                      Sil
                    </button>
                  )}
                </li>
              ))}
              {shown.length === 0 && <li className="px-4 py-4 text-center text-xs text-slate-500">Eşleşen kayıt yok.</li>}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
