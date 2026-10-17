"use client";

import type { ReactNode } from "react";
import { Building2, Lock, Send, Ship, TrendingUp, Truck } from "lucide-react";

import { LegalConsent, type Agreements } from "@/components/cart/LegalConsent";
import { LoyaltyPointsInput } from "@/components/cart/LoyaltyPointsInput";
import { PaymentMethodPicker } from "@/components/cart/PaymentMethodPicker";
import { ShippingConsent } from "@/components/cart/ShippingConsent";
import { TransferDetails } from "@/components/payment/TransferDetails";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
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
      <dd className={`tabular-nums ${tone === "discount" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-zinc-100"}`}>
        {value}
      </dd>
    </div>
  );
}

const kg = (value: string) => Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 });

/**
 * Explains the shipping line: when the shop pays the carrier, and when the buyer
 * pays it on delivery ("karşı ödemeli") instead — the cart is never charged
 * carriage. The coal note only appears for coal-dominant carts under the coal
 * minimum. Every figure comes from the quote, i.e. from the live parameters.
 */
function ShippingNote({ quote }: { quote: Cart }) {
  const s = quote.shipping;
  if (s.reason === "freight" || s.reason === "international") {
    const note =
      s.reason === "freight"
        ? "Nakliye ambarı ücreti, malı teslim alırken ambara ödenir."
        : "Uluslararası navlun ve gümrük bedeli sipariş sonrasında belirlenir, ayrıca faturalandırılır.";
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
          "Gönderim ücreti sipariş tutarınıza eklenmez; teslimatta kargo görevlisine ödenir. Fiyat listenize kargo dahil değildir."
        : s.reason === "below_threshold"
          ? `Gönderim ücreti sipariş tutarınıza eklenmez; teslimatta kargo görevlisine ödenir. ${formatMoney(remaining)} daha ekleyin, kargonuz ücretsiz olsun.`
          : s.coal_rule_basis === "quantity"
            ? `Kömür ağırlıklı siparişlerde ücretsiz kargo için en az ${s.coal_min_quantity} adet kömür gereklidir. Sepetinizde ${s.coal_quantity} adet var; gönderim ücreti teslimatta alıcı tarafından ödenir.`
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
        {coal && s.coal_rule_basis === "kg" && s.coal_weight_unknown && (
          <span className="block opacity-80">Bazı kömürlerin ağırlığı tanımlı değil; bunlar 0 kg sayılır.</span>
        )}
      </p>
    </div>
  );
}

/** "₺X more for the next volume tier", only when it's within reach — and only
 * for an account that would actually get it. */
function VolumeNudge({ quote }: { quote: Cart }) {
  const next = quote.volume_next_tier;
  if (!next || !quote.perks_eligible) return null;
  const remaining = Number(next.threshold) - Number(quote.subtotal);
  if (remaining > Number(next.threshold) / 3) return null; // too far to be a useful nudge
  return (
    <p className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {formatMoney(remaining)} daha ekleyin, {formatRate(next.rate)} ciro indirimi otomatik uygulansın.
    </p>
  );
}

