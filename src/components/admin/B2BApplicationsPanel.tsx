"use client";

import { useEffect, useState } from "react";
import { Building2, CircleCheck, XCircle } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { B2B_SEGMENT_LABELS } from "@/components/auth/B2BApplicationFields";
import { Alert } from "@/components/ui/Alert";
import { adminApproveB2B, adminListB2BApplications, adminRejectB2B } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { B2BApplication, B2BSegment } from "@/types";

/** Pending Kafe / Toptan / Bayi applications: approve (optionally as another segment) or reject. */
export function B2BApplicationsPanel({ onDecided }: { onDecided?: () => void }) {
  const [items, setItems] = useState<B2BApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [grant, setGrant] = useState<Record<number, B2BSegment>>({});

  useEffect(() => {
    const controller = new AbortController();
    adminListB2BApplications(controller.signal)
      .then(setItems)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Başvurular yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  async function decide(a: B2BApplication, action: "approve" | "reject") {
    let note = "";
    if (action === "reject") {
      note = window.prompt(`${a.company_title} başvurusu reddedilsin mi? Gerekçe (müşteri görür):`, "") ?? "";
      if (note.trim().length < 3) return;
    }
    setBusy(a.id);
    setError(null);
    try {
      if (action === "approve") await adminApproveB2B(a.id, grant[a.id] ?? (a.requested_segment as B2BSegment));
      else await adminRejectB2B(a.id, note.trim());
      setItems((list) => list?.filter((x) => x.id !== a.id) ?? list);
      onDecided?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "İşlem tamamlanamadı."));
    } finally {
      setBusy(null);
    }
  }

  if (items !== null && items.length === 0 && !error) return null;

  return (
    <section aria-labelledby="b2b-apps" className={`${panelClass} mb-6 overflow-hidden`}>
      <h2 id="b2b-apps" className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">
        <Building2 className="h-4 w-4 text-amber-600" aria-hidden /> Bekleyen işletme başvuruları
        {items && <span className="rounded-full bg-amber-100 px-2 text-xs text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">{items.length}</span>}
      </h2>
      {error && (
        <div className="p-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {items === null ? (
        <div className="h-24 motion-safe:animate-pulse" aria-busy />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {items.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4" aria-busy={busy === a.id || undefined}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.company_title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  {a.full_name || a.email} · {a.email} · VKN/TCKN {a.tax_number}
                  {a.tax_office ? ` · ${a.tax_office}` : ""} · {formatDate(a.created_at)}
                </p>
              </div>
              <label className="text-xs text-slate-500 dark:text-zinc-400">
                <span className="sr-only">Tanımlanacak segment</span>
                <select
                  value={grant[a.id] ?? a.requested_segment}
                  onChange={(e) => setGrant((g) => ({ ...g, [a.id]: e.target.value as B2BSegment }))}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {(Object.keys(B2B_SEGMENT_LABELS) as B2BSegment[]).map((s) => (
                    <option key={s} value={s}>
                      {B2B_SEGMENT_LABELS[s]}
                      {s === a.requested_segment ? " (talep)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void decide(a, "approve")}
                  disabled={busy === a.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <CircleCheck className="h-4 w-4" aria-hidden /> Onayla
                </button>
                <button
                  type="button"
                  onClick={() => void decide(a, "reject")}
                  disabled={busy === a.id}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/5"
                >
                  <XCircle className="h-4 w-4" aria-hidden /> Reddet
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
