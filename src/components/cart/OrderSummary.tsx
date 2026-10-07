"use client";

import type { ReactNode } from "react";
import { Bike, Lock, TrendingUp, Truck } from "lucide-react";

import { LoyaltyPointsInput } from "@/components/cart/LoyaltyPointsInput";
import { PaymentMethodPicker } from "@/components/cart/PaymentMethodPicker";
import { ShippingConsent } from "@/components/cart/ShippingConsent";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/format";
import type { Cart, PaymentMethod } from "@/types";

interface OrderSummaryProps {
  isLoggedIn: boolean;
  /** Local subtotal from cart snapshots; used until the server quote arrives. */
  estimatedSubtotal: number;
  quote: Cart | null;
  quoteLoading: boolean;
  quoteError: string | null;
  balance: number;
  points: number;
  onPointsChange: (points: number) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onCheckout: () => void;
  /** "Karşı ödemeli" consent; required before checkout when the receiver pays. */
  shippingConsent: boolean;
  onShippingConsentChange: (checked: boolean) => void;
  submitting: boolean;
  checkoutError: string | null;
  /** Why the order can't be placed yet (e.g. incomplete address); null = ready. */
  blocker: string | null;
}

function Row({ label, value, tone }: { label: ReactNode; value: string; tone?: "discount" }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-600 dark:text-zinc-400">{label}</dt>
      <dd className={`tabular-nums ${tone === "discount" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-zinc-100"}`}>
        {value}
      </dd>
    </div>
  );
}

const pct = (rate: string) => `%${Math.round(Number(rate) * 100)}`;
const kg = (value: string) => Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/**
 * Explains the shipping line: when the shop pays the carrier, and when the buyer
 * pays it on delivery ("karşı ödemeli") instead — the cart is never charged
 * carriage. The coal note only appears for coal-dominant carts (> 50% coal)
 * under 20 kg.
 */
function ShippingNote({ quote }: { quote: Cart }) {
  const s = quote.shipping;
  if (s.reason === "courier") {
    return (
      <div className="flex gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
        <Bike className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <p>Kurye ücreti mesafeye göre kurye tarafından teslimatta alınır.</p>
      </div>
    );
  }
  const remaining = Number(s.free_threshold) - Number(quote.subtotal);
  const message =
    s.reason === "free"
      ? null
      : s.reason === "below_threshold"
        ? `Gönderim ücreti sipariş tutarınıza eklenmez; teslimatta kargo görevlisine ödenir. ${formatMoney(remaining)} daha ekleyin, kargonuz ücretsiz olsun.`
        : `Kömür ağırlıklı siparişlerde ücretsiz kargo için en az ${kg(s.coal_min_kg)} kg kömür gereklidir. Sepetinizde ${kg(s.coal_weight_kg)} kg var; gönderim ücreti teslimatta alıcı tarafından ödenir.`;
  if (!message) return null;

  const coal = s.reason === "coal_weight";
  return (
    <div
      className={`flex gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${
        coal
          ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30"
          : "bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-zinc-300"
      }`}
    >
      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <p>
        {message}
        {coal && s.coal_weight_unknown && (
          <span className="block opacity-80">Bazı kömürlerin ağırlığı tanımlı değil; bunlar 0 kg sayılır.</span>
        )}
      </p>
    </div>
  );
}

/** "₺X more for the next volume tier", only when it's within reach. */
function VolumeNudge({ quote }: { quote: Cart }) {
  const next = quote.volume_next_tier;
  if (!next) return null;
  const remaining = Number(next.threshold) - Number(quote.subtotal);
  if (remaining > Number(next.threshold) / 3) return null; // too far to be a useful nudge
  return (
    <p className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {formatMoney(remaining)} daha ekleyin, {pct(next.rate)} ciro indirimi otomatik uygulansın.
    </p>
  );
}

