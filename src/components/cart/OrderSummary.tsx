"use client";

import type { ReactNode } from "react";
import { Building2, Lock, Send, Ship, TrendingUp, Truck } from "lucide-react";

import { LegalConsent, type Agreements } from "@/components/cart/LegalConsent";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { LoyaltyPointsInput } from "@/components/cart/LoyaltyPointsInput";
import { PaymentMethodPicker } from "@/components/cart/PaymentMethodPicker";
import { ShippingConsent } from "@/components/cart/ShippingConsent";
import { TransferDetails } from "@/components/payment/TransferDetails";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { estimateCart } from "@/lib/cartEstimate";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { cartMessages } from "@/lib/i18n/messages/cart";
import { shippingOption } from "@/lib/shipping";
import { formatRate, transferDiscountHint } from "@/lib/storeParameters";
import type { Cart, LegalDocument, LegalKey, PaymentMethod, ShippingMethod, StoreParameters } from "@/types";

interface OrderSummaryProps {
  isLoggedIn: boolean;
  /**
   * Whether this account gets the retail promotions. False hides the points
   * box and the discount nudges rather than offering what will not be given;
   * the server decides the amounts either way.
   */
  perks: boolean;
  /** An export account: no gateway, no points, and a request rather than an
      order. The server enforces all three (`is_quote_account`). */
  quoteOnly?: boolean;
  /** The chosen method, for the shipping line's label. */
  shippingMethod: ShippingMethod;
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
  /** "Kart bilgilerimi … güvenle kaydet", for the card payment section. */
  saveCard: boolean;
  onSaveCardChange: (checked: boolean) => void;
  /** The two agreements, and the texts behind them. */
  agreements: Agreements;
  onAgreementsChange: (patch: Partial<Agreements>) => void;
  legalDocuments: Partial<Record<LegalKey, LegalDocument>> | null;
  submitting: boolean;
  checkoutError: string | null;
  /** Why the order can't be placed yet (e.g. incomplete address); null = ready. */
  blocker: string | null;
  /** The live store parameters: the havale hint, the guest note, Sultan Puan. */
  params: StoreParameters;
  /** Whether card payment (PayTR) is open. */
  cardAvailable: boolean;
}

function Row({ label, value, tone }: { label: ReactNode; value: string; tone?: "discount" }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-600 dark:text-zinc-400">{label}</dt>
      {/* Left to right on an Arabic page too, so "−12,00 TL" keeps its minus in front. */}
      <dd dir="ltr" className={`tabular-nums ${tone === "discount" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-zinc-100"}`}>
        {value}
      </dd>
    </div>
  );
}

const kg = (value: string, locale: Locale) =>
  Number(value).toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 1 });

/**
 * Explains the shipping line: when the shop pays the carrier, and when the buyer
 * pays it on delivery ("karşı ödemeli") instead — the cart is never charged
 * carriage. The coal note only appears for coal-dominant carts under the coal
 * minimum. Every figure comes from the quote, i.e. from the live parameters.
 */
function ShippingNote({ quote }: { quote: Cart }) {
  const t = useMessages(cartMessages).summary;
  const locale = useLocale();
  const s = quote.shipping;
  if (s.reason === "freight" || s.reason === "international") {
    const note = s.reason === "freight" ? t.freightNote : t.internationalNote;
    const Icon = s.reason === "freight" ? Building2 : Ship;
    return (
      <div className="flex gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <p>{note}</p>
      </div>
    );
  }
  const remaining = Number(s.free_threshold) - Number(quote.subtotal);
  const message =
    s.reason === "free"
      ? null
      : s.reason === "tier_price"
        ? // Free shipping is a retail promotion: a tier price does not include
          // carriage, so there is no threshold to nudge towards.
          t.tierPrice
        : s.reason === "below_threshold"
          ? t.belowThreshold(formatMoney(remaining))
          : s.coal_rule_basis === "quantity"
            ? t.coalQuantity(s.coal_min_quantity, s.coal_quantity)
            : t.coalKg(kg(s.coal_min_kg, locale), kg(s.coal_weight_kg, locale));
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
        {coal && s.coal_rule_basis === "kg" && s.coal_weight_unknown && (
          <span className="block opacity-80">{t.coalUnknown}</span>
        )}
      </p>
    </div>
  );
}

