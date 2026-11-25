import { api } from "@/lib/api";
import type { ProductErpCatalog } from "@/lib/erpCatalog";
import type { DecimalString, ISODateTime, UUID } from "@/types";

import type { PricingCurrency, VatMode } from "./pricingMath";

/*
 * "Fiyat Hesaplama Cetveli": the worksheet's shapes, its arithmetic, and the
 * calls that save it and push it to a product. The arithmetic mirrors
 * `app/services/pricing_sheet.py` so the sheet updates as the admin types; the
 * server does the same sums again on save.
 */

export type PricingSegment = "DEALER" | "WHOLESALE" | "CAFE";
export type { PricingCurrency, VatMode } from "./pricingMath";

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
  /** `erp_price` on each: the base its "uygulanacak fiyat" is worked out from, in place of the calculated price. */
  columns: {
    label: string;
    segment: PricingSegment | null;
    percent: DecimalString;
    desired: DecimalString | null;
    erp_price: DecimalString | null;
  }[];
  retail: { percent: DecimalString; vat_rate: DecimalString; desired: DecimalString | null; erp_price: DecimalString | null };
  /** Between the classes and retail, shown as retail is, retail building on it; never sent to the site. */
  extras: { label: string; percent: DecimalString; desired: DecimalString | null; erp_price: DecimalString | null }[];
  /** "Uygulanacak oran (%)": added to the classes' base for their price (never the extras' or retail's), unless typed. */
  applied_percent: DecimalString | null;
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
  /** "ERP fiyatı": the base typed in place of the calculated price. Absent on older rows. */
  erp_price?: DecimalString | null;
}

export interface StoredSheet {
  vat_mode: VatMode;
  currency: PricingCurrency;
  cost: DecimalString;
  columns: StoredColumn[];
  /** After VAT; `before_vat` is the markup step on its own. */
  retail: StoredColumn & { vat_rate: DecimalString; before_vat?: DecimalString };
  /** "Mağaza Fiyatı"…, before retail; absent on rows saved before there were any. */
  extras?: (StoredColumn & { vat_rate: DecimalString; before_vat: DecimalString })[];
  usd_rate: DecimalString | null;
  eur_rate: DecimalString | null;
  try_price: DecimalString | null;
  final_try: DecimalString | null;
  /** "Uygulanacak oran (%)". Absent on older rows. */
  applied_percent?: DecimalString | null;
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
  /** Last saved; after `applied_at`, the site has its earlier version's prices. The lists go by it. */
  updated_at: ISODateTime;
  /**
   * The product's "ERP ve Katalog Fiyatları" (its sheet, under "Fiyat
   * Tablosu") and its price table, looked up by the code — for the price
   * catalogue. Only on the lists; null when the code names no product.
   */
  product_erp?: ProductErpCatalog | null;
  /** Applied, but a later record was applied to the same product since: no longer the site's prices. */
  superseded?: boolean;
  /**
   * Applied and still the product's record, but these groups' live prices
   * differ from what it applied (changed in the product form, say). Only on
   * the lists; null or absent when nothing differs.
   */
  site_drift?: string[] | null;
}

