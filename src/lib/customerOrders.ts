/*
 * "Sipariş / Alışveriş Geçmişi" on the admin customer page: the pure parts,
 * so `npm test` reads them.
 */

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CREDIT_CARD: "Kredi Kartı",
  BANK_TRANSFER: "Havale/EFT",
};

/** An order's lines in one line: "Lüle (Siyah) ×2, Kömür ×1", with "+3 ürün" past `max`. */
export function linesSummary(lines: { product_name: string; variant: string | null; quantity: number }[], max = 3): string {
  const shown = lines.slice(0, max).map((l) => `${l.product_name}${l.variant ? ` (${l.variant})` : ""} ×${l.quantity}`);
  const rest = lines.length - max;
  return rest > 0 ? `${shown.join(", ")} +${rest} ürün` : shown.join(", ");
}

/** A date range as the history asks for it: both ends optional, "to" not before "from". */
export function rangeProblem(from: string, to: string): string | null {
  if (from && to && to < from) return "Bitiş tarihi başlangıçtan önce olamaz.";
  return null;
}
