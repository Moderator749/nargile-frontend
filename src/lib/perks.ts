import type { User } from "@/types";

/**
 * Whether this account gets the B2C perks: Sultan Puan, the ciro discount and the
 * havale discount.
 *
 * Mirrors `app/services/perks.py`, which has the last word on every amount —
 * this only decides what the cart shows, so that a kafe is not offered a
 * discount it would then not receive. A bireysel account an admin has moved to
 * a B2B tier is not eligible either: the tier is the better deal, and it is not
 * meant to be had twice.
 */
export function retailPerks(user: Pick<User, "account_type" | "segment_code"> | null): boolean {
  if (!user) return false;
  return user.account_type === "INDIVIDUAL" && (user.segment_code ?? "RETAIL") === "RETAIL";
}
