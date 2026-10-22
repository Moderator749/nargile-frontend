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
  /** `erp_percent` on each: its "uygulanacak fiyat", when none is typed, is its calculated price plus this. */
  columns: {
    label: string;
    segment: PricingSegment | null;
    percent: DecimalString;
    desired: DecimalString | null;
    erp_percent: DecimalString | null;
  }[];
  retail: { percent: DecimalString; vat_rate: DecimalString; desired: DecimalString | null; erp_percent: DecimalString | null };
  /** Between the classes and retail, shown as retail is, retail building on it; never sent to the site. */
  extras: { label: string; percent: DecimalString; desired: DecimalString | null; erp_percent: DecimalString | null }[];
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
  /** "ERP Fiyatı (%)": the price, unless typed, is the calculated one plus this. Absent on older rows. */
  erp_percent?: DecimalString | null;
}

export interface StoredSheet {
  vat_mode: VatMode;
  currency: PricingCurrency;
  cost: DecimalString;
  columns: StoredColumn[];
  /** After VAT; `before_vat` is the markup step on its own. */
  retail: StoredColumn & { vat_rate: DecimalString; before_vat?: DecimalString };
  /** "Özel Fiyat"…, before retail; absent on rows saved before there were any. */
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

/** A column's figures below its percent: calculated, with its ERP percent, and the price it sends (typed, else that). */
export interface ComputedPrice {
  computed: number | null;
  /** The calculated value plus the column's ERP percent (the calculated value without one). */
  auto: number | null;
  price: number | null;
}

export interface ComputedSheet {
  columns: ComputedPrice[];
  /** Between the classes and retail, each shown as retail is: after VAT, with its step before VAT. */
  extras: (ComputedPrice & { beforeVat: number | null })[];
  /** Retail after VAT ("KDV dahil perakende"), calculated and applied. */
  retail: ComputedPrice;
  /** The retail markup step before VAT is added (equal to `computed` on an after-VAT sheet). */
  retailBeforeVat: number | null;
  /** USD/EUR sheets: retail × the typed rate. */
  tryPrice: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

type Typed = { percent: number | null; desired: number | null; erp: number | null };

/** A calculated value's own figures: its ERP percent added (none or 0: as it is), a typed price winning. */
function priced(computed: number | null, { desired, erp }: Typed): ComputedPrice {
  const auto = computed === null ? null : round2(erp ? computed * (1 + erp / 100) : computed);
  return { computed: computed === null ? null : round2(computed), auto, price: desired ?? auto };
}

/**
 * The calculated row is one unbroken chain: each column is the previous
 * *calculated* value plus its percent. A typed "uygulanacak fiyat" becomes that
 * column's price but never feeds the chain. Null propagates: a column after an
 * unusable one has nothing to stand on.
 *
 * After the classes come the extras ("Özel Fiyat"), then retail, both shown
 * after VAT while the chain runs on before VAT, so VAT is added once: retail
 * builds on the extra's step before VAT. An extra left without a percent is
 * not sent, and is passed over here too: retail then builds on the step
 * before it. Each column's "ERP Fiyatı (%)" makes its "uygulanacak fiyat",
 * when none is typed, its calculated value plus that percent.
 */
export function computeSheet(input: {
  cost: number | null;
  columns: Typed[];
  extras?: Typed[];
  retail: Typed & { vatRate: number | null };
  vatMode: VatMode;
  currency: PricingCurrency;
  usdRate: number | null;
  eurRate: number | null;
}): ComputedSheet {
  const r = input.retail;
  const factor = r.vatRate !== null ? 1 + r.vatRate / 100 : null;
  const withVat = (v: number | null) =>
    v === null ? null : input.vatMode === "INCL" ? v : factor === null ? null : v * factor;

  let previous = input.cost;
  const columns = input.columns.map((typed) => {
    const computed = previous !== null && typed.percent !== null ? previous * (1 + typed.percent / 100) : null;
    previous = computed;
    return priced(computed, typed);
  });
  const extras = (input.extras ?? []).map((typed) => {
    if (typed.percent === null) return { computed: null, auto: null, price: null, beforeVat: null };
    const step = previous === null ? null : previous * (1 + typed.percent / 100);
    previous = step;
    return { ...priced(withVat(step), typed), beforeVat: step === null ? null : round2(step) };
  });
  // Retail is the shelf price, after VAT: VAT is added here when the sheet's
  // cost (and so its chain) is before VAT.
  const beforeVat = previous !== null && r.percent !== null ? previous * (1 + r.percent / 100) : null;
  const retail = priced(withVat(beforeVat), r);
  const rate = input.currency === "USD" ? input.usdRate : input.currency === "EUR" ? input.eurRate : null;
  return {
    columns,
    extras,
    retail,
    retailBeforeVat: beforeVat === null ? null : round2(beforeVat),
    tryPrice: retail.price !== null && rate ? round2(retail.price * rate) : null,
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
