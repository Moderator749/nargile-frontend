"use client";

import { useState } from "react";
import { Link2, Loader2, Search, ShieldCheck } from "lucide-react";

import { CatalogSearch } from "@/components/admin/price-import/CatalogSearch";
import { ProductThumb } from "@/components/admin/price-import/ProductThumb";
import { BASIS, GROUPS, samePrice, where } from "@/components/admin/price-import/shared";
import { formatMoney } from "@/lib/format";
import type { PriceImportCandidate, PriceImportRow, PriceImportSuggested } from "@/types";

/** The row as the workbook has it: name, place, and its four prices. */
export function RowSummary({ row }: { row: PriceImportRow }) {
  return (
    <div className="lg:w-64 lg:shrink-0">
      <p className="font-mono text-xs font-semibold">{row.name || "(adsız)"}</p>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
        {where(row)}
        {row.section ? ` · ${row.section}` : ""}
      </p>
      <p className="mt-1 text-[11px] tabular-nums text-slate-600 dark:text-zinc-300">
        {GROUPS.map((g) => `${g.label} ${row.prices[g.key] ? formatMoney(row.prices[g.key]!) : "—"}`).join(" · ")}
      </p>
    </div>
  );
}

/**
 * One row the server could only guess at: its prices, and the products it may
 * mean as cards — photo, how each was found and how close, its price today. The
 * one safe to accept in bulk is marked; when none is right, the catalog can be
 * searched for the product by hand. Either way one click ties the name to it.
 */
export function SuggestionRow({
  row,
  saving,
  disabled,
  onBind,
}: {
  row: PriceImportSuggested;
  saving: boolean;
  disabled: boolean;
  onBind: (productId: string, code: string) => void;
}) {
  const [searching, setSearching] = useState(false);
  return (
    <li className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-start lg:gap-6">
      <RowSummary row={row} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          {row.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.product_id}
              candidate={candidate}
              recommended={candidate.product_id === row.recommended_id}
              samePrice={samePrice(row, candidate)}
              saving={saving}
              disabled={disabled}
              onPick={() => onBind(candidate.product_id, candidate.code)}
            />
          ))}
        </div>
        <div className="mt-2">
          {searching ? (
            <CatalogSearch
              label={`“${row.name}” için ürün ara`}
              disabled={disabled}
              onPick={(product) => {
                setSearching(false);
                onBind(product.id, product.base_code);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setSearching(true)}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:text-sky-700 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <Search className="h-3.5 w-3.5" aria-hidden /> Hiçbiri değil, başka ürün ara
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function CandidateCard({
  candidate,
  recommended,
  samePrice,
  saving,
  disabled,
  onPick,
}: {
  candidate: PriceImportCandidate;
  recommended: boolean;
  samePrice: boolean;
  saving: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={`flex w-full flex-col rounded-xl border bg-white p-2.5 text-left transition-colors hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-72 dark:bg-zinc-900 dark:hover:bg-sky-500/10 ${
        recommended
          ? "border-emerald-400 ring-1 ring-emerald-400/40 dark:border-emerald-500/60"
          : samePrice
            ? "border-emerald-300 dark:border-emerald-500/40"
            : "border-slate-200 dark:border-white/10"
      }`}
    >
      <span className="flex items-start gap-2.5">
        <ProductThumb src={candidate.image_url} />
        <span className="min-w-0 flex-1">
          {/* The whole code, wrapped if it must: it is what tells LH014 BY from LH014 GBY. */}
          <span className="block break-words font-mono text-xs font-semibold">{candidate.code}</span>
          <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {BASIS[candidate.basis]} · %{Math.round(candidate.score * 100)}
          </span>
          <span className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-zinc-300">{candidate.name}</span>
        </span>
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="tabular-nums text-slate-500 dark:text-zinc-400">
          {candidate.retail ? `Perakende şu an ${formatMoney(candidate.retail.price_incl_tax, candidate.retail.currency)}` : "Fiyatı yok"}
        </span>
        {samePrice && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">fiyatı aynı</span>
        )}
        {recommended && (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-semibold text-white">
            <ShieldCheck className="h-3 w-3" aria-hidden /> güvenli
          </span>
        )}
      </span>
      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
        {saving ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Link2 className="h-3 w-3" aria-hidden />}
        Bu ürünle eşleştir
      </span>
    </button>
  );
}
