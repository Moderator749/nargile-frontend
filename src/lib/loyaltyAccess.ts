import type { User } from "@/types";

/*
 * Sultan Puan and Sultan Kumbara belong to the Perakende price list, whether
 * the account is Bireysel or Kurumsal (app/services/perks.py `loyalty_perks`
 * has the last word): Kafe, Toptan and Bayi neither earn nor spend, and are
 * not shown either.
 */

/** What the admin customer page shows in "Sultan Puan": the tools, a notice, or a notice over old history. */
export type AdminLoyaltyView = "active" | "off" | "off-with-history";

export function adminLoyaltyView(c: { loyalty_eligible?: boolean; loyalty_history?: boolean }): AdminLoyaltyView {
  if (c.loyalty_eligible !== false) return "active";
  return c.loyalty_history ? "off-with-history" : "off";
}

/** Whether the account page shows the wallet: an account on the Perakende price list, Bireysel or Kurumsal, as the server also says. */
export function showsWallet(
  user: Pick<User, "account_type" | "segment_code"> | null,
  wallet: { eligible?: boolean } | null,
): boolean {
  // lib/perks `loyaltyPerks` (the price list alone), inlined so `npm test` reads this module on its own.
  if (!user || user.account_type === "INTERNATIONAL" || (user.segment_code ?? "RETAIL") !== "RETAIL") return false;
  return wallet?.eligible !== false;
}

export const LOYALTY_OFF_NOTICE =
  "Sultan Puan ve Sultan Kumbara yalnızca Perakende fiyat grubundaki hesaplar içindir (Bireysel ya da Kurumsal); Kafe, Toptan ve Bayi fiyat gruplarında kapalıdır. Bu hesap puan kazanmaz, harcayamaz ve Kumbara’ya katılmaz.";
