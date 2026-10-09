"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleCheck, Copy, Landmark, UserCheck } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { countryName } from "@/lib/countries";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { fetchBankAccounts, fetchOrder, orderNetTotal } from "@/lib/ordersApi";
import { formatIban } from "@/lib/provinces";
import { shippingOption } from "@/lib/shipping";
import { useAuthHydrated } from "@/store/useHasHydrated";
import { useAuthStore } from "@/store/useAuthStore";
import type { BankAccount, Order } from "@/types";

/** Must match the backend's SLA (order_tasks.SLA_HOURS). */
const TRANSFER_DEADLINE_HOURS = 48;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      aria-label={`${label} kopyala`}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

/** After checkout: what was ordered and — for havale/EFT — where to pay. */
export function OrderConfirmation({ orderId }: { orderId: string }) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const [order, setOrder] = useState<Order | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    const controller = new AbortController();
    fetchOrder(orderId, controller.signal)
      .then(async (o) => {
        setOrder(o);
        if (o.payment_method === "BANK_TRANSFER") setAccounts(await fetchBankAccounts(controller.signal));
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Sipariş bulunamadı."));
      });
    return () => controller.abort();
  }, [hydrated, token, orderId]);

  if (hydrated && !token) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Alert variant="error">Siparişi görmek için giriş yapın.</Alert>
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Alert variant="error">{error}</Alert>
      </main>
    );
  }
  if (!order) return <main className="flex-1" aria-busy />;

  const net = orderNetTotal(order);
  const transfer = order.payment_method === "BANK_TRANSFER";
  const ownVan = order.shipping_method === "ISTANBUL_FREE";
  const { Icon } = shippingOption(order.shipping_method);
  const a = order.shipping_address;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <div className="text-center">
        <CircleCheck className="mx-auto h-12 w-12 text-emerald-600" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Siparişiniz alındı</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          Sipariş no: <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{order.order_number}</span>
        </p>
      </div>

      {transfer && order.status === "AWAITING_TRANSFER" && (
        <section aria-labelledby="pay-heading" className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-500/30 dark:bg-amber-500/5 sm:p-6">
          <h2 id="pay-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Landmark className="h-5 w-5" aria-hidden /> Havale / EFT ile ödeme
          </h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">
            <strong className="font-mono">{formatMoney(net)}</strong> tutarını aşağıdaki hesaplardan birine{" "}
            {TRANSFER_DEADLINE_HOURS} saat içinde gönderin. Açıklamaya sipariş numaranızı yazın; ödemeniz onaylanınca
            siparişiniz hazırlanır. Süre içinde ödenmeyen siparişler otomatik iptal edilir.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 dark:bg-zinc-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Açıklama</p>
              <p className="font-mono text-sm font-semibold">{order.order_number}</p>
            </div>
            <CopyButton text={order.order_number} label="Sipariş numarasını" />
          </div>

          {accounts === null ? (
            <div className="mt-3 h-24 rounded-xl bg-white/60 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
          ) : accounts.length === 0 ? (
            <div className="mt-3">
              <Alert variant="error">Banka hesap bilgileri henüz tanımlanmadı. Ödeme için lütfen bizimle iletişime geçin.</Alert>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {accounts.map((acc) => (
                <li key={acc.id} className="rounded-xl bg-white p-4 dark:bg-zinc-900">
                  <p className="text-sm font-semibold">
                    {acc.bank_name}
                    {acc.branch && <span className="font-normal text-slate-500 dark:text-zinc-400"> · {acc.branch}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Alıcı: {acc.account_holder}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="break-all font-mono text-sm tracking-wide">{formatIban(acc.iban)}</p>
                    <CopyButton text={acc.iban} label="IBAN" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="delivery-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
        <h2 id="delivery-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          {/* The method's own name, so the page says what will actually happen. */}
          <Icon className="h-5 w-5" aria-hidden />
          {shippingOption(order.shipping_method).title}
        </h2>
        {ownVan ? (
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
            İstanbul içi teslimat ücretsizdir; siparişiniz kendi aracımızla, teslimattan önce aranarak
            getirilir.
          </p>
        ) : order.shipping_payer === "RECEIVER" ? (
          // Carriage is never added to the order; the buyer accepted paying it on delivery.
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Karşı ödemeli gönderim: gönderim ücreti sipariş toplamınıza eklenmemiştir, teslimat sırasında kargo
            görevlisine ödenecektir.
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
            Gönderim ücreti tarafımızca karşılanmıştır; teslimatta ödeme yapmanız gerekmez.
          </p>
        )}
        {/* "Şubeme istiyorum": the branch the goods were sent to, named so the
            firm can see which one this order was for. */}
        {order.shipping_branch_name && (
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            {order.shipping_branch_name}
          </p>
        )}
        {a && (
          <address className="mt-1 text-sm not-italic leading-6 text-slate-700 dark:text-zinc-300">
            {a.full_name} · {a.phone}
            <br />
            {a.line}
            <br />
            {[a.district, a.city].filter(Boolean).join(" / ")}
            {a.country !== "TR" && <> · {countryName(a.country)}</>}
          </address>
        )}
        {order.receiver_name && (
          <p className="mt-3 flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
            <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Teslim alacak kişi: <strong className="font-semibold">{order.receiver_name}</strong> ·{" "}
              {order.receiver_phone}
            </span>
          </p>
        )}
        <dl className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold dark:border-white/10">
          <dt>Toplam</dt>
          <dd className="font-mono">{formatMoney(net)}</dd>
        </dl>
      </section>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/orders" className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-zinc-900">
          Siparişlerim
        </Link>
        <Link href="/catalog" className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/5">
          Alışverişe devam et
        </Link>
      </div>
    </main>
  );
}
