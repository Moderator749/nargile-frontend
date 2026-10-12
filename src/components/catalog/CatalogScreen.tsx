import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import { AdvantagesSection } from "@/components/home/AdvantagesSection";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, productListJsonLd, type Breadcrumb } from "@/lib/seo";
import { getHomepage } from "@/lib/server/homepage";
import { sidebarNav } from "@/lib/storefrontNav";
import type { Brand, CatalogProduct, Category } from "@/types";

interface CatalogScreenProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  categories: Category[];
  activeCategory: Category | null;
  /** Anonymous first page from the server; null if the API was unreachable. */
  products: CatalogProduct[] | null;
  /** For the category column's brand rows; empty is fine (they fall back to a search). */
  brands?: Brand[];
}

/**
 * Server-rendered catalog shell: heading and JSON-LD, around the interactive
 * grid. The category column and the advantage cards are the ones edited in
 * "Ana Sayfa Düzenleme"; the homepage's on/off switches do not apply here.
 */
export async function CatalogScreen({
  title,
  breadcrumbs,
  categories,
  activeCategory,
  products,
  brands = [],
}: CatalogScreenProps) {
  const home = await getHomepage();
  const pageHref = breadcrumbs[breadcrumbs.length - 1].href;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      {products && products.length > 0 && (
        <JsonLd data={productListJsonLd(products, pageHref, categoryById)} />
      )}

      <CatalogView
        categories={categories}
        activeCategory={activeCategory}
        initialProducts={products}
        heading={<CatalogHeading title={title} breadcrumbs={breadcrumbs} />}
        sidebar={<CategorySidebar items={sidebarNav(home.navigation, categories, brands)} />}
      />

      {/* The same eight cards the homepage closes with, below the grid and
          clear of the category column: the terms are as worth reading at the
          end of a category as on the way in. */}
      <div className="mb-12 mt-6 md:mb-16 md:mt-8">
        <AdvantagesSection content={home.advantages} />
      </div>
    </main>
  );
}
