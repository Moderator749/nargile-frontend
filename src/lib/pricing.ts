import { api } from "@/lib/api";
import type { DecimalString, ISODateTime, UUID } from "@/types";

/*
 * "Fiyat Hesaplama Cetveli": the worksheet's shapes, its arithmetic, and the
 * calls that save it and push it to a product. The arithmetic mirrors
 * `app/services/pricing_sheet.py` so the sheet updates as the admin types; the
 * server does the same sums again on save.
 */

export type PricingSegment = "DEALER" | "WHOLESALE" | "CAFE";
export type PricingCurrency = "TRY" | "USD" | "EUR";
export type VatMode = "EXCL" | "INCL";

export const SEGMENT_LABELS: Record<PricingSegment | "RETAIL", string> = {
  DEALER: "Bayi",
  WHOLESALE: "Toptan",
  CAFE: "Kafe",
  RETAIL: "Perakende",
};

/** What the server takes: the numbers as typed, as decimal strings. */
export interface PricingSheetInput {
  product_code: string;
  product_name: string;
  vat_mode: VatMode;
  currency: PricingCurrency;
  cost: DecimalString;
  columns: { label: string; segment: PricingSegment | null; percent: DecimalString; desired: DecimalString | null }[];
  retail: { percent: DecimalString; vat_rate: DecimalString; desired: DecimalString | null };
  /** After retail, worked out as retail is; for reference, never sent to the site. */
  extras: { label: string; percent: DecimalString; desired: DecimalString | null }[];
  usd_rate: DecimalString | null;
  eur_rate: DecimalString | null;
  final_try: DecimalString | null;
}

/** A column as stored: what was typed, what it came to, and the price used. */
export interface StoredColumn {
  label: string;
  segment: PricingSegment | "RETAIL" | null;
  percent: DecimalString;
  computed: DecimalString;
  desired: DecimalString | null;
  price: DecimalString;
  vat_rate?: DecimalString;
}

export interface StoredSheet {
  vat_mode: VatMode;
  currency: PricingCurrency;
  cost: DecimalString;
  columns: StoredColumn[];
  /** After VAT; `before_vat` is the markup step on its own. */
  retail: StoredColumn & { vat_rate: DecimalString; before_vat?: DecimalString };
  /** "Özel Fiyat 1"…; absent on rows saved before there were any. */
  extras?: (StoredColumn & { vat_rate: DecimalString; before_vat: DecimalString })[];
  usd_rate: DecimalString | null;
  eur_rate: DecimalString | null;
  try_price: DecimalString | null;
  final_try: DecimalString | null;
}

export interface PricingRecord {
  id: UUID;
  file_id: number | null;
  file_name: string | null;
  product_code: string;
  product_name: string;
  /** The product's current photo, looked up by its code; null when there is none. */
  image_url: string | null;
  sheet: StoredSheet;
  applied_at: ISODateTime | null;
  applied_summary: {
    product_name: string;
    variants: number;
    prices: { label: string; segment: string; currency: PricingCurrency; price_incl_tax: DecimalString }[];
    skipped: string[];
  } | null;
  created_at: ISODateTime;
}

export interface PricingFile {
  id: number;
  name: string;
  created_at: ISODateTime;
  /** The last time a row was saved into it; the list is newest first by this. */
  updated_at: ISODateTime;
  record_count: number;
}

export interface ApplyResult {
  record: PricingRecord;
  product_name: string;
  variants_updated: number;
  prices: { label: string; segment: string; currency: PricingCurrency; price_excl_tax: DecimalString; price_incl_tax: DecimalString }[];
  skipped: string[];
}

/** An existing file, or the name of a new one. */
export type FileTarget = { file_id: number } | { file_name: string };

// ── Arithmetic ───────────────────────────────────────────────────────────────

