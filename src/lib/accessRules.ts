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

export { categoryTree, customerLabel, normalizeRoute, routeCovers, sameRules } from "./accessRulesMath";

// ── Per customer ("Cari bazında") ────────────────────────────────────────────

export interface RuleCustomer {
  id: string;
  email: string;
  full_name: string | null;
  company_title: string | null;
  phone: string | null;
  segment: string | null;
  rule_count: number;
}

export interface CustomerRules {
  customer: RuleCustomer;
  rules: TierRules;
}

/** The customers that have rules of their own, most first. */
export async function fetchRuleCustomers(signal?: AbortSignal): Promise<RuleCustomer[]> {
  const { data } = await api.get<RuleCustomer[]>("/admin/access-rules/customers", { signal });
  return data;
}

export async function fetchCustomerRules(userId: string, signal?: AbortSignal): Promise<CustomerRules> {
  const { data } = await api.get<CustomerRules>(`/admin/access-rules/customers/${userId}`, { signal });
  return data;
}

/** One customer's whole set: hidden from them on top of their group's rules. */
export async function saveCustomerRules(userId: string, rules: TierRules): Promise<CustomerRules> {
  const { data } = await api.put<CustomerRules>(`/admin/access-rules/customers/${userId}`, rules);
  return data;
}
