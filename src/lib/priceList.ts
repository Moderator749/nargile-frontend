import { api } from "@/lib/api";
import type { CatalogPrice, SegmentType, UUID } from "@/types";

/*
 * The B2B price catalogue ("Fiyat Kataloğu İndir"): which price groups an
 * account may put in a catalogue for its own customers, the server call that
 * prices it, and the hand-off from the catalog page to the tab that prints it.
 *
 * The server enforces the same table (PRICE_LIST_GROUPS in
 * app/api/v1/products.py); this one only decides what the dialog offers.
 */

export type B2BSegment = "DEALER" | "WHOLESALE" | "CAFE";

export const CATALOG_GROUP_LABELS: Record<SegmentType, string> = {
  DEALER: "Bayi",
  WHOLESALE: "Toptan",
  CAFE: "Kafe",
  RETAIL: "Perakende",
};

/** Bayi picks one of three, Toptan one of two; Kafe always gets its own price and retail. */
export const CATALOG_CHOICES: Record<B2BSegment, { pick: SegmentType[] } | { fixed: SegmentType[] }> = {
  DEALER: { pick: ["WHOLESALE", "CAFE", "RETAIL"] },
  WHOLESALE: { pick: ["CAFE", "RETAIL"] },
  CAFE: { fixed: ["CAFE", "RETAIL"] },
};

export const isB2BSegment = (code: SegmentType | null | undefined): code is B2BSegment =>
  code === "DEALER" || code === "WHOLESALE" || code === "CAFE";

/** The most products one catalogue takes (the server's limit too). */
export const PRICE_LIST_MAX = 200;

export interface PriceListItem {
  product_id: UUID;
  code: string;
  name: string;
  image_url: string | null;
  /** Per requested group the product is sold to; in TRY. */
  prices: Partial<Record<SegmentType, CatalogPrice>>;
}

export async function fetchPriceList(productIds: UUID[], groups: SegmentType[], signal?: AbortSignal): Promise<PriceListItem[]> {
  const { data } = await api.post<PriceListItem[]>("/products/price-list", { product_ids: productIds, groups }, { signal });
  return data;
}

// ── Hand-off to the printing tab ─────────────────────────────────────────────
// A catalogue can hold 200 products, too many ids for a link, so the request
// waits in localStorage under a one-off key the new tab is opened with.

export interface PriceCatalogRequest {
  productIds: UUID[];
  groups: SegmentType[];
  /** The page header's collection line: the category, the search, or "Tüm ürünler". */
  collection: string;
}

const PREFIX = "price-catalog:";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function storeCatalogRequest(request: PriceCatalogRequest): string {
  const key = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  try {
    // Yesterday's hand-offs are no use to anyone.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX) && Date.now() - parseInt(k.slice(PREFIX.length, PREFIX.length + 8), 36) > MAX_AGE_MS) {
        localStorage.removeItem(k);
      }
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(request));
  } catch {
    // Storage blocked: the new tab says so.
  }
  return key;
}

export function readCatalogRequest(key: string): PriceCatalogRequest | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as PriceCatalogRequest) : null;
  } catch {
    return null;
  }
}
