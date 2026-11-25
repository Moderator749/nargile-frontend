/*
 * "Hesabı Sil" on the admin customer page: the pure parts, so `npm test`
 * reads them. The server decides what happens (app/api/v1/admin_customers
 * delete_customer): an account without orders is deleted; one with orders is
 * emptied — personal details erased, login closed — and its orders kept.
 */

export type DeleteMode = "deleted" | "anonymized";

const fold = (s: string) => s.trim().toLocaleUpperCase("tr-TR");

/**
 * Whether what the admin typed unlocks "Kalıcı Olarak Sil": "SİL" (any case,
 * Turkish İ — "sil" too, and "SIL" from a keyboard without İ), or the customer's e-mail, or their name / company as
 * shown. Empty never matches.
 */
export function confirmationMatches(
  typed: string,
  customer: { email: string; full_name?: string | null; company_title?: string | null },
): boolean {
  const t = fold(typed);
  if (!t) return false;
  // "SIL" too: an admin on a keyboard without İ.
  const accepted = ["SİL", "SIL", customer.email, customer.full_name ?? "", customer.company_title ?? ""]
    .map(fold)
    .filter(Boolean);
  return accepted.includes(t);
}

/** The notice the customer list shows after a deletion. */
export function deletionNotice(mode: DeleteMode, name: string, ordersKept: number): string {
  return mode === "deleted"
    ? `${name} hesabı ve ona ait tüm kayıtlar kalıcı olarak silindi.`
    : `${name} hesabı silindi: kişisel bilgileri kalıcı olarak silindi ve girişi kapatıldı. ${ordersKept} siparişi muhasebe ve raporlar için saklandı.`;
}

/** Query parameters the list reads the notice from (and then drops). */
export const DELETED_PARAM = "silindi";
export const DELETED_MODE_PARAM = "silme";
export const DELETED_ORDERS_PARAM = "siparis";
