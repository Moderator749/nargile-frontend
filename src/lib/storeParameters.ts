import { formatMoneyCompact } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import type { DecimalString, ParameterTier, StoreParameters } from "@/types";

/**
 * The defaults the server falls back to (`app/services/store_parameters.py`),
 * so the storefront can state the rules before the read lands.
 */
export const DEFAULT_STORE_PARAMETERS: StoreParameters = {
  free_shipping_threshold: "3000.00",
  coal_min_kg: "20",
  coal_max_ratio: "0.50",
  coal_rule_basis: "kg",
  coal_min_quantity: 20,
  bank_transfer_tiers: [
    { threshold: "1.00", rate: "0.05" },
    { threshold: "30000.00", rate: "0.07" },
  ],
  volume_tiers: [
    { threshold: "30000.00", rate: "0.05" },
    { threshold: "50000.00", rate: "0.08" },
  ],
  loyalty: {
    enabled: true,
    base_rate: "0.10",
    band_min: "20000.00",
    band_max: "29999.99",
    conversion_rate: "1.00",
    annual_spend_threshold: "20000.00",
    annual_bonus_points: 1000,
    annual_period_days: 365,
    annual_order_ceiling: "20000.00",
  },
  istanbul_free_min_subtotal: "20000.00",
};

/**
 * A rate as the shop writes it: "0.05" → "%5", "0.0525" → "%5,25" — and on an
 * English or Arabic page as those readers write it, "5%", "5.25%".
 */
export function formatRate(rate: DecimalString | number, locale: Locale = "tr"): string {
  const n = (Number(rate) * 100).toLocaleString(INTL_LOCALE[locale], { maximumFractionDigits: 2 });
  return locale === "tr" ? `%${n}` : `${n}%`;
}

/** The rungs that actually give something, lowest first. */
const live = (tiers: ParameterTier[]) =>
  tiers.filter((t) => Number(t.rate) > 0).sort((a, b) => Number(a.threshold) - Number(b.threshold));

/**
 * "%5 indirim (₺30.000 üzeri %7)": the havale ladder in one line, or null when
 * there is no havale discount at all. A first rung at ₺1 is "from the first
 * lira" and goes unsaid. Turkish unless a page's language is given (the panel
 * quotes it too).
 */
export function transferDiscountHint(params: StoreParameters, locale: Locale = "tr"): string | null {
  const [first, ...rest] = live(params.bank_transfer_tiers);
  if (!first) return null;
  const rate = (t: ParameterTier) => formatRate(t.rate, locale);
  const over = (t: ParameterTier) => formatMoneyCompact(t.threshold);
  const above = Number(first.threshold) > 1;
  if (locale === "en") {
    const more = rest.map((t) => `${rate(t)} over ${over(t)}`).join(", ");
    return `${rate(first)} off${above ? ` over ${over(first)}` : ""}${more ? ` (${more})` : ""}`;
  }
  if (locale === "ar") {
    const more = rest.map((t) => `${rate(t)} فوق ${over(t)}`).join("، ");
    return `خصم ${rate(first)}${above ? ` فوق ${over(first)}` : ""}${more ? ` (${more})` : ""}`;
  }
  const from = above ? `${over(first)} üzeri ` : "";
  const more = rest.map((t) => `${over(t)} üzeri ${rate(t)}`).join(", ");
  return `${from}${rate(first)} indirim${more ? ` (${more})` : ""}`;
}

/** "%5 – %7": the span of a ladder's rates, or null when it gives nothing. */
export function rateRange(tiers: ParameterTier[], locale: Locale = "tr"): string | null {
  const rates = live(tiers).map((t) => Number(t.rate));
  if (!rates.length) return null;
  const low = Math.min(...rates);
  const high = Math.max(...rates);
  return low === high ? formatRate(low, locale) : `${formatRate(low, locale)} – ${formatRate(high, locale)}`;
}

/**
 * The havale/EFT rate a cart of `subtotalTry` gets: the highest rung it
 * reaches, 0 below the first — as `rate_for` does on the server.
 */
export function transferRateFor(params: StoreParameters, subtotalTry: number): number {
  const reached = live(params.bank_transfer_tiers).filter((t) => subtotalTry >= Number(t.threshold));
  return reached.length ? Number(reached[reached.length - 1].rate) : 0;
}
