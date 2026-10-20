import type { Metadata } from "next";

import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import { DealsGrid } from "@/components/catalog/DealsGrid";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEALS_HREF } from "@/lib/flashSale";
import { PAGE_CONTAINER } from "@/lib/layout";
import { breadcrumbJsonLd, pageMetadata, productListJsonLd, type Breadcrumb } from "@/lib/seo";
import { getBrands, getCategories, getFlashSaleProducts } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { resolveNav } from "@/lib/storefrontNav";

// Per request, like the homepage: a deal must show the moment it starts and
// leave the moment the admin switches it off.
export const revalidate = 0;

const TITLE = "Fırsat Ürünleri";
const DESCRIPTION =
  "Nargile takımları, aksesuarlar ve kömürde süreli fırsatlar: indirimli fiyatlar, stoklarla sınırlı kampanyalar.";

const BREADCRUMBS: Breadcrumb[] = [
  { name: "Ana Sayfa", href: "/" },
  { name: TITLE, href: DEALS_HREF },
];

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, href: DEALS_HREF });

export default async function DealsPage() {
  const [deals, categories, brands, home] = await Promise.all([
    getFlashSaleProducts(),
    getCategories(),
    getBrands(),
    getHomepage(),
  ]);
  const products = deals ?? [];
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  return (
    <main className="flex flex-1 flex-col bg-white text-foreground dark:bg-background">
      <JsonLd data={breadcrumbJsonLd(BREADCRUMBS)} />
      {products.length > 0 && <JsonLd data={productListJsonLd(products, DEALS_HREF, categoryById)} />}
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
