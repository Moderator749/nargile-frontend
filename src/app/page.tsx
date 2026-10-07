import type { Metadata } from "next";

import { DismissibleAnnouncement } from "@/components/banner/DismissibleAnnouncement";
import { AdvantagesSection } from "@/components/home/AdvantagesSection";
import { BrandFilters } from "@/components/home/BrandFilters";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FlashSales } from "@/components/home/FlashSales";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PromoGrid } from "@/components/home/PromoGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { FEATURED_PRODUCTS_COUNT } from "@/lib/config";
import { productListJsonLd } from "@/lib/seo";
import { getActiveAnnouncement } from "@/lib/server/announcement";
import { FALLBACK_SLIDE, meets, promoRows, toHeroSlide } from "@/lib/home";
import { getBrands, getCategories, getFlashSaleProducts, getHomeContent, getPublicProducts } from "@/lib/server/catalog";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Rendered per request so the special-day banner (fetched with no-store) is always
// current. Catalog fetches keep their own revalidate window in the data cache.
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
  const [categories, featured, announcement, flashSales, brands, content] = await Promise.all([
    getCategories(),
    getPublicProducts(FEATURED_CATEGORY_SLUG, FEATURED_PRODUCTS_COUNT),
    getActiveAnnouncement(),
    getFlashSaleProducts(),
    getBrands(),
    getHomeContent(),
  ]);
  const allCategories = categories ?? [];
  const featuredCategory = allCategories.find((c) => c.slug === FEATURED_CATEGORY_SLUG);

  // Content tied to flash sales (a slide, the "Şok" promo box) only shows while one is live.
  // Managed in /admin/hero, /admin/promos and /admin/advantages.
  const has = { flash_sales: (flashSales ?? []).some((p) => p.variants[0]?.flash_sale) };
  const cmsSlides = (content?.slides ?? []).filter((s) => meets(s.requires, has)).map(toHeroSlide);
  const slides = cmsSlides.length > 0 ? cmsSlides : [FALLBACK_SLIDE];
  const rows = promoRows(content?.promos ?? [], has);

  return (
    <>
      {/* Module 1: special-day ticker, above the header (see DismissibleAnnouncement). */}
      {announcement && <DismissibleAnnouncement announcement={announcement} />}
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

        <div className="mx-auto w-full max-w-7xl space-y-4 px-4 pt-4 sm:px-6 sm:pt-6">
          {/* Modules 3 & 5: brand/type filters beside the hero slider. */}
          <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="order-2 lg:order-1">
              <BrandFilters
                brands={brands ?? []}
                types={featuredCategory ? allCategories.filter((c) => c.parent_id === featuredCategory.id) : []}
              />
            </div>
            <div className="order-1 lg:order-2">
              <HeroSlider slides={slides} />
            </div>
          </div>
          {/* Modules 6 & 7: smart promo grids. */}
          <PromoGrid boxes={rows[0]} label="Öne çıkan kampanyalar" />
          <PromoGrid boxes={rows[1]} label="Koleksiyonlar" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* Module 9: flash sales with countdowns. */}
          <FlashSales initialProducts={flashSales} categories={allCategories} />
        </div>

        {/* Brand marquee, right below the deals (managed in /admin/brands). */}
        <BrandMarquee brands={brands ?? []} />

        {featuredCategory && (
          <FeaturedProducts category={featuredCategory} categories={allCategories} initialProducts={featured} />
        )}

        <AdvantagesSection advantages={content?.advantages ?? []} />
      </main>
    </>
  );
}
