"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { LoyaltyPointsInput } from "@/components/cart/LoyaltyPointsInput";
import { PaymentMethodPicker } from "@/components/cart/PaymentMethodPicker";
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
  submitting: boolean;
  checkoutError: string | null;
}

function Row({ label, value, tone }: { label: ReactNode; value: string; tone?: "discount" }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-600">{label}</dt>
      <dd className={`tabular-nums ${tone === "discount" ? "text-emerald-600" : "text-slate-900"}`}>
        {value}
      </dd>
    </div>
  );
}

export function OrderSummary(props: OrderSummaryProps) {
  const { isLoggedIn, quote, quoteLoading, quoteError, submitting, checkoutError } = props;
  const canCheckout = !isLoggedIn || (!!quote && !quoteLoading && !quoteError);

  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
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
        className={`mt-5 space-y-2.5 border-t border-slate-200 pt-5 transition-opacity ${quoteLoading ? "opacity-50" : ""}`}
        aria-busy={quoteLoading}
      >
        {quote ? (
          <>
            <Row label="Ara toplam" value={formatMoney(quote.subtotal)} />
            <Row
              label="Kargo"
              value={Number(quote.cargo_cost) === 0 ? "Ücretsiz" : formatMoney(quote.cargo_cost)}
            />
            {Number(quote.discount_amount) > 0 && (
              <Row
                label={`Havale indirimi (%${Math.round(Number(quote.discount_rate) * 100)})`}
                value={`−${formatMoney(quote.discount_amount)}`}
                tone="discount"
              />
            )}
            {Number(quote.points_discount) > 0 && (
              <Row label="ParaPuan" value={`−${formatMoney(quote.points_discount)}`} tone="discount" />
            )}
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-bold">
              <dt>Toplam</dt>
              <dd className="tabular-nums">{formatMoney(quote.net_total)}</dd>
            </div>
            {quote.loyalty_points_to_earn > 0 && (
              <p className="text-xs text-amber-700">
                Siparişiniz onaylandığında {quote.loyalty_points_to_earn.toLocaleString("tr-TR")} ParaPuan
                kazanacaksınız.
              </p>
            )}
          </>
        ) : (
          <>
            <Row label="Ara toplam (tahmini)" value={formatMoney(props.estimatedSubtotal)} />
            <p className="text-xs text-slate-500">
              {isLoggedIn
                ? "Kargo ve indirimler hesaplanıyor…"
                : "Kargo, indirimler ve size özel fiyatlar giriş yaptıktan sonra hesaplanır. ₺3.000 üzeri kargo ücretsiz."}
            </p>
          </>
        )}
      </dl>

      <div className="mt-5 space-y-3">
        {quoteError && <Alert variant="error">{quoteError}</Alert>}
        {checkoutError && <Alert variant="error">{checkoutError}</Alert>}

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
        <p className="text-center text-xs text-slate-500">
          Fiyatlara KDV dahildir. Nihai tutar sipariş anında sunucuda hesaplanır.
        </p>
      </div>
    </section>
  );
}
