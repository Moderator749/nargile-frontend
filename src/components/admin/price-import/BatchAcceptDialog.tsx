"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";

import { ProductThumb } from "@/components/admin/price-import/ProductThumb";
import { BASIS, rowKey, samePrice, where } from "@/components/admin/price-import/shared";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { formatMoney } from "@/lib/format";
import type { PriceImportCandidate, PriceImportSuggested } from "@/types";

export interface SafePick {
  row: PriceImportSuggested;
  candidate: PriceImportCandidate;
}

/** Every suggestion with a candidate safe to accept, paired with it. */
export function safePicks(suggested: PriceImportSuggested[]): SafePick[] {
  return suggested.flatMap((row) => {
    const candidate = row.candidates.find((c) => c.product_id === row.recommended_id);
    return candidate ? [{ row, candidate }] : [];
  });
}

/**
 * "Güvenli önerileri eşleştir": the pairs about to be saved, photo beside
 * photo, for one look before one click — then all of them at once, or none.
 */
export function BatchAcceptDialog({
  open,
  picks,
  saving,
  onClose,
  onConfirm,
}: {
  open: boolean;
  picks: SafePick[];
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Güvenli önerileri eşleştir (${picks.length})`}>
      <p className="text-sm text-slate-600 dark:text-zinc-300">
        Her satırda tek bir aday var ve ya kısaltması birebir tutuyor ya da kodu %80+ benzer ve bugünkü perakende fiyatı Excel&apos;dekiyle
        aynı. Onaylarsanız hepsi kaydedilir ve sonraki yüklemelerde sorulmaz; fiyatlar ancak &ldquo;Onayla ve Güncelle&rdquo; ile değişir.
      </p>
      <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10">
        {picks.map(({ row, candidate }) => (
          <li key={rowKey(row)} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="min-w-0 sm:w-40 sm:shrink-0">
              <span className="block font-mono text-xs font-semibold">{row.name}</span>
              <span className="block text-[11px] text-slate-500 dark:text-zinc-400">{where(row)}</span>
            </span>
            <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <ProductThumb src={candidate.image_url} size={40} />
              <span className="min-w-0">
                <span className="block font-mono text-xs font-semibold">{candidate.code}</span>
                <span className="block truncate text-xs text-slate-600 dark:text-zinc-300">{candidate.name}</span>
                <span className="block text-[11px] text-slate-500 dark:text-zinc-400">
                  {BASIS[candidate.basis]} · %{Math.round(candidate.score * 100)}
                  {samePrice(row, candidate) && candidate.retail ? ` · fiyatı aynı (${formatMoney(candidate.retail.price_incl_tax)})` : ""}
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="sm:w-auto sm:px-5">
          Vazgeç
        </Button>
        <Button type="button" onClick={onConfirm} loading={saving} className="sm:w-auto sm:px-5">
          <ShieldCheck className="h-4 w-4" aria-hidden /> {picks.length} eşleştirmeyi kaydet
        </Button>
      </div>
    </Dialog>
  );
}
