"use client";

import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";

import { BankAccountList } from "@/components/payment/BankAccounts";
import { formatMoney } from "@/lib/format";
import { fetchBankAccounts } from "@/lib/ordersApi";
import { formatRate } from "@/lib/storeParameters";
import type { BankAccount, Cart } from "@/types";

/**
 * Havale / EFT, chosen in the cart: what to send — the quote's own total, the
 * havale rate already taken off — and where, from "Banka Hesapları". The same
 * accounts are shown again on the confirmation page with the order number to
 * write in the description.
 */
export function TransferDetails({ quote }: { quote: Cart | null }) {
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchBankAccounts(controller.signal)
      .then(setAccounts)
      .catch(() => {
        if (!controller.signal.aborted) setAccounts([]);
      });
    return () => controller.abort();
  }, []);

  return (
    <section
      aria-labelledby="transfer-heading"
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <h3 id="transfer-heading" className="flex items-center gap-1.5 text-sm font-semibold">
        <Landmark className="h-4 w-4" aria-hidden /> Havale / EFT bilgileri
      </h3>
      {quote && (
        <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">
          Havale ile ödenecek tutar:{" "}
          <strong className="font-mono text-emerald-700 dark:text-emerald-400">{formatMoney(quote.net_total)}</strong>
          {Number(quote.discount_rate) > 0 && (
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {" "}
              ({quote.items.some((i) => Number(i.havale_discount ?? 0) > 0) ? "işaretli ürünlerde " : ""}
              {formatRate(quote.discount_rate)} havale indirimi dahil)
            </span>
          )}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
        Siparişi tamamladıktan sonra 48 saat içinde gönderin; açıklamaya sipariş numaranızı yazın.
      </p>
      <div className="mt-3">
        {accounts === null ? (
          <div className="h-28 rounded-xl bg-white/70 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
        ) : accounts.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Banka hesap bilgileri sipariş onay sayfasında gösterilecektir.
          </p>
        ) : (
          <BankAccountList accounts={accounts} />
        )}
      </div>
    </section>
  );
}
