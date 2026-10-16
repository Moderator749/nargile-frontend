import { Coins, Crown } from "lucide-react";

import { formatDate, formatDateParts, formatMoney, formatMoneyCompact } from "@/lib/format";
import type { LoyaltyMilestone, PointSource, Wallet } from "@/types";

const SOURCE: Record<PointSource, string> = {
  PARAPUAN: "Sultan Puan",
  KUMBARA: "Yıllık Sultan Puan bonusu",
  CHECKOUT: "Sepette kullanıldı",
  ADMIN: "Düzeltme",
};

const fmtPoints = (n: number) => n.toLocaleString("tr-TR");

/** Ledger notes written before the rename say "ParaPuan" / "Kumbarapuanı"; the
    record stays as it was, the customer reads today's name. */
const rebrand = (note: string) =>
  note.replace(/Kumbarapuanı?/g, "Yıllık Sultan Puan bonusu").replace(/ParaPuan/g, "Sultan Puan");

/**
 * "Sultan Kumbara": the annual bonus, told as an appreciation rather than a
 * rule — "Sadakatiniz Kazandırıyor" — with the figures under it: "Son 365 günde
 * ₺14.200 harcadınız, ₺20.000 hedefine ₺5.800 kaldı!"
 */
function MilestoneCard({ m }: { m: LoyaltyMilestone }) {
  const target = Number(m.target);
  const spent = Number(m.spent);
  const progress = Math.min(1, target > 0 ? spent / target : 0);
  const since = m.restarted
    ? `${formatDateParts(m.counting_since).date} tarihli bonusunuzdan bu yana`
    : `Son ${m.period_days} günde`;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
        <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden /> Sultan Kumbara
      </p>
      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-slate-900 dark:text-zinc-50">
        Sadakatiniz Kazandırıyor
      </h3>
      <p className="mt-1.5 inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25">
        Sultan Ailesine Özel Yıllık Birikim
      </p>
      <p className="mt-5 font-mono text-2xl font-medium tracking-tight tabular-nums">
        {formatMoneyCompact(spent)} <span className="text-base text-slate-400">/ {formatMoneyCompact(target)}</span>
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
        role="progressbar"
        aria-label="Yıllık sadakat hedefine ilerleme"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={spent}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-zinc-300">
        {since} {formatMoneyCompact(spent)} harcadınız, {formatMoneyCompact(target)} hedefine{" "}
        <strong className="font-semibold">{formatMoneyCompact(m.remaining)}</strong> kaldı!
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
        Hedefe ulaştığınızda {fmtPoints(m.bonus_points)} Sultan Puan bonus kazanırsınız.{" "}
        {Number(m.order_ceiling) > 0
          ? `${formatMoneyCompact(m.order_ceiling)} altındaki ödenmiş siparişleriniz sayılır.`
          : "Ödenmiş tüm siparişleriniz sayılır."}
      </p>
    </div>
  );
}

/** Balance, annual-bonus progress, live lots and history. Shared by the account page and admin. */
export function WalletPanel({ wallet }: { wallet: Wallet }) {
  const showMilestone = wallet.enabled && wallet.milestone.bonus_points > 0;
  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${showMilestone ? "sm:grid-cols-2" : ""}`}>
        <div className="flex flex-col rounded-2xl bg-[#1d1d1f] p-6 text-white">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
            <Coins className="h-4 w-4" aria-hidden /> Kullanılabilir Sultan Puan
          </p>
          <p className="mt-3 font-mono text-4xl font-medium tracking-tighter tabular-nums">{fmtPoints(wallet.balance)}</p>
          <p className="mt-1 text-sm text-zinc-400">
            = {formatMoney(wallet.balance * Number(wallet.conversion_rate))} indirim · 1 puan ={" "}
            {formatMoney(wallet.conversion_rate)}
          </p>
          {!wallet.enabled && (
            <p className="mt-3 text-xs text-amber-300">
              Sultan Puan programı şu anda kapalı; bakiyeniz korunuyor.
            </p>
          )}
          {wallet.enabled && wallet.expiring_soon > 0 && (
            <p className="mt-3 text-xs text-amber-300">{fmtPoints(wallet.expiring_soon)} puan 30 gün içinde sona eriyor.</p>
          )}
          {/* Anchored to the bottom, so the card ends on the same line as the
              Sultan Kumbara card beside it. */}
          {wallet.enabled && (
            <p className="mt-auto pt-6 text-xs leading-5 text-zinc-500">
              Puanlarınız kazanıldıkları tarihten itibaren 1 yıl geçerlidir ve sepette kargo hariç tutara
              uygulanır.
            </p>
          )}
        </div>
        {showMilestone && <MilestoneCard m={wallet.milestone} />}
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
                    {e.note && ` · ${rebrand(e.note)}`}
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
