import type { Metadata } from "next";

import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import { DealsGrid } from "@/components/catalog/DealsGrid";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEALS_HREF } from "@/lib/flashSale";
import { PAGE_CONTAINER } from "@/lib/layout";
import { getI18n } from "@/lib/i18n/server";
import { breadcrumbJsonLd, pageMetadata, productListJsonLd, type Breadcrumb } from "@/lib/seo";
import { getBrands, getCategories, getFlashSaleProducts } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { resolveNav } from "@/lib/storefrontNav";

// Per request, like the homepage: a deal must show the moment it starts and
// leave the moment the admin switches it off.
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n();
  return pageMetadata({ title: t.nav.deals, description: t.meta.dealsDescription, href: DEALS_HREF, locale, locales: "all" });
}

export default async function DealsPage() {
  const [deals, categories, brands, home, { locale, t }] = await Promise.all([
    getFlashSaleProducts(),
    getCategories(),
    getBrands(),
    getHomepage(),
    getI18n(),
  ]);
  const TITLE = t.nav.deals;
  const BREADCRUMBS: Breadcrumb[] = [
    { name: t.nav.home, href: "/" },
    { name: TITLE, href: DEALS_HREF },
  ];
  const products = deals ?? [];

  return (
    <main className="flex flex-1 flex-col bg-white text-foreground dark:bg-background">
      <JsonLd data={breadcrumbJsonLd(BREADCRUMBS, locale)} />
      {products.length > 0 && <JsonLd data={productListJsonLd(products, DEALS_HREF, locale)} />}
      {/* Laid out as a catalog page: Kategoriler open beside the grid on
          arrival (see lib/sidebar), the catalog's toolbar above it. */}
      <div className={`${PAGE_CONTAINER} py-8 md:py-10 lg:flex lg:items-start`}>
        <CategorySidebar items={resolveNav(home.navigation.sidebar, categories ?? [], brands ?? [])} fit />
        <div className="min-w-0 flex-1">
          <CatalogHeading title={TITLE} breadcrumbs={BREADCRUMBS} />
          <DealsGrid initialProducts={products} categories={categories ?? []} />
        </div>
      </div>
    </main>
  );
}
