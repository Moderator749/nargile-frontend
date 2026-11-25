import type { User } from "@/types";

/*
 * Whether the storefront holds this account to the online stock: the "Tükendi"
 * walls, the quantity caps, the "stok sınırı" notices. Two accounts are not:
 * an export account, whose cart is a request (lib/exportAccount), and a
 * branch's or test account ("Şube / Test", User.exclude_from_stock_and_reports),
 * which sells from its own shelf — the server takes no online stock for it and
 * lets it order what the site has none of. Pure, so `npm test` reads it.
 */
export function heldToOnlineStock(
  user: Pick<User, "account_type"> & { exclude_from_stock_and_reports?: boolean } | null | undefined,
): boolean {
  if (!user) return true;
  return user.account_type !== "INTERNATIONAL" && !user.exclude_from_stock_and_reports;
}
