"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { adminTranslationDrafts, type TranslationDraftRow } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";

const LANGUAGE = { en: "İngilizce", ar: "Arapça" } as const;

/**
 * "Çeviri Onayları": every product and category whose English or Arabic
 * Claude wrote and nobody has approved. Their /en and /ar pages already show
 * the translation, but stay out of search results until approved — in the
 * product sheet's "Çeviriler" (or the category editor), with "Onayla".
 */
export function AdminTranslationDraftsView() {
  const [rows, setRows] = useState<TranslationDraftRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminTranslationDrafts(controller.signal)
      .then(setRows)
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Liste yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <AdminPageHeader
        title="Çeviri Onayları"
        description="Claude’un yazdığı İngilizce ve Arapça çeviriler. Sayfalarda görünürler ama siz onaylayana kadar arama motorlarına kapalıdırlar: açın, okuyun, gerekirse düzeltin ve “Onayla”ya basıp kaydedin."
      />
      {error && <Alert variant="error">{error}</Alert>}
      {!rows ? (
        !error && <div className="h-48 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
      ) : rows.length === 0 ? (
        <div className={`${panelClass} flex items-center gap-3 p-6 text-sm text-slate-600 dark:text-zinc-300`}>
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden /> Onay bekleyen çeviri yok.
        </div>
      ) : (
        <ul className={`${panelClass} divide-y divide-slate-200 dark:divide-white/10`}>
          {rows.map((row) => (
            <li key={`${row.kind}:${row.id}`}>
              <Link
                href={row.kind === "product" ? `/admin/products/${row.id}` : "/admin/homepage?tab=katalog-kategorileri"}
                className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-zinc-100">{row.name}</span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-zinc-400">
                  {row.kind === "product" ? "Ürün" : "Kategori"} · {row.languages.map((l) => LANGUAGE[l]).join(", ")}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
