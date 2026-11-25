import type { User } from "@/types";

/**
 * Whether this account gets the retail promotions: the ciro and havale
 * discounts, free shipping, Sultan Puan and Sultan Kumbara. Decided by the
 * price list alone (2026-11-25): every account on Perakende, Bireysel or
 * Kurumsal; never Kafe, Toptan or Bayi — the tier is the better deal, and it
 * is not meant to be had twice — nor an export account, whose orders are
 * quotes.
 *
 * Mirrors `app/services/perks.py`, which has the last word on every amount —
 * this only decides what is on screen, so that a kafe is not offered a
 * discount it would then not receive.
 */
export function retailPerks(user: Pick<User, "account_type" | "segment_code"> | null): boolean {
  if (!user) return false;
  return user.account_type !== "INTERNATIONAL" && (user.segment_code ?? "RETAIL") === "RETAIL";
}

/**
 * Sultan Puan and Sultan Kumbara: the same rule as the cart discounts
 * (`retailPerks`), kept as its own name so the points code says what it asks.
 * Mirrors the server's `loyalty_perks`.
 */
export function loyaltyPerks(user: Pick<User, "account_type" | "segment_code"> | null): boolean {
  return retailPerks(user);
}