/** "₺X more for the next volume tier", only when it's within reach — and only
 * for an account that would actually get it. */
function VolumeNudge({ quote }: { quote: Cart }) {
  const t = useMessages(cartMessages).summary;
  const locale = useLocale();
  const next = quote.volume_next_tier;
  if (!next || !quote.perks_eligible) return null;
  const remaining = Number(next.threshold) - Number(quote.subtotal);
  if (remaining > Number(next.threshold) / 3) return null; // too far to be a useful nudge
  return (
    <p className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {t.volumeNudge(formatMoney(remaining), formatRate(next.rate, locale))}
    </p>
  );
}

/** How far the cart is from free shipping, as a bar and in words. */
function FreeShippingProgress({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const t = useMessages(cartMessages).summary;
  if (!(threshold > 0)) return null;
  const done = subtotal >= threshold;
  const percent = Math.min(100, Math.max(0, (subtotal / threshold) * 100));
  const text = done ? t.freeShippingReached : t.toFreeShipping(formatMoney(threshold - subtotal));
  return (
    <div className="space-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
      <p className="flex items-center gap-2 text-[13px] font-medium text-slate-700 dark:text-zinc-200">
        <Truck className={`h-4 w-4 shrink-0 ${done ? "text-emerald-600 dark:text-emerald-400" : ""}`} aria-hidden />
        {text}
      </p>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
      >
        <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * A visitor's summary, before there is a quote (it needs an account): the
 * subtotal, the basket discount it has reached, shipping, and the estimated
 * total, by the rules checkout applies to a bireysel order (`estimateCart`).
 * The server prices the order once they have signed in.
 */
function GuestEstimate({ subtotal, params }: { subtotal: number; params: StoreParameters }) {
  const t = useMessages(cartMessages).summary;
  const locale = useLocale();
  const e = estimateCart(subtotal, params);
  // Within reach only, as for a signed-in cart (VolumeNudge).
  const nudge = e.nextTier && e.nextTier.remaining <= e.nextTier.threshold / 3 ? e.nextTier : null;
  return (
    <>
      <Row label={t.subtotal} value={formatMoney(e.subtotal)} />
      {e.volumeDiscount > 0 && (
        <Row label={t.volumeDiscount(formatRate(e.volumeRate, locale))} value={`−${formatMoney(e.volumeDiscount)}`} tone="discount" />
      )}
      <Row label={t.shipping} value={e.freeShipping ? t.free : t.receiverPays} />
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-bold dark:border-white/10">
        <dt>{t.estimatedTotal}</dt>
        <dd dir="ltr" className="whitespace-nowrap tabular-nums">
          {formatMoney(e.total)}
        </dd>
      </div>
      <div className="space-y-2 pt-1">
        <FreeShippingProgress subtotal={e.subtotal} threshold={e.shippingThreshold} />
        {nudge && (
          <p className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t.toNextTier(formatMoney(nudge.remaining), formatRate(nudge.rate, locale))}
          </p>
        )}
      </div>
      <p className="text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">{t.guestEstimate}</p>
    </>
  );
}

export function OrderSummary(props: OrderSummaryProps) {
  const { isLoggedIn, quote, quoteLoading, quoteError, submitting, checkoutError } = props;
  const locale = useLocale();
  const m = useMessages(cartMessages);
  const t = m.summary;
  const rate = (value: string | number) => formatRate(value, locale);
  const shippingTitle = shippingOption(props.shippingMethod, locale).title;
  const needsConsent = !!quote?.shipping.receiver_pays;
  const canCheckout = !isLoggedIn || (!!quote && !quoteLoading && !quoteError && !props.blocker);
  const { params } = props;
  // A Bayi / Toptan / Kafe account sees its cart as an invoice: before VAT, the
  // VAT, after VAT. Retail keeps the consumer view, VAT-inclusive throughout.
  const b2bInvoice =
    !!quote && !quote.perks_eligible && !props.quoteOnly && quote.subtotal_excl_tax != null && quote.vat_total != null;
  // Sultan Puan is a retail promotion and can be switched off in the panel.
  const loyalty = props.perks && params.loyalty.enabled;
  // A B2B cart with products that give its list the havale discount ("Bayide / Toptanda / Kafede …").
  const b2bHavale = !!quote?.items.some((i) => i.havale_eligible);
  const transferHint = transferDiscountHint(params, locale);

  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
    >
      <h2 id="summary-heading" className="text-lg font-bold tracking-tight">
        {t.heading}
      </h2>

      {/* An export account has no payment step at all: no gateway, no havale,
          no card to save, and no Sultan Puan to spend. What it gets instead is a
          line saying what happens after the request. */}
      {isLoggedIn && props.quoteOnly && (
        <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
          {m.export.noPayment}
        </p>
      )}

      {isLoggedIn && !props.quoteOnly && (
        <div className="mt-5 space-y-5">
          <PaymentMethodPicker
            value={props.paymentMethod}
            onChange={props.onPaymentMethodChange}
            /* The havale discount is a retail promotion: a B2B account pays its
               tier price whichever way it pays — except on the products that
               give its list the discount. */
            transferDiscount={props.perks ? transferHint : b2bHavale && transferHint ? t.markedProducts(transferHint) : null}
            cardAvailable={props.cardAvailable}
            saveCard={props.saveCard}
            onSaveCardChange={props.onSaveCardChange}
          />
          {props.paymentMethod === "BANK_TRANSFER" && <TransferDetails quote={quote} />}
          {/* Sultan Puan is a retail promotion too, so it is not offered to an
              account that cannot spend it, nor to anyone while it is off. */}
          {loyalty && (
            <LoyaltyPointsInput
              balance={props.balance}
              value={props.points}
              onChange={props.onPointsChange}
              conversionRate={params.loyalty.conversion_rate}
            />
          )}
        </div>
      )}

      <dl
        className={`mt-5 space-y-2.5 border-t border-slate-200 dark:border-white/10 pt-5 transition-opacity ${quoteLoading ? "opacity-50" : ""}`}
        aria-busy={quoteLoading}
      >
        {quote && b2bInvoice ? (
          // Bayi / Toptan / Kafe: invoice lines, before VAT, the VAT, and the total.
          <>
            <Row
              label={
                <span>
                  {t.subtotal} <span className="text-xs opacity-75">{t.exclVat}</span>
                </span>
              }
              value={formatMoney(quote.subtotal_excl_tax!)}
            />
            {Number(quote.discount_amount) > 0 && (
              <Row
                label={
                  <>
                    {t.havaleDiscount(rate(quote.discount_rate))} <span className="text-xs opacity-75">{t.exclVat}</span>
                    <span className="block text-xs opacity-75">{t.markedOnly}</span>
                  </>
                }
                value={`−${formatMoney(quote.line_discount_excl_tax ?? quote.discount_amount)}`}
                tone="discount"
              />
            )}
            <Row
              label={t.vat((quote.vat_rates ?? []).map((r) => rate(Number(r) / 100)).join(" / ") || rate(0))}
              value={formatMoney(quote.vat_total!)}
            />
            <Row
              label={shippingTitle}
              value={
                quote.shipping.free
                  ? t.free
                  : quote.shipping.reason === "international"
                    ? t.afterOrder
                    : t.receiverPays
              }
            />
            <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3 dark:border-white/10">
              <dt className="text-base font-bold">
                {t.grandTotal} <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{t.inclVat}</span>
              </dt>
              <dd className="font-mono text-base font-bold tabular-nums">{formatMoney(quote.net_total)}</dd>
            </div>
            {!props.quoteOnly && (
              <div className="space-y-2 pt-1">
                <ShippingNote quote={quote} />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {b2bHavale ? t.b2bHavaleNote : t.b2bNote}
            </p>
          </>
        ) : quote ? (
          <>
            <Row label={t.subtotal} value={formatMoney(quote.subtotal)} />
            {Number(quote.volume_discount_amount) > 0 && (
              <Row
                label={t.volumeDiscount(rate(quote.volume_discount_rate))}
                value={`−${formatMoney(quote.volume_discount_amount)}`}
                tone="discount"
              />
            )}
            {Number(quote.discount_amount) > 0 && (
              <Row
                label={
                  <>
                    {t.havaleDiscount(rate(quote.discount_rate))}
                    {Number(quote.volume_discount_amount) > 0 && (
                      <span className="block text-xs opacity-75">{t.afterVolume}</span>
                    )}
                  </>
                }
                value={`−${formatMoney(quote.discount_amount)}`}
                tone="discount"
              />
            )}
            {/* Never a charge: either the shop covers it or the buyer pays on delivery. */}
            <Row
              label={shippingTitle}
              value={
                quote.shipping.free
                  ? t.free
                  : quote.shipping.reason === "international"
                    ? t.afterOrder
                    : t.receiverPays
              }
            />
            {Number(quote.points_discount) > 0 && (
              <Row label="Sultan Puan" value={`−${formatMoney(quote.points_discount)}`} tone="discount" />
            )}
            <div className="flex justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-3 text-base font-bold">
              <dt>{t.total}</dt>
              <dd className="tabular-nums">{formatMoney(quote.net_total)}</dd>
            </div>
            {!props.quoteOnly && (
              <div className="space-y-2 pt-1">
                <ShippingNote quote={quote} />
                <VolumeNudge quote={quote} />
              </div>
            )}
            {!props.quoteOnly && loyalty && quote.loyalty_points_to_earn > 0 && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {t.pointsToEarn(quote.loyalty_points_to_earn.toLocaleString(INTL_LOCALE[locale]))}
              </p>
            )}
            {!props.quoteOnly && !quote.perks_eligible && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">{t.b2bNote}</p>
            )}
          </>
        ) : isLoggedIn ? (
          <>
            <Row label={t.estimatedSubtotal} value={formatMoney(props.estimatedSubtotal)} />
            <p className="text-xs text-slate-500 dark:text-zinc-400">{t.calculating}</p>
          </>
        ) : (
          <GuestEstimate subtotal={props.estimatedSubtotal} params={params} />
        )}
      </dl>

      <div className="mt-5 space-y-3">
        {quoteError && <Alert variant="error">{quoteError}</Alert>}
        {props.blocker && isLoggedIn && <p className="text-center text-xs text-slate-500 dark:text-zinc-400">{props.blocker}</p>}
        {checkoutError && <Alert variant="error">{checkoutError}</Alert>}

        {/* A request consents to nothing: no carriage price has been named, and
            the agreements belong to the sale that may follow it. The server
            agrees — see `is_quote_account` in the checkout engine. */}
        {isLoggedIn && needsConsent && !props.quoteOnly && (
          <ShippingConsent checked={props.shippingConsent} onChange={props.onShippingConsentChange} />
        )}

        {/* Both agreements, or no order — the server refuses one without them.
            A request is not an order, and is not asked. */}
        {isLoggedIn && !props.quoteOnly && (
          <LegalConsent
            value={props.agreements}
            onChange={props.onAgreementsChange}
            documents={props.legalDocuments}
          />
        )}

        <Button type="button" onClick={props.onCheckout} loading={submitting} disabled={!canCheckout}>
          {!isLoggedIn ? (
            props.quoteOnly ? (
              m.export.signIn
            ) : (
              t.signIn
            )
          ) : props.quoteOnly ? (
            submitting ? (
              m.export.submitting
            ) : (
              <>
                <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {m.export.submit}
              </>
            )
          ) : submitting ? (
            props.paymentMethod === "CREDIT_CARD" ? t.openingPayment : t.placingOrder
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden />{" "}
              {props.paymentMethod === "CREDIT_CARD" ? t.payByCard : t.placeOrder}
            </>
          )}
        </Button>
        {!props.quoteOnly && (
          <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
            {t.vatIncluded}
          </p>
        )}
      </div>
    </section>
  );
}
