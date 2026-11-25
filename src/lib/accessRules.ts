import { api } from "@/lib/api";

/*
 * "Grup Erişim Kısıtlamaları": which customer group (or a visitor who is not
 * signed in) may not see which categories, brands and storefront pages. The
 * backend enforces them on every storefront request (app/services/tier_access);
 * the storefront only shows the notice in their place.
 */

export type AccessTier = "GUEST" | "RETAIL" | "CAFE" | "WHOLESALE" | "DEALER";

export const ACCESS_TIERS: readonly { tier: AccessTier; label: string; hint: string }[] = [
  { tier: "GUEST", label: "Ziyaretçi", hint: "Giriş yapmamış herkes." },
  { tier: "RETAIL", label: "Perakende", hint: "Bireysel üyeler." },
  { tier: "CAFE", label: "Kafe", hint: "Kafe fiyat grubundaki hesaplar." },
  { tier: "WHOLESALE", label: "Toptan", hint: "Toptan fiyat grubundaki hesaplar." },
  { tier: "DEALER", label: "Bayi", hint: "Bayi fiyat grubundaki hesaplar." },
];

/** Storefront pages an admin is likely to close, offered as one-click choices. */
export const SUGGESTED_ROUTES: readonly { path: string; label: string }[] = [
  { path: "/firsat-urunleri", label: "Fırsat Ürünleri" },
  { path: "/fiyat-katalogu", label: "Fiyat Kataloğu" },
  { path: "/catalog", label: "Tüm ürünler / arama" },
  { path: "/magazalar", label: "Mağazalar" },
  { path: "/blog", label: "Blog" },
];

export interface TierRules {
  category_ids: number[];
  brand_ids: number[];
  routes: string[];
}

import type { AccessOption } from "./accessRulesMath";

export type { AccessOption } from "./accessRulesMath";

export interface AccessRules {
  tiers: Record<AccessTier, TierRules>;
  categories: AccessOption[];
  brands: AccessOption[];
}

export async function fetchAccessRules(signal?: AbortSignal): Promise<AccessRules> {
  const { data } = await api.get<AccessRules>("/admin/access-rules", { signal });
  return data;
}

export async function saveTierRules(tier: AccessTier, rules: TierRules): Promise<AccessRules> {
  const { data } = await api.put<AccessRules>(`/admin/access-rules/${tier}`, rules);
  return data;
}

export { categoryTree, normalizeRoute, routeCovers } from "./accessRulesMath";