export interface ComputedSheet {
  /** Per intermediate column: the calculated value, and the price it sends (typed, else calculated). */
  columns: { computed: number | null; price: number | null }[];
  /** Retail after VAT ("KDV dahil perakende"), calculated and applied. */
  retail: { computed: number | null; price: number | null };
  /** The retail markup step before VAT is added (equal to `computed` on an after-VAT sheet). */
  retailBeforeVat: number | null;
  /** After retail, each as retail is: after VAT, with its step before VAT. */
  extras: { computed: number | null; price: number | null; beforeVat: number | null }[];
  /** USD/EUR sheets: retail × the typed rate. */
  tryPrice: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The calculated row is one unbroken chain: each column is the previous
 * *calculated* value plus its percent. A typed "uygulanacak fiyat" becomes that
 * column's price but never feeds the chain. Null propagates: a column after an
 * unusable one has nothing to stand on.
 */
export function computeSheet(input: {
  cost: number | null;
  columns: { percent: number | null; desired: number | null }[];
  retail: { percent: number | null; desired: number | null; vatRate: number | null };
  extras?: { percent: number | null; desired: number | null }[];
  vatMode: VatMode;
  currency: PricingCurrency;
  usdRate: number | null;
  eurRate: number | null;
}): ComputedSheet {
  let previous = input.cost;
  const columns = input.columns.map(({ percent, desired }) => {
    const computed = previous !== null && percent !== null ? previous * (1 + percent / 100) : null;
    previous = computed;
    return { computed: computed === null ? null : round2(computed), price: desired ?? (computed === null ? null : round2(computed)) };
  });
  // Retail is the shelf price, after VAT: VAT is added here when the sheet's
  // cost (and so its chain) is before VAT.
  const r = input.retail;
  const beforeVat = previous !== null && r.percent !== null ? previous * (1 + r.percent / 100) : null;
  const factor = r.vatRate !== null ? 1 + r.vatRate / 100 : null;
  const withVat = (v: number | null) =>
    v === null ? null : input.vatMode === "INCL" ? v : factor === null ? null : v * factor;
  const rc = withVat(beforeVat);
  const retailPrice = r.desired ?? (rc === null ? null : round2(rc));
  // The extras chain on from retail *before* VAT, so VAT is added once.
  let step = beforeVat;
  const extras = (input.extras ?? []).map(({ percent, desired }) => {
    step = step !== null && percent !== null ? step * (1 + percent / 100) : null;
    const computed = withVat(step);
    return {
      computed: computed === null ? null : round2(computed),
      price: desired ?? (computed === null ? null : round2(computed)),
      beforeVat: step === null ? null : round2(step),
    };
  });
  const rate = input.currency === "USD" ? input.usdRate : input.currency === "EUR" ? input.eurRate : null;
  return {
    columns,
    retail: { computed: rc === null ? null : round2(rc), price: retailPrice },
    retailBeforeVat: beforeVat === null ? null : round2(beforeVat),
    extras,
    tryPrice: retailPrice !== null && rate ? round2(retailPrice * rate) : null,
  };
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function fetchPricingFiles(signal?: AbortSignal): Promise<PricingFile[]> {
  const { data } = await api.get<PricingFile[]>("/admin/pricing/files", { signal });
  return data;
}

/** A file's rows, or the drafts when `fileId` is null. */
export async function fetchPricingRecords(fileId: number | null, signal?: AbortSignal): Promise<PricingRecord[]> {
  const { data } = await api.get<PricingRecord[]>("/admin/pricing/records", {
    params: fileId === null ? {} : { file_id: fileId },
    signal,
  });
  return data;
}

export async function saveDraft(sheet: PricingSheetInput): Promise<PricingRecord> {
  const { data } = await api.post<PricingRecord>("/admin/pricing/draft", { sheet });
  return data;
}

export async function saveToFile(target: FileTarget, sheet: PricingSheetInput): Promise<PricingRecord> {
  const { data } = await api.post<PricingRecord>("/admin/pricing/file", { ...target, sheet });
  return data;
}

/** Saves the row in the file, then writes its prices to the product its code names. */
export async function saveAndApply(target: FileTarget, sheet: PricingSheetInput): Promise<ApplyResult> {
  const { data } = await api.post<ApplyResult>("/admin/pricing/apply-to-product", { ...target, sheet });
  return data;
}

export async function deletePricingRecord(id: UUID): Promise<void> {
  await api.delete(`/admin/pricing/records/${id}`);
}

export async function deletePricingFile(id: number): Promise<void> {
  await api.delete(`/admin/pricing/files/${id}`);
}