export function OrderSummary(props: OrderSummaryProps) {
  const { isLoggedIn, quote, quoteLoading, quoteError, submitting, checkoutError } = props;
  const needsConsent = !!quote?.shipping.receiver_pays;
  const canCheckout = !isLoggedIn || (!!quote && !quoteLoading && !quoteError && !props.blocker);

  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
    >
      <h2 id="summary-heading" className="text-lg font-bold tracking-tight">
        Sipariş Özeti
      </h2>

      {isLoggedIn && (
        <div className="mt-5 space-y-5">
          <PaymentMethodPicker value={props.paymentMethod} onChange={props.onPaymentMethodChange} />
          <LoyaltyPointsInput balance={props.balance} value={props.points} onChange={props.onPointsChange} />
        </div>
      )}

      <dl
        className={`mt-5 space-y-2.5 border-t border-slate-200 dark:border-white/10 pt-5 transition-opacity ${quoteLoading ? "opacity-50" : ""}`}
        aria-busy={quoteLoading}
      >
        {quote ? (
          <>
            <Row label="Ara toplam" value={formatMoney(quote.subtotal)} />
            {Number(quote.volume_discount_amount) > 0 && (
              <Row
                label={`Kazanılan ciro indirimi (−${pct(quote.volume_discount_rate)})`}
                value={`−${formatMoney(quote.volume_discount_amount)}`}
                tone="discount"
              />
            )}
            {Number(quote.discount_amount) > 0 && (
              <Row
                label={
                  <>
                    Havale/EFT indirimi (−{pct(quote.discount_rate)})
                    {Number(quote.volume_discount_amount) > 0 && (
                      <span className="block text-xs opacity-75">ciro indiriminden sonraki tutara</span>
                    )}
                  </>
                }
                value={`−${formatMoney(quote.discount_amount)}`}
                tone="discount"
              />
            )}
            {/* Never a charge: either the shop covers it or the buyer pays on delivery. */}
            <Row
              label={quote.shipping.reason === "courier" ? "İstanbul içi kurye" : "Kargo"}
              value={quote.shipping.free ? "Ücretsiz" : "Teslimatta alıcı öder"}
            />
            {Number(quote.points_discount) > 0 && (
              <Row label="ParaPuan" value={`−${formatMoney(quote.points_discount)}`} tone="discount" />
            )}
            <div className="flex justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-3 text-base font-bold">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{formatMoney(quote.net_total)}</dd>
            </div>
            <div className="space-y-2 pt-1">
              <ShippingNote quote={quote} />
              <VolumeNudge quote={quote} />
            </div>
            {quote.loyalty_points_to_earn > 0 && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Siparişiniz onaylandığında {quote.loyalty_points_to_earn.toLocaleString("tr-TR")} ParaPuan
                kazanacaksınız.
              </p>
            )}
          </>
        ) : (
          <>
            <Row label="Ara toplam (tahmini)" value={formatMoney(props.estimatedSubtotal)} />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isLoggedIn
                ? "Kargo ve indirimler hesaplanıyor…"
                : "Ciro ve havale indirimleri ile size özel fiyatlar giriş yaptıktan sonra hesaplanır. ₺3.000 üzeri kargo ücretsiz (kömürde koşullu); altında gönderim ücreti teslimatta alıcı tarafından ödenir."}
            </p>
          </>
        )}
      </dl>

      <div className="mt-5 space-y-3">
        {quoteError && <Alert variant="error">{quoteError}</Alert>}
        {props.blocker && isLoggedIn && <p className="text-center text-xs text-slate-500 dark:text-zinc-400">{props.blocker}</p>}
        {checkoutError && <Alert variant="error">{checkoutError}</Alert>}

        {isLoggedIn && needsConsent && (
          <ShippingConsent checked={props.shippingConsent} onChange={props.onShippingConsentChange} />
        )}

        <Button type="button" onClick={props.onCheckout} loading={submitting} disabled={!canCheckout}>
          {isLoggedIn ? (
            submitting ? (
              "Sipariş oluşturuluyor…"
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden /> Siparişi Tamamla
              </>
            )
          ) : (
            "Siparişi tamamlamak için giriş yapın"
          )}
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
          Fiyatlara KDV dahildir. Nihai tutar sipariş anında sunucuda hesaplanır.
        </p>
      </div>
    </section>
  );
}
