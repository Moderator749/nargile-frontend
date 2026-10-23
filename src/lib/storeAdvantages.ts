import { Bike, Crown, PiggyBank, Truck, type LucideIcon } from "lucide-react";

import { homeIcon } from "@/lib/homeIcons";
import { fillIn } from "@/lib/homeSectionCopy";
import type { Homepage, ParameterTier, StoreParameters } from "@/types";

/**
 * The shop's advantages, one list for every page that states them: the
 * homepage's perks bar takes its three from here, the product page's
 * "Size Özel Alışveriş Avantajları" all of them. Each is worded as the
 * homepage words it ("Ana Sayfa Düzenleme": the Avantaj Çubuğu, the free
 * shipping van over "Sizin İçin Seçtiklerimiz", the courier by the lüles, the
 * SultanPuan and Kumbara bands) with the live figures of "Parametreler", and
 * is on the list only while the homepage shows it: its section switched on,
 * its programme running. Nothing is written here that the homepage does not say.
 */

/** The homepage's parts the advantages are read from (in the page's language, as getHomepage gives them). */
export type AdvantageSources = Pick<Homepage, "sections" | "perks" | "picks" | "lules" | "sultanpuan" | "kumbara">;

export type AdvantageKey = "installments" | "volume" | "transfer" | "shipping" | "courier" | "sultanpuan" | "kumbara";

export interface StoreAdvantage {
  key: AdvantageKey;
  /** Its section on "Ayrıcalıklar ve Avantajlar". */
  anchor: string;
  Icon: LucideIcon;
  label: string;
  /** The figure ("%5 – %8", "3.000 TL"), where it has one. */
  value: string | null;
  note: string;
}

const whole = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

/** "20000.00"–"29999.99" → "20.000–29.999 TL": whole liras, the band's inside. */
export function bandText(min: string, max: string): string {
  return `${whole.format(Math.ceil(Number(min)))}–${whole.format(Math.floor(Number(max)))} TL`;
}

/**
 * "%5 – %8": a ladder's lowest and highest rate that give anything; null with
 * none. Written as formatRate would, in the page's language ("5% – 8%").
 */
export function rateSpan(tiers: ParameterTier[], percent: (n: number) => string): string | null {
  const rates = tiers.map((t) => Number(t.rate)).filter((r) => r > 0);
  if (rates.length === 0) return null;
  const low = Math.min(...rates);
  const high = Math.max(...rates);
  const rate = (r: number) => percent(r * 100);
  return low === high ? rate(low) : `${rate(low)} – ${rate(high)}`;
}

/** Two of the homepage's lines as one ("20.000–29.999 TL alışverişlerde · Puanınız …"). */
const joined = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(" · ");

/**
 * The advantages the homepage shows, in its order, with its words and the
 * live figures. `percent` writes a rate in the page's language (homeMessages).
 */
export function storeAdvantages(home: AdvantageSources, params: StoreParameters, percent: (n: number) => string): StoreAdvantage[] {
  const out: StoreAdvantage[] = [];
  const { sections, perks, loyalty } = { ...home, loyalty: params.loyalty };

  // The Avantaj Çubuğu: a ladder the panel empties drops its item there, so here.
  if (sections.perks) {
    out.push({
      key: "installments",
      anchor: "taksit",
      Icon: homeIcon(perks.installments.icon),
      label: perks.installments.label,
      value: perks.installments.value || null,
      note: perks.installments.note,
    });
    const volume = rateSpan(params.volume_tiers, percent);
    if (volume) out.push({ key: "volume", anchor: "sepet-indirimi", Icon: homeIcon(perks.volume.icon), label: perks.volume.label, value: volume, note: perks.volume.note });
    const transfer = rateSpan(params.bank_transfer_tiers, percent);
    if (transfer)
      out.push({ key: "transfer", anchor: "havale-indirimi", Icon: homeIcon(perks.transfer.icon), label: perks.transfer.label, value: transfer, note: perks.transfer.note });
  }

  // The free shipping van, over "Sizin İçin Seçtiklerimiz".
  if (sections.picks) {
    const threshold = `${money.format(Number(params.free_shipping_threshold))} TL`;
    out.push({
      key: "shipping",
      anchor: "ucretsiz-kargo",
      Icon: Truck,
      label: home.picks.shipping_eyebrow,
      // The van says the threshold in its sentence, not beside the label: so here.
      value: null,
      note: fillIn(home.picks.shipping_text, { tutar: threshold }),
    });
  }

  // The courier, by the lüles.
  if (sections.lules) {
    out.push({ key: "courier", anchor: "istanbul-kurye", Icon: Bike, label: home.lules.courier_eyebrow, value: null, note: home.lules.courier_text });
  }

  // The SultanPuan band: its rate, earned in its band.
  if (sections.sultanpuan && loyalty.enabled && Number(loyalty.base_rate) > 0) {
    out.push({
      key: "sultanpuan",
      anchor: "sultanpuan",
      Icon: Crown,
      label: "SultanPuan",
      value: percent(Number(loyalty.base_rate) * 100),
      note: joined(fillIn(home.sultanpuan.subtitle, { bant: bandText(loyalty.band_min, loyalty.band_max) }), home.sultanpuan.note),
    });
  }

  // The Kumbara band: the annual target and what reaching it is worth.
  const target = Number(loyalty.annual_spend_threshold);
  if (sections.kumbara && loyalty.enabled && loyalty.annual_bonus_points > 0 && target > 0) {
    const amount = `${whole.format(target)} TL`;
    const bonus = percent(((loyalty.annual_bonus_points * Number(loyalty.conversion_rate)) / target) * 100);
    out.push({
      key: "kumbara",
      anchor: "kumbarapuan",
      Icon: PiggyBank,
      label: "Kumbara",
      value: amount,
      note: fillIn(home.kumbara.note, { tutar: amount, oran: bonus }),
    });
  }
  return out;
}

/** The parts of the homepage document `storeAdvantages` reads, for passing to a client component. */
export const advantageSources = (home: Homepage): AdvantageSources => ({
  sections: home.sections,
  perks: home.perks,
  picks: home.picks,
  lules: home.lules,
  sultanpuan: home.sultanpuan,
  kumbara: home.kumbara,
});
