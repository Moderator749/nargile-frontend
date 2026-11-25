"use client";

import { useState } from "react";
import { Loader2, Store } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { adminSetStockExclusion } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminCustomerDetail } from "@/types";

/** "Şube / Test": an account out of the stock and the reports, as a chip beside its name. */
export function BranchBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white ${className}`}
      title="Stok ve raporlardan hariç tutulan şube / test hesabı"
    >
      <Store className="h-3 w-3" aria-hidden /> Şube / Test
    </span>
  );
}

/**
 * "Stok ve Raporlardan Hariç Tut (Şube / Test Hesabı)": the shop's own branches
 * (Esenyurt, Bahçelievler…) and internal test accounts. Their orders take no
 * online stock — and may be placed when the site has none — put none back,
 * and stay out of the dashboard, the reports, the bestsellers, the loyalty
 * sums and the order SMS / e-mails; they stay listed under Siparişler with a
 * badge. Orders already placed keep what they were placed as.
 */
export function BranchAccountToggle({
  customer,
  onSaved,
}: {
  customer: AdminCustomerDetail;
  onSaved: (updated: AdminCustomerDetail) => void;
}) {
  const on = !!customer.exclude_from_stock_and_reports;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await adminSetStockExclusion(customer.id, !on));
    } catch (err) {
      setError(getApiErrorMessage(err, "Kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p id="branch-toggle-label" className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Stok ve Raporlardan Hariç Tut (Şube / Test Hesabı)
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Şube satışları ve iç test hesapları için. Açıkken bu hesabın siparişleri online stoktan düşmez (stok 0 olsa
            da sipariş verilebilir), iptal ve iadede stoğa geri eklenmez; panel özetine, raporlara, çok satanlara ve
            SultanPuan / ciro hesaplarına girmez; müşteriye sipariş SMS’i ve e-postası gitmez. Siparişler, Siparişler
            sayfasında “Şube / Test” rozetiyle görünür. Önceden verilmiş siparişler değişmez.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="branch-toggle-label"
          onClick={() => void toggle()}
          disabled={saving}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60 ${
            on ? "bg-violet-600" : "bg-slate-300 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0.5"}`}
          />
          {saving && <Loader2 className="absolute -right-6 h-4 w-4 animate-spin text-slate-400" aria-hidden />}
        </button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
