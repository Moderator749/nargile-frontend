import { CatalogHeading, CatalogIntro } from "@/components/catalog/CatalogHeading";
import { CategoryClosing } from "@/components/catalog/CategoryClosing";
import { CategoryFamilyNav } from "@/components/catalog/CategoryFamilyNav";
import { SeoIntro } from "@/components/home/SeoIntro";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLocale } from "@/lib/i18n/server";
import { breadcrumbJsonLd, productListJsonLd, type Breadcrumb } from "@/lib/seo";
import type { CategoryFamily } from "@/lib/categories";
import { getHomepage } from "@/lib/server/homepage";
import { resolveNav } from "@/lib/storefrontNav";
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
  /** A brand page: the grid shows this brand's search instead of a category. */
  brand?: Brand;
  /** The page's introduction under its heading; clamped, the full text in the page. */
  intro?: string | null;
  /** A category's own passage at the page's foot, in place of the shop's "Alt SEO Metni". */
  closing?: { title: string; html: string | null } | null;
  /** The whole catalog, where the header's search lands (see CatalogHeading). */
  searchable?: boolean;
  /** A category's group and its kinds, as links under the heading. */
  family?: CategoryFamily | null;
}

/**
 * Server-rendered catalog shell: heading and JSON-LD, around the interactive
 * grid. The category column and the closing paragraphs are the ones edited in
 * "Ana Sayfa Düzenleme"; the homepage's on/off switches do not apply here.
 */
export async function CatalogScreen({
  title,
  breadcrumbs,
  categories,
  activeCategory,
  products,
  brands = [],
  brand,
  intro,
  closing,
  searchable,
  family,
}: CatalogScreenProps) {
  const [home, locale] = await Promise.all([getHomepage(), getLocale()]);
  const pageHref = breadcrumbs[breadcrumbs.length - 1].href;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    // White under the grid; the grey header and category column frame it.
    <main className="flex flex-1 flex-col bg-white text-foreground dark:bg-background">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, locale)} />
      {products && products.length > 0 && (
        <JsonLd data={productListJsonLd(products, pageHref, categoryById, locale)} />
      )}

      <CatalogView
        categories={categories}
        activeCategory={activeCategory}
        initialProducts={products}
        brand={brand ? { name: brand.name, searchTerm: brand.search_term } : undefined}
        heading={
          <>
            <CatalogHeading title={title} breadcrumbs={breadcrumbs} searchable={searchable} compact />
            {family && activeCategory && <CategoryFamilyNav family={family} current={activeCategory.slug} />}
          </>
        }
        intro={intro ? <CatalogIntro title={title} html={intro} /> : undefined}
        sidebar={<CategorySidebar items={resolveNav(home.navigation.sidebar, categories, brands)} fit />}
      />

      {/* The shop in a few plain paragraphs, straight under the grid (its own
          top padding is the gap), so every listing page ends the same way
          above the footer. A category's own
          description is not repeated here: it is in the grid's column, under
          its heading (under the products on a phone). */}
      {closing ? <CategoryClosing title={closing.title} html={closing.html} /> : <SeoIntro copy={home.seo_intro} />}
    </main>
  );
}
