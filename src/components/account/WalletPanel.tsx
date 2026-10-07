import { Coins, PiggyBank } from "lucide-react";

import { formatDate, formatMoney } from "@/lib/format";
import type { PointSource, Wallet } from "@/types";

const SOURCE: Record<PointSource, string> = {
  PARAPUAN: "ParaPuan",
  KUMBARA: "Kumbarapuan",
  CHECKOUT: "Sepette kullanıldı",
  ADMIN: "Düzeltme",
};

const fmtPoints = (n: number) => n.toLocaleString("tr-TR");

/** Balance, Kumbara progress, live lots and history. Shared by the account page and admin. */
export function WalletPanel({ wallet }: { wallet: Wallet }) {
  const target = Number(wallet.kumbara.target);
  const accumulated = Number(wallet.kumbara.accumulated);
  const progress = Math.min(1, target > 0 ? accumulated / target : 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#1d1d1f] p-6 text-white">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
            <Coins className="h-4 w-4" aria-hidden /> Kullanılabilir puan
          </p>
          <p className="mt-3 font-mono text-4xl font-medium tracking-tighter tabular-nums">{fmtPoints(wallet.balance)}</p>
          <p className="mt-1 text-sm text-zinc-400">= {formatMoney(wallet.balance)} indirim · 1 puan = ₺1</p>
          {wallet.expiring_soon > 0 && (
            <p className="mt-3 text-xs text-amber-300">{fmtPoints(wallet.expiring_soon)} puan 30 gün içinde sona eriyor.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
            <PiggyBank className="h-4 w-4" aria-hidden /> Kumbara
          </p>
          <p className="mt-3 font-mono text-2xl font-medium tracking-tight tabular-nums">
            {formatMoney(accumulated)} <span className="text-base text-slate-400">/ {formatMoney(target)}</span>
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
            role="progressbar"
            aria-label="Kumbara birikimi"
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={accumulated}
          >
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
            ₺20.000 altındaki ödenmiş siparişleriniz birikir; toplam {formatMoney(target)} olunca %
            {Math.round(Number(wallet.kumbara.rate) * 100)} Kumbarapuan kazanırsınız.
          </p>
        </div>
      </div>

      {wallet.lots.length > 0 && (
        <section aria-labelledby="lots-heading">
          <h3 id="lots-heading" className="text-sm font-semibold">
            Geçerlilik
          </h3>
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm dark:divide-white/5 dark:border-white/10">
            {wallet.lots.map((lot, i) => (
              <li key={i} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span>
                  {lot.source ? SOURCE[lot.source] : "Puan"}{" "}
                  <span className="text-slate-500 dark:text-zinc-400">
                    · {fmtPoints(lot.remaining)}
                    {lot.remaining !== lot.amount && ` / ${fmtPoints(lot.amount)}`} puan
                  </span>
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {lot.expires_at ? `Son gün: ${formatDate(lot.expires_at)}` : "Süresiz"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="history-heading">
        <h3 id="history-heading" className="text-sm font-semibold">
          Puan geçmişi
        </h3>
        {wallet.history.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Henüz puan hareketi yok.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm dark:divide-white/5 dark:border-white/10">
            {wallet.history.map((e) => (
              <li key={e.id} className={`flex items-start justify-between gap-4 px-4 py-2.5 ${e.void ? "opacity-50" : ""}`}>
                <div className="min-w-0">
                  <p className="font-medium">
                    {e.source ? SOURCE[e.source] : e.kind}
                    {e.order_number && <span className="ml-1 font-mono text-xs text-slate-500">{e.order_number}</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {formatDate(e.created_at)}
                    {e.note && ` · ${e.note}`}
                    {e.void && " · sipariş iptal edildi, puanlar iade edildi"}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-mono tabular-nums ${e.void ? "line-through" : ""} ${
                    e.points > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  {e.points > 0 ? "+" : "−"}
                  {fmtPoints(Math.abs(e.points))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
