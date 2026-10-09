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

import type { ShippingMethod } from "@/types";

export type FirmCard = "BILLING" | "BRANCH" | "YURTICI_DOOR" | "NAKLIYE_AMBARI" | "ISTANBUL_FREE";

/** The card the cart opens on: the address the firm is invoiced at. */
export const DEFAULT_FIRM_CARD: FirmCard = "BILLING";

export interface FirmCardCopy {
  title: string;
  /** The line under the title; the registered address replaces it on BILLING. */
  summary: string;
  Icon: LucideIcon;
}

export const FIRM_CARD_COPY: Record<FirmCard, FirmCardCopy> = {
  BILLING: {
    title: "Fatura adresime istiyorum",
    summary: "Kayıtlı fatura adresinize gönderilir.",
    Icon: MapPin,
  },
  BRANCH: {
    title: "Şubeme istiyorum",
    summary: "Şubenizin adını, adresini ve telefonunu girin.",
    Icon: Store,
  },
  YURTICI_DOOR: {
    title: "Yurtiçi Kargo adres teslim istiyorum",
    summary: "Teslimatta alıcı öder; kendi anlaşmanız varsa ona faturalanır.",
    Icon: Truck,
  },
  NAKLIYE_AMBARI: {
    title: "Nakliye ambarı ile teslimat istiyorum",
    summary: "Ambar ücreti teslim alırken ödenir.",
    Icon: Building2,
  },
  ISTANBUL_FREE: {
    title: "İstanbul içi ücretsiz teslimat",
    summary: "Kendi aracımızla, teslimat öncesi arayarak.",
    Icon: Van,
  },
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
export function branchProblem(name: string): string | null {
  return name.trim().length < 2 ? "Şube adını girin." : null;
}

/**
 * How much more the cart needs before the van carries it for nothing; 0 once
 * the limit is met. The server refuses the method below it, so this is also
 * what decides whether the card can be confirmed at all.
 */
export function istanbulShortfall(subtotal: number, minimum: number): number {
  return Math.max(0, minimum - subtotal);
}
