"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { SEGMENT_LABELS } from "@/components/admin/customers/CustomerLabels";
import { Alert } from "@/components/ui/Alert";
import { adminAssignSegment } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminCustomerDetail, SegmentType } from "@/types";

const SEGMENTS: SegmentType[] = ["RETAIL", "CAFE", "WHOLESALE", "DEALER"];

const HINTS: Record<SegmentType, string> = {
  RETAIL: "Herkese açık perakende fiyatları.",
  CAFE: "Kafe ve restoranlara özel fiyatlar.",
  WHOLESALE: "Toptan alım fiyatları.",
  DEALER: "Bayi fiyatları — en düşük kademe.",
};

/**
 * Which price list this customer buys from.
 *
 * Sign-up never grants a tier — every account starts on retail — so this is
 * where a kafe or a bayi gets theirs. It takes effect on the customer's next
 * request: prices are read from the account every time, never baked into their
 * session, so they do not have to log in again to see them.
 */
export function SegmentAssign({
  customer,
  onAssigned,
}: {
  customer: AdminCustomerDetail;
  onAssigned: (updated: AdminCustomerDetail) => void;
}) {
  const [choice, setChoice] = useState<SegmentType>(customer.segment ?? "RETAIL");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const changed = choice !== (customer.segment ?? "RETAIL");

  async function save() {
    if (!changed || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const updated = await adminAssignSegment(customer.id, choice);
      onAssigned(updated);
      setResult({ kind: "success", text: `${SEGMENT_LABELS[choice]} fiyatları tanımlandı.` });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Fiyat grubu değiştirilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="sr-only">Fiyat grubu</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEGMENTS.map((segment) => {
            const selected = choice === segment;
            const live = (customer.segment ?? "RETAIL") === segment;
            return (
              <label
                key={segment}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-[color,background-color,border-color,opacity] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
                  selected
                    ? "border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
                    : "border-slate-200 bg-slate-50 opacity-70 hover:border-slate-400 hover:opacity-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="segment"
                  value={segment}
                  checked={selected}
                  onChange={() => setChoice(segment)}
                  className="sr-only"
                />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
                    {SEGMENT_LABELS[segment]}
                    {live && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        Tanımlı
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-zinc-400">{HINTS[segment]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!changed || saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          Fiyat grubunu kaydet
        </button>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Müşteri yeniden giriş yapmadan, bir sonraki isteğinde yeni fiyatları görür.
        </p>
      </div>

      {result && <Alert variant={result.kind}>{result.text}</Alert>}
    </div>
  );
}
