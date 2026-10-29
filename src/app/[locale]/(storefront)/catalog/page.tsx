import type { Metadata } from "next";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { getBrands, getCategories, getPublicProducts } from "@/lib/server/catalog";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

// Re-render the public catalog at most once a day (matches CATALOG_REVALIDATE;
// admin edits refresh it immediately). A literal: segment config must be static.
export const revalidate = 86400;

// One canonical for the catalog whatever the query string says: a search
// (?q=…) or a filter is the same page to a crawler, never a page of its own.
export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMetadata({
    title: t.meta.catalogPageTitle,
    description: t.meta.catalogDescription,
    href: "/catalog",
    locale,
    locales: "all",
  });
}

export default async function CatalogPage() {
  const [categories, products, brands, { t }] = await Promise.all([
    getCategories(),
    getPublicProducts(),
    getBrands(),
    getI18n(),
  ]);

  return (
    <CatalogScreen
      title={t.meta.catalogHeading}
      breadcrumbs={[
        { name: t.nav.crumbHome, href: "/" },
        { name: t.nav.catalog, href: "/catalog" },
      ]}
      categories={categories ?? []}
      activeCategory={null}
      products={products}
      brands={brands ?? []}
      searchable
    />
  );
}
