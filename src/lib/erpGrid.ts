/**
 * "Fiyat Giriş Modu": the products list as a grid of TL ERP prices (KDV
 * hariç), one column per customer group. What the typed cells come to as the
 * save's changes, and where Enter moves. Free of React, for its tests.
 */

export type GridSegment = "DEALER" | "WHOLESALE" | "CAFE" | "RETAIL";
/** The grid's columns, in the catalogue's order. */
export const GRID_SEGMENTS: readonly { segment: GridSegment; label: string }[] = [
  { segment: "DEALER", label: "Bayi" },
  { segment: "WHOLESALE", label: "Toptan" },
  { segment: "CAFE", label: "Kafe" },
  { segment: "RETAIL", label: "Perakende" },
];

export const cellKey = (productId: string, segment: GridSegment) => `${productId}:${segment}`;

export interface ErpChange {
  product_id: string;
  segment: GridSegment;
  /** Before VAT, "1250.50"; null removes the ERP price. */
  price: string | null;
}

/** "100" / "100.5" / null → "100.00" / "100.50" / null: one spelling to compare by. */
export function normalized(price: string | number | null | undefined): string | null {
  if (price === null || price === undefined || price === "") return null;
  const n = Number(price);
  return Number.isFinite(n) ? n.toFixed(2) : null;
}

/**
 * The typed cells against what the server has: the changes to save, and the
 * cells that are not a price (which hold the save back). A cell typed back to
 * its saved value, or left empty where there was none, is no change.
 * `parse` reads a typed price ("1.250,50") as "1250.50", or null.
 */
export function gridChanges(
  drafts: Readonly<Record<string, string>>,
  saved: (key: string) => string | null,
  parse: (raw: string) => string | null,
): { changes: ErpChange[]; invalid: string[] } {
  const changes: ErpChange[] = [];
  const invalid: string[] = [];
  for (const [key, raw] of Object.entries(drafts)) {
    const cut = key.lastIndexOf(":");
    const product_id = key.slice(0, cut);
    const segment = key.slice(cut + 1) as GridSegment;
    const before = normalized(saved(key));
    if (!raw.trim()) {
      if (before !== null) changes.push({ product_id, segment, price: null });
      continue;
    }
    const price = parse(raw);
    if (price === null || Number(price) <= 0) {
      invalid.push(key);
      continue;
    }
    if (normalized(price) !== before) changes.push({ product_id, segment, price: normalized(price) });
  }
  return { changes, invalid };
}

/** The cell Enter (down) or Shift+Enter (up) moves to, held inside the grid. */
export function verticalMove(row: number, rows: number, up: boolean): number {
  return Math.min(Math.max(row + (up ? -1 : 1), 0), Math.max(rows - 1, 0));
}