export function OrderSummary(props: OrderSummaryProps) {
  const { isLoggedIn, quote, quoteLoading, quoteError, submitting, checkoutError } = props;
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
  const transferHint = transferDiscountHint(params);

  return (
    <section
      aria-labelledby="summary-heading"
      className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6 lg:sticky lg:top-24"
    >
      <h2 id="summary-heading" className="text-lg font-bold tracking-tight">
        Sipariş Özeti
      </h2>

      {/* An export account has no payment step at all: no gateway, no havale,
          no card to save, and no Sultan Puan to spend. What it gets instead is a
          line saying what happens after the request. */}
      {isLoggedIn && props.quoteOnly && (
        <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-3 text-[13px] leading-relaxed text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
          No payment is taken for this request. We will reply with a freight quote and
          estimated delivery once the packages and total weight are known.
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
            transferDiscount={props.perks ? transferHint : b2bHavale && transferHint ? `${transferHint}, işaretli ürünlerde` : null}
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
            <Row label={<span>Ara toplam <span className="text-xs opacity-75">(KDV hariç)</span></span>} value={formatMoney(quote.subtotal_excl_tax!)} />
            {Number(quote.discount_amount) > 0 && (
              <Row
                label={
                  <>
                    Havale/EFT indirimi (−{formatRate(quote.discount_rate)}) <span className="text-xs opacity-75">(KDV hariç)</span>
                    <span className="block text-xs opacity-75">yalnızca işaretli ürünlerde</span>
                  </>
                }
                value={`−${formatMoney(quote.line_discount_excl_tax ?? quote.discount_amount)}`}
                tone="discount"
              />
            )}
            <Row
              label={`Hesaplanan KDV (${(quote.vat_rates ?? []).map((r) => formatRate(Number(r) / 100)).join(" / ") || "%0"})`}
              value={formatMoney(quote.vat_total!)}
            />
            <Row
              label={shippingOption(props.shippingMethod).title}
              value={
                quote.shipping.free
                  ? "Ücretsiz"
                  : quote.shipping.reason === "international"
                    ? "Sipariş sonrası"
                    : "Teslimatta alıcı öder"
              }
            />
            <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3 dark:border-white/10">
              <dt className="text-base font-bold">
                Genel toplam <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">(KDV dahil)</span>
              </dt>
              <dd className="font-mono text-base font-bold tabular-nums">{formatMoney(quote.net_total)}</dd>
            </div>
            {!props.quoteOnly && (
              <div className="space-y-2 pt-1">
                <ShippingNote quote={quote} />
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {b2bHavale
                ? "Fiyatlarınız hesabınıza tanımlı fiyat listesinden gelir. Havale/EFT ile ödemede işaretli ürünlerde havale indirimi uygulanır; ciro ve Sultan Puan indirimleri bireysel (perakende) hesaplara tanımlıdır."
                : "Fiyatlarınız hesabınıza tanımlı fiyat listesinden gelir; ciro, havale ve Sultan Puan indirimleri bireysel (perakende) hesaplara tanımlıdır."}
            </p>
          </>
        ) : quote ? (
          <>
            <Row label="Ara toplam" value={formatMoney(quote.subtotal)} />
            {Number(quote.volume_discount_amount) > 0 && (
              <Row
                label={`Kazanılan ciro indirimi (−${formatRate(quote.volume_discount_rate)})`}
                value={`−${formatMoney(quote.volume_discount_amount)}`}
                tone="discount"
              />
            )}
            {Number(quote.discount_amount) > 0 && (
              <Row
                label={
                  <>
                    Havale/EFT indirimi (−{formatRate(quote.discount_rate)})
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
              label={shippingOption(props.shippingMethod).title}
              value={
                quote.shipping.free
                  ? "Ücretsiz"
                  : quote.shipping.reason === "international"
                    ? "Sipariş sonrası"
                    : "Teslimatta alıcı öder"
              }
            />
            {Number(quote.points_discount) > 0 && (
              <Row label="Sultan Puan" value={`−${formatMoney(quote.points_discount)}`} tone="discount" />
            )}
            <div className="flex justify-between gap-4 border-t border-slate-200 dark:border-white/10 pt-3 text-base font-bold">
              <dt>Toplam</dt>
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
                Siparişiniz onaylandığında {quote.loyalty_points_to_earn.toLocaleString("tr-TR")} Sultan Puan
                kazanacaksınız.
              </p>
            )}
            {!props.quoteOnly && !quote.perks_eligible && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Fiyatlarınız hesabınıza tanımlı fiyat listesinden gelir; ciro, havale ve Sultan Puan indirimleri
                bireysel (perakende) hesaplara tanımlıdır.
              </p>
            )}
          </>
        ) : (
          <>
            <Row label="Ara toplam (tahmini)" value={formatMoney(props.estimatedSubtotal)} />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isLoggedIn
                ? "Kargo ve indirimler hesaplanıyor…"
                : `Ciro ve havale indirimleri ile size özel fiyatlar giriş yaptıktan sonra hesaplanır. ${formatMoneyCompact(params.free_shipping_threshold)} üzeri kargo ücretsiz (kömürde koşullu); altında gönderim ücreti teslimatta alıcı tarafından ödenir.`}
            </p>
          </>
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
              "Sign in to submit your request"
            ) : (
              "Siparişi tamamlamak için giriş yapın"
            )
          ) : props.quoteOnly ? (
            submitting ? (
              "Submitting your request…"
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden /> Submit Quote Request
              </>
            )
          ) : submitting ? (
            props.paymentMethod === "CREDIT_CARD" ? "Ödeme sayfası açılıyor…" : "Sipariş oluşturuluyor…"
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden />{" "}
              {props.paymentMethod === "CREDIT_CARD" ? "Kart ile Öde" : "Siparişi Tamamla"}
            </>
          )}
        </Button>
        {!props.quoteOnly && (
          <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
            Fiyatlara KDV dahildir. Nihai tutar sipariş anında sunucuda hesaplanır.
          </p>
        )}
      </div>
    </section>
  );
}
