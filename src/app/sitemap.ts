import type { MetadataRoute } from "next";

import { productHref } from "@/lib/seo";
import { getCategories, getPublicProducts } from "@/lib/server/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/** Every public product, page by page (the API caps a page at 100). */
async function allProductIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let skip = 0; skip < 5000; skip += 100) {
    const page = await getPublicProducts(undefined, 100, skip);
    if (!page) break;
    ids.push(...page.map((p) => p.id));
    if (page.length < 100) break;
  }
  return ids;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, productIds] = await Promise.all([getCategories(), allProductIds()]);
  return [
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 1 },
    ...(categories ?? []).map((c) => ({
      url: `${SITE_URL}/catalog/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...productIds.map((id) => ({
      url: `${SITE_URL}${productHref(id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
