import { CatalogHero } from "@/components/catalog/CatalogHero";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CategoryTabs } from "@/components/catalog/CategoryTabs";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, productListJsonLd, type Breadcrumb } from "@/lib/seo";
import type { CatalogProduct, Category } from "@/types";

interface CatalogScreenProps {
  title: string;
  breadcrumbs: Breadcrumb[];
  categories: Category[];
  activeCategory: Category | null;
  /** Anonymous first page from the server; null if the API was unreachable. */
  products: CatalogProduct[] | null;
}

/** Server-rendered catalog shell: hero, tabs and JSON-LD, around the interactive grid. */
export function CatalogScreen({
  title,
  breadcrumbs,
  categories,
  activeCategory,
  products,
}: CatalogScreenProps) {
  const pageHref = breadcrumbs[breadcrumbs.length - 1].href;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      {products && products.length > 0 && (
        <JsonLd data={productListJsonLd(products, pageHref, categoryById)} />
      )}

      <CatalogHero title={title} breadcrumbs={breadcrumbs} />
      <CatalogView
        categories={categories}
        activeCategory={activeCategory}
        initialProducts={products}
        tabs={<CategoryTabs categories={categories} active={activeCategory?.slug ?? null} />}
      />
    </main>
  );
}
