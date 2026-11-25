"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { SEGMENT_LABELS } from "@/components/admin/customers/CustomerLabels";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { adminDeleteCustomer } from "@/lib/adminApi";
import {
  DELETED_MODE_PARAM,
  DELETED_ORDERS_PARAM,
  DELETED_PARAM,
  confirmationMatches,
} from "@/lib/customerDelete";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminCustomerDetail } from "@/types";

/**
 * "Hesabı Sil", at the foot of a customer's page: two steps before anything
 * happens. First what will be affected (who, the price group, orders,
 * Sultan Puan, addresses); then the admin types "SİL" — or the e-mail or the
 * name — to unlock "Kalıcı Olarak Sil". Then back to the list, which says
 * what was done. A customer with orders keeps them: the account is emptied
 * rather than removed (see the server's delete_customer).
 */
export function CustomerDeleteSection({ customer }: { customer: AdminCustomerDetail }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = customer.profile?.company_title || customer.full_name || customer.email;
  const orders = customer.order_count;
  const unlocked = confirmationMatches(typed, {
    email: customer.email,
    full_name: customer.full_name,
    company_title: customer.profile?.company_title,
  });

  const close = () => {
    if (busy) return;
    setStep(0);
    setTyped("");
    setError(null);
  };

  async function remove() {
    if (!unlocked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const done = await adminDeleteCustomer(customer.id);
      const params = new URLSearchParams({
        [DELETED_PARAM]: name,
        [DELETED_MODE_PARAM]: done.mode,
        [DELETED_ORDERS_PARAM]: String(done.orders_kept),
      });
      router.push(`/admin/customers?${params.toString()}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Müşteri silinemedi."));
      setBusy(false);
    }
  }

  const fact = (label: string, value: string) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-zinc-100">{value}</dd>
    </div>
  );

  return (
    <section aria-labelledby="delete-heading" className={`${panelClass} mt-6 border-red-200 p-5 sm:p-6 dark:border-red-500/30`}>
      <h2 id="delete-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-300">
        Hesabı Sil
      </h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600 dark:text-zinc-400">
          Müşteri hesabını kalıcı olarak siler. Siparişi olan bir müşterinin siparişleri muhasebe ve raporlar için
          saklanır; hesabın kişisel bilgileri silinir ve girişi kapatılır.
        </p>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-300 transition-colors duration-200 hover:bg-red-50 dark:text-red-300 dark:ring-red-500/40 dark:hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Müşteriyi Sil
        </button>
      </div>

      <Dialog open={step > 0} onClose={close} title={step === 1 ? "Müşteriyi Sil · 1/2" : "Müşteriyi Sil · 2/2"}>
        {step === 1 ? (
          <div className="space-y-4">
            <p className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Bu işlem geri alınamaz. Silinecek hesap:
            </p>
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 dark:divide-white/5 dark:border-white/10">
              {fact("Müşteri", name)}
              {fact("E-posta", customer.email)}
              {fact("Fiyat grubu", customer.segment ? SEGMENT_LABELS[customer.segment] : "Perakende")}
              {fact("Sipariş", orders.toLocaleString("tr-TR"))}
              {fact("Sultan Puan bakiyesi", `${customer.loyalty_balance.toLocaleString("tr-TR")} puan`)}
              {fact("Kayıtlı adres", customer.addresses.length.toLocaleString("tr-TR"))}
            </dl>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              {orders > 0
                ? `Bu müşterinin ${orders} siparişi var. Siparişler muhasebe ve raporlar için silinmez; hesabın adı, e-postası, telefonu, adresleri, firma bilgileri ve erişim kısıtlamaları silinir, girişi kapatılır. Sultan Puan bakiyesi kullanılamaz hale gelir.`
                : "Siparişi yok: hesap, firma bilgileri, adresleri, erişim kısıtlamaları ve Sultan Puan geçmişiyle birlikte tamamen silinir."}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={close} className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Devam Et
              </button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void remove();
            }}
          >
            <p className="text-sm text-slate-700 dark:text-zinc-300">
              Onaylamak için <strong className="font-mono">SİL</strong> yazın (ya da müşterinin e-postasını veya adını).
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              aria-label="Onay metni"
              placeholder="SİL"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-zinc-900"
            />
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={!unlocked || busy}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
                Kalıcı Olarak Sil
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </section>
  );
}
