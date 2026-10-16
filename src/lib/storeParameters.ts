import { formatMoneyCompact } from "@/lib/format";
import type { DecimalString, ParameterTier, StoreParameters } from "@/types";

/** A rate as the shop writes it: "0.05" → "%5", "0.0525" → "%5,25". */
export function formatRate(rate: DecimalString | number): string {
  return `%${(Number(rate) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
}

/** The rungs that actually give something, lowest first. */
const live = (tiers: ParameterTier[]) =>
  tiers.filter((t) => Number(t.rate) > 0).sort((a, b) => Number(a.threshold) - Number(b.threshold));

/**
 * "%5 indirim (₺30.000 üzeri %7)": the havale ladder in one line, or null when
 * there is no havale discount at all. A first rung at ₺1 is "from the first
 * lira" and goes unsaid.
 */
export function transferDiscountHint(params: StoreParameters): string | null {
  const [first, ...rest] = live(params.bank_transfer_tiers);
  if (!first) return null;
  const from = Number(first.threshold) > 1 ? `${formatMoneyCompact(first.threshold)} üzeri ` : "";
  const more = rest.map((t) => `${formatMoneyCompact(t.threshold)} üzeri ${formatRate(t.rate)}`).join(", ");
  return `${from}${formatRate(first.rate)} indirim${more ? ` (${more})` : ""}`;
}

/** "%5 – %7": the span of a ladder's rates, or null when it gives nothing. */
export function rateRange(tiers: ParameterTier[]): string | null {
  const rates = live(tiers).map((t) => Number(t.rate));
  if (!rates.length) return null;
  const low = Math.min(...rates);
  const high = Math.max(...rates);
  return low === high ? formatRate(low) : `${formatRate(low)} – ${formatRate(high)}`;
}

/**
 * The havale/EFT rate a cart of `subtotalTry` gets: the highest rung it
 * reaches, 0 below the first — as `rate_for` does on the server.
 */
export function transferRateFor(params: StoreParameters, subtotalTry: number): number {
  const reached = live(params.bank_transfer_tiers).filter((t) => subtotalTry >= Number(t.threshold));
  return reached.length ? Number(reached[reached.length - 1].rate) : 0;
}