export interface PricingFile {
  id: number;
  name: string;
  created_at: ISODateTime;
  /** The last time a row was saved into it; the list is newest first by this. */
  updated_at: ISODateTime;
  record_count: number;
  /** The distinct product codes of its rows, so the file list can be searched by code. */
  product_codes?: string[];
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
// In ./pricingMath, free of the API client so `npm test` can read it.

export { computeSheet, decimalText, parseAmount, round2, sheetProblem, unreadable, VAT_RATES, wholeLira } from "./pricingMath";
export type { TypedSheet } from "./pricingMath";
export type { ComputedPrice, ComputedSheet } from "./pricingMath";

// ── API: "Taslaklar" and "Dosyalar" ─────────────────────────────────────────

export async function fetchPricingFiles(signal?: AbortSignal): Promise<PricingFile[]> {
  const { data } = await api.get<PricingFile[]>("/admin/pricing/files", { signal });
  return data;
}

/** A file's rows, or the drafts — the rows in no file — when `fileId` is null. */
export async function fetchPricingRecords(fileId: number | null, signal?: AbortSignal): Promise<PricingRecord[]> {
  const { data } = await api.get<PricingRecord[]>("/admin/pricing/records", {
    params: fileId === null ? {} : { file_id: fileId },
    signal,
  });
  return data;
}

// ── API: the calculator's save ──────────────────────────────────────────────

export interface SaveResult {
  record: PricingRecord;
  /** Written over an existing row (silently, or as chosen), not added. */
  overwritten: boolean;
  /** What "Kaydet ve Siteye Uygula" wrote to the product. */
  applied: Omit<ApplyResult, "record"> | null;
}

export interface SaveOptions {
  /** The row the sheet was loaded from (or last saved): saved over while its code is that row's. */
  recordId?: UUID | null;
  /** "auto": the button; "overwrite": over `overwriteId`; "new": a new row. */
  mode?: "auto" | "overwrite" | "new";
  overwriteId?: UUID;
  /** Where the row goes: Taslaklar, or a file (an existing one, or a new one by name). Omitted: a new row in Taslaklar, a row written over where it is. */
  place?: { kind: "draft" } | { kind: "file"; target: FileTarget };
  apply?: boolean;
}

/**
 * The calculator's save, whichever button. "auto" saves over the loaded row
 * while its code is unchanged, and adds a row for a code saved nowhere; a code
 * saved anywhere else answers 409 — read its rows with `sameCodeRows`.
 */
export async function savePricing(sheet: PricingSheetInput, options: SaveOptions = {}): Promise<SaveResult> {
  const { data } = await api.post<SaveResult>("/admin/pricing/save", {
    sheet,
    record_id: options.recordId ?? null,
    mode: options.mode ?? "auto",
    overwrite_id: options.overwriteId ?? null,
    place: options.place?.kind ?? "keep",
    ...(options.place?.kind === "file" ? options.place.target : {}),
    apply: options.apply ?? false,
  });
  return data;
}

/** The rows a refused save's code is already saved as (its 409), newest first; null for any other error. */
export function sameCodeRows(err: unknown): PricingRecord[] | null {
  const response = (err as { response?: { status?: number; data?: { detail?: { matches?: PricingRecord[] } } } })?.response;
  return response?.status === 409 && Array.isArray(response.data?.detail?.matches) ? response.data.detail.matches : null;
}

/** Every saved row, draft or in a file, newest first (the price catalogue finds its rows here by id). */
export async function fetchAllPricingRecords(signal?: AbortSignal): Promise<PricingRecord[]> {
  const { data } = await api.get<PricingRecord[]>("/admin/pricing/records", { params: { all: true }, signal });
  return data;
}

export async function deletePricingRecord(id: UUID): Promise<void> {
  await api.delete(`/admin/pricing/records/${id}`);
}

export async function deletePricingFile(id: number): Promise<void> {
  await api.delete(`/admin/pricing/files/${id}`);
}

/** "Seçilenleri Sil": those rows only, never their file. Resolves to how many went. */
export async function deletePricingRecords(ids: UUID[]): Promise<number> {
  const { data } = await api.post<{ count: number }>("/admin/pricing/records/delete", { ids });
  return data.count;
}

/** "Taşı": the rows into an existing file, or a new one by that name. */
export async function movePricingRecords(ids: UUID[], target: FileTarget): Promise<{ count: number; file: PricingFile }> {
  const { data } = await api.post<{ count: number; file: PricingFile }>("/admin/pricing/records/move", { ids, ...target });
  return data;
}

/** "Yeniden Adlandır"; a name another file has is refused (409). */
export async function renamePricingFile(id: number, name: string): Promise<PricingFile> {
  const { data } = await api.patch<PricingFile>(`/admin/pricing/files/${id}`, { name });
  return data;
}

/** "Çoğalt": a new file with a copy of every row; no name gives "<name> (kopya)". */
export async function duplicatePricingFile(id: number, name?: string): Promise<PricingFile> {
  const { data } = await api.post<PricingFile>(`/admin/pricing/files/${id}/duplicate`, name ? { name } : {});
  return data;
}

