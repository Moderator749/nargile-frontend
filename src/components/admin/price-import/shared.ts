import type { PriceImportCandidate, PriceImportRow, SegmentType } from "@/types";

/** The workbook's order, left to right. */
export const GROUPS: { key: SegmentType; label: string }[] = [
  { key: "DEALER", label: "Bayi" },
  { key: "WHOLESALE", label: "Toptan" },
  { key: "CAFE", label: "Kafe" },
  { key: "RETAIL", label: "Perakende" },
];

export const BASIS: Record<PriceImportCandidate["basis"], string> = {
  abbreviation: "kısaltma",
  similar: "benzer kod",
  same_code: "aynı kod",
};

export const where = (r: Pick<PriceImportRow, "row" | "side">) =>
  `${r.side === "sol" ? "Sol" : "Sağ"} · ${r.row}. satır`;

/** A row's identity within one upload. */
export const rowKey = (r: Pick<PriceImportRow, "sheet" | "row" | "side">) => `${r.sheet}-${r.row}-${r.side}`;

/** A candidate already at the row's retail price is very likely the product the row means. */
export const samePrice = (row: PriceImportRow, candidate: PriceImportCandidate) =>
  row.prices.RETAIL !== null &&
  candidate.retail?.currency === "TRY" &&
  Number(candidate.retail.price_incl_tax) === Number(row.prices.RETAIL);
