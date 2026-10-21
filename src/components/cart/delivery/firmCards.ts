/**
 * The five delivery cards a firm picks from, and what each one means.
 *
 * A firm's card answers two questions at once — where the goods go and how they
 * travel — so the card is the single piece of state the step keeps, and the
 * shipping method is read off it (`METHOD_BY_FIRM_CARD`). That is what keeps
 * the confirmed card and the method on the order from ever disagreeing.
 *
 * Four of them deliver to the address on file. "Şubeme istiyorum" is the one
 * that goes somewhere else: it names a branch, and that name is what allows the
 * address to differ from the registered one (`app/services/delivery.py` draws
 * the same line). "İstanbul içi ücretsiz teslimat" is the shop's own van, and
 * costs nothing from a subtotal the admin panel sets.
 */

import { Building2, MapPin, Store, Truck, Van, type LucideIcon } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import { checkoutMessages } from "@/lib/i18n/messages/checkout";
import type { ShippingMethod } from "@/types";

export type FirmCard = "BILLING" | "BRANCH" | "YURTICI_DOOR" | "NAKLIYE_AMBARI" | "ISTANBUL_FREE";

/** The card the cart opens on: the address the firm is invoiced at. */
export const DEFAULT_FIRM_CARD: FirmCard = "BILLING";

/**
 * Each card's icon. Its title and the line under it are words, in
 * `checkoutMessages.firm.cards`; the registered address replaces the line on
 * BILLING.
 */
export const FIRM_CARD_ICON: Record<FirmCard, LucideIcon> = {
  BILLING: MapPin,
  BRANCH: Store,
  YURTICI_DOOR: Truck,
  NAKLIYE_AMBARI: Building2,
  ISTANBUL_FREE: Van,
};

/** How the order travels, once a card has been confirmed. */
export const METHOD_BY_FIRM_CARD: Record<FirmCard, ShippingMethod> = {
  BILLING: "YURTICI_DOOR",
  BRANCH: "YURTICI_DOOR",
  YURTICI_DOOR: "YURTICI_DOOR",
  NAKLIYE_AMBARI: "NAKLIYE_AMBARI",
  ISTANBUL_FREE: "ISTANBUL_FREE",
};

/**
 * The cards this firm is offered, in the blueprint's order.
 *
 * The van is only listed where it goes: on the *registered* address, never on
 * whatever city is typed into the form, which is the test the server applies
 * too. While the addresses are still loading it is left out and its place held,
 * so nothing can be selected and then taken away.
 */
export function firmCards(registeredInIstanbul: boolean): FirmCard[] {
  const cards: FirmCard[] = ["BILLING", "BRANCH", "YURTICI_DOOR", "NAKLIYE_AMBARI"];
  return registeredInIstanbul ? [...cards, "ISTANBUL_FREE"] : cards;
}

/** A branch has to be named — it is what the shop writes on the parcel. */
export function branchProblem(name: string, locale: Locale = "tr"): string | null {
  return name.trim().length < 2 ? checkoutMessages[locale].problems.branch : null;
}

/**
 * How much more the cart needs before the van carries it for nothing; 0 once
 * the limit is met. The server refuses the method below it, so this is also
 * what decides whether the card can be confirmed at all.
 */
export function istanbulShortfall(subtotal: number, minimum: number): number {
  return Math.max(0, minimum - subtotal);
}
