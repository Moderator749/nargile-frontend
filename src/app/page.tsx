import type { Metadata } from "next";

import { AdvantagesSection } from "@/components/home/AdvantagesSection";
import { CatalogShowcase } from "@/components/home/CatalogShowcase";
import { CorporateTrust } from "@/components/home/CorporateTrust";
import { BrandTicker } from "@/components/home/BrandTicker";
import { DealsFunnel } from "@/components/home/DealsFunnel";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PromoGrid } from "@/components/home/PromoGrid";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { FEATURED_PRODUCTS_COUNT } from "@/lib/config";
import { productListJsonLd } from "@/lib/seo";
import { FALLBACK_SLIDE, meets, promoRows, toHeroSlide } from "@/lib/home";
import {
  getBrands,
  getCategories,
  getFlashSaleProducts,
  getHomeContent,
  getPublicProducts,
  getTileArtwork,
} from "@/lib/server/catalog";
import { SHOWCASE_TILES, resolveShowcase } from "@/lib/showcase";
import { SIDEBAR_NAV, resolveNav } from "@/lib/storefrontNav";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Rendered per request so a flash sale that starts or ends is reflected at once
// (its countdowns and the slides that depend on one). Catalog fetches keep their
// own revalidate window in the data cache. The special-day strip is read in the
// browser from the layout, so it is current whatever this says.
export const revalidate = 0;

/** Category whose products are featured on the homepage. */
const FEATURED_CATEGORY_SLUG = "nargile-takimlari";

const TITLE = `${SITE_NAME} — Endüstriyel Toptan & Perakende Nargile Çözümleri`;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: TITLE },
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: { title: TITLE, description: DEFAULT_DESCRIPTION, url: "/" },
  };
}

export default async function HomePage() {
  const [categories, featured, flashSales, brands, content, artwork] = await Promise.all([
    getCategories(),
    getPublicProducts(FEATURED_CATEGORY_SLUG, FEATURED_PRODUCTS_COUNT),
    getFlashSaleProducts(),
    getBrands(),
    getHomeContent(),
    // One photo per showcase tile; cached with the rest of the catalog reads.
    Promise.all(SHOWCASE_TILES.map(getTileArtwork)),
  ]);
  const allCategories = categories ?? [];
  const sidebar = resolveNav(SIDEBAR_NAV, allCategories, brands ?? []);
  const showcase = resolveShowcase(allCategories, brands ?? [], artwork);
  // The deals funnel is the page's only deals section, and it is there only
  // when there is a deal to put in it.
  const deals = (flashSales ?? []).filter((p) => p.is_opportunity);

  // Content tied to flash sales (a slide, the "Şok" promo box) only shows while one is live.
  // Managed in /admin/hero, /admin/promos and /admin/advantages.
  // Any colour of any product carrying a claimable sale is enough.
  const has = { flash_sales: (flashSales ?? []).some((p) => p.variants.some((v) => v.flash_sale)) };
  const cmsSlides = (content?.slides ?? []).filter((s) => meets(s.requires, has)).map(toHeroSlide);
  const slides = cmsSlides.length > 0 ? cmsSlides : [FALLBACK_SLIDE];
  const rows = promoRows(content?.promos ?? [], has);

  return (
    <>
      {/* Follows the visitor's theme; the slider and advantage tiles are always dark,
          the brand strip always light. */}
      <main className="flex flex-1 flex-col bg-background text-foreground">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "tr-TR",
          }}
        />
        {featured && featured.length > 0 && (
          <JsonLd
            data={productListJsonLd(featured, "/", new Map(allCategories.map((c) => [c.id, c])))}
          />
        )}

        {/* Module 4: the category column, open at all times, with the hero and
            the showcase beside it — the wireframe's shape. */}
        <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 sm:pt-4 lg:flex lg:items-start">
          <CategorySidebar items={sidebar} />
          <div className="min-w-0 flex-1 space-y-4">
            {/* Module 5: hero slider. */}
            <HeroSlider slides={slides} />
            {/* Modules 6 & 7: smart promo grids. */}
            <PromoGrid boxes={rows[0]} label="Öne çıkan kampanyalar" />
            <PromoGrid boxes={rows[1]} label="Koleksiyonlar" />
          </div>
        </div>

        {/* Module 9: "Fırsatları Kaçırma" — the deals, and the page's only
            deals section. It renders nothing when none are running. */}
        <DealsFunnel initialProducts={deals} categories={allCategories} />

        {/* Module 9b: the brand ticker between the deals and the gallery. No
            heading — the names are the content. */}
        <BrandTicker />

        {/* Module 10: the catalog as a gallery, in place of the old
            "Öne çıkanlar" carousel. */}
        <CatalogShowcase tiles={showcase} />

        {/* Module 11: the advantages, from lib/advantages. */}
        <AdvantagesSection />

        {/* Module 12: the corporate close, between the advantages and the footer. */}
        <CorporateTrust />
      </main>
    </>
  );
}
