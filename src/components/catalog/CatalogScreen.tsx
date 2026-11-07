import { CatalogHeading, CatalogIntro } from "@/components/catalog/CatalogHeading";
import { CategoryBanner } from "@/components/catalog/CategoryBanner";
import { CategoryClosing } from "@/components/catalog/CategoryClosing";
import { CategoryDescription } from "@/components/catalog/CategoryDescription";
import { CategoryFamilyNav } from "@/components/catalog/CategoryFamilyNav";
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
  /** A brand page: the grid shows this brand's products instead of a category's. */
  brand?: Brand;
  /** Whether a brand's products came by the brand relation (else its search term, an older API). */
  brandByRelation?: boolean;
  /** A brand page's kinds of product, as chips over the grid (CatalogView). */
  groups?: { slug: string; name: string; ids: number[] }[];
  /** The page's introduction, plain muted text under its title; clamped, the full text in the page. */
  intro?: string | null;
  /** A category's description, under the grid with "Devamını Oku"; none = nothing there. */
  description?: string | null;
  /** A category's own passage at the page's foot; none = the page ends at the grid. */
  closing?: { title: string; html: string | null } | null;
  /** The whole catalog, where the header's search lands (see CatalogHeading). */
  searchable?: boolean;
  /** A category's group and its kinds, as links under the banner, over the filter bar. */
  family?: CategoryFamily | null;
  /** A category's wide banner under its heading; none = no space kept. */
  banner?: string | null;
}

/**
 * Server-rendered catalog shell: heading and JSON-LD, around the interactive
 * grid. The category column is the one edited in "Ana Sayfa Düzenleme"; the
 * homepage's on/off switches do not apply here.
 */
export async function CatalogScreen({
  title,
  breadcrumbs,
  categories,
  activeCategory,
  products,
  brands = [],
  brand,
  brandByRelation = false,
  groups,
  intro,
  description,
  closing,
  searchable,
  family,
  banner,
}: CatalogScreenProps) {
  const [home, locale] = await Promise.all([getHomepage(), getLocale()]);
  const pageHref = breadcrumbs[breadcrumbs.length - 1].href;

  return (
    // White under the grid; the grey header and category column frame it.
    <main className="flex flex-1 flex-col bg-white text-foreground dark:bg-background">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, locale)} />
      {products && products.length > 0 && (
        <JsonLd data={productListJsonLd(products, pageHref, locale)} />
      )}

      <CatalogView
        categories={categories}
        activeCategory={activeCategory}
        initialProducts={products}
        brand={brand ? { name: brand.name, searchTerm: brand.search_term, slug: brand.slug, byRelation: brandByRelation } : undefined}
        groups={groups}
        // Breadcrumb and title, the description, the banner and the family's
        // chips; then (in the grid) the filter bar and the products.
        heading={
          <>
            <CatalogHeading title={title} breadcrumbs={breadcrumbs} searchable={searchable} compact />
            {intro && <CatalogIntro title={title} html={intro} />}
            {banner && <CategoryBanner src={banner} alt={title} />}
            {family && activeCategory && <CategoryFamilyNav family={family} current={activeCategory.slug} />}
          </>
        }
        sidebar={<CategorySidebar key="sidebar" items={resolveNav(home.navigation.sidebar, categories, brands)} fit />}
      />

      {/* Under the grid (each block's own top padding is the gap): the
          category's description, then its own passage. A page with neither
          ends at the grid: the homepage's "Alt SEO Metni" is the homepage's,
          and the same guide repeated on every listing would be one text on
          fifty addresses. */}
      {description && <CategoryDescription title={title} html={description} />}
      {closing && <CategoryClosing title={closing.title} html={closing.html} />}
    </main>
  );
}
