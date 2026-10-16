import type { Metadata } from "next";

import { AdvantagesSection } from "@/components/home/AdvantagesSection";
import { CatalogShowcase } from "@/components/home/CatalogShowcase";
import { CorporateTrust } from "@/components/home/CorporateTrust";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { BrandTicker } from "@/components/home/BrandTicker";
import { DealsFunnel } from "@/components/home/DealsFunnel";
import { FeaturedProductsShowcase } from "@/components/home/FeaturedProductsShowcase";
import { HeroAside } from "@/components/home/HeroAside";
import { HeroSlider } from "@/components/home/HeroSlider";
import { PromoSpotlight } from "@/components/home/PromoSpotlight";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { FEATURED_PRODUCTS_COUNT } from "@/lib/config";
import { brandHref, organizationJsonLd, pageMetadata, productListJsonLd, websiteJsonLd } from "@/lib/seo";
import { FALLBACK_SLIDE, meets, promoRows, toHeroSlide } from "@/lib/home";
import {
  getBrands,
  getCategories,
  getFlashSaleProducts,
  getHomeContent,
  getPublicProducts,
  getTileArtwork,
} from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { resolveShowcase, tileSlug } from "@/lib/showcase";
import { resolveNav } from "@/lib/storefrontNav";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { PAGE_CONTAINER } from "@/lib/layout";
import { displayVariant } from "@/lib/variants";
import type { CatalogProduct } from "@/types";

// Rendered per request so a flash sale that starts or ends is reflected at once
// (its countdowns and the slides that depend on one). Catalog fetches keep their
// own revalidate window in the data cache. The special-day strip is read in the
// browser from the layout, so it is current whatever this says.
export const revalidate = 0;

/** Category whose products are featured on the homepage. */
const FEATURED_CATEGORY_SLUG = "celik-takimlar";

/**
 * "Sizin İçin Seçtiklerimiz": the category each tab is drawn from, and how many
 * it shows (two rows of five on a desktop).
 *
 * TEMPORARY: there is nothing yet to rank by. No order has been placed and the
 * migrated catalog carries one creation time for every product, so neither
 * "best selling" nor "newest" means anything. Until it does, each tab is a
 * fixed category's first products; swap these for a real sort once the API
 * offers one.
 */
const PICKS = { bestsellers: FEATURED_CATEGORY_SLUG, newest: "oduman" } as const;
const PICKS_COUNT = 10;

/** A product worth showing: one with a photo and a price to put under it. */
const showable = (products: CatalogProduct[] | null, count = PICKS_COUNT) =>
  (products ?? []).filter((p) => p.image_url && p.variants.some((v) => v.price)).slice(0, count);

/**
 * "Markalarımız": one band per brand under a single heading, down the page in
 * a zig-zag (brand on the left, then the right, then the left), each on a pale
 * tint of its own colours. `brand` is the products' own brand name and the
 * term they are searched by; `slug` is its /marka page.
 */
const BRAND_SHOWCASES = [
  {
    brand: "Sultan",
    slug: "sultan",
    brandName: "Sultan Nargile",
    logo: { src: "/images/logo.png", width: 2756, height: 359 },
    bg: "bg-[#fff8f8] dark:bg-red-950/20",
    description:
      "Geleneksel nargile zanaatını modern mühendislikle buluşturan Sultan Nargile; dayanıklı çelik takımları, tescilli aksesuarları ve benzersiz içim kalitesiyle sektör standartlarını belirliyor.",
  },
  {
    brand: "Oduman",
    slug: "oduman",
    brandName: "Oduman",
    logo: { src: "/images/oduman_logo.png", width: 960, height: 960 },
    bg: "bg-[#fcf8f2] dark:bg-amber-950/20",
    description:
      "Camın zarafetini paslanmaz çelikle birleştiren Oduman, kompakt ve yenilikçi tasarımlarıyla nargile deneyimine modern bir dokunuş katıyor. Her detayıyla kusursuz bir içim keyfi.",
  },
  {
    brand: "Legend",
    slug: "legend",
    brandName: "Legend Hookah",
    logo: { src: "/images/logo_legend.png", width: 2892, height: 710 },
    bg: "bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 dark:from-red-950/20 dark:via-neutral-900/40 dark:to-blue-950/20",
    description:
      "Geleneksel estetiği modern nargile mühendisliğiyle buluşturan Legend Hookah, benzersiz tahliye sistemleri ve kusursuz işçiliğiyle elit bir performans sunar.",
  },
] as const;

/** How many of a brand's products its row holds: the dearest ones. */
const BRAND_SHOWCASE_COUNT = 24;
/** The API's page, and how far to page through a brand. */
const BRAND_PAGE = 100;
const BRAND_MAX = 400;

const priceOf = (p: CatalogProduct) => Number(displayVariant(p)?.price?.price_incl_tax ?? 0);

/**
 * A brand's row: every product it has (searched by name, page by page, then
 * held to the brand itself, since a search also matches names and codes that
 * merely mention it), dearest first — so it opens on the hookah sets rather
 * than on coal and tongs — cut to the row's length.
 */
async function getBrandShowcase(brand: string): Promise<CatalogProduct[]> {
  const found: CatalogProduct[] = [];
  for (let skip = 0; skip < BRAND_MAX; skip += BRAND_PAGE) {
    const page = await getPublicProducts(undefined, BRAND_PAGE, skip, brand);
    if (!page) break;
    found.push(...page);
    if (page.length < BRAND_PAGE) break;
  }
  const own = found.filter((p) => p.brand?.toLocaleLowerCase("tr-TR") === brand.toLocaleLowerCase("tr-TR"));
  return showable(own, own.length)
    .sort((a, b) => priceOf(b) - priceOf(a))
    .slice(0, BRAND_SHOWCASE_COUNT);
}

const TITLE = `${SITE_NAME} — Endüstriyel Toptan & Perakende Nargile Çözümleri`;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: TITLE, absoluteTitle: true, description: DEFAULT_DESCRIPTION, href: "/" });
}

export default async function HomePage() {
  // What to show and what it says: "Ana Sayfa Düzenleme" (/admin/homepage).
  const home = await getHomepage();
  const { sections } = home;
  const [categories, featured, flashSales, brands, content, artwork, bestsellers, newest, brandRows] = await Promise.all([
    getCategories(),
    getPublicProducts(FEATURED_CATEGORY_SLUG, FEATURED_PRODUCTS_COUNT),
    getFlashSaleProducts(),
    getBrands(),
    getHomeContent(),
    // One photo per showcase tile that has none of its own; cached with the
    // rest of the catalog reads, and not asked for at all while it is hidden.
    sections.showcase
      ? Promise.all(
          home.showcase.tiles.map((tile) => {
            // Only a tile with a category (or a search) has products to borrow a
            // photo from; an unfiltered query would return any product at all.
            const slug = tileSlug(tile);
            return tile.image || (!slug && !tile.search) ? null : getTileArtwork({ slug, search: tile.search });
          }),
        )
      : [],
    // Asked for with room to spare: some products have no photo or no price.
    getPublicProducts(PICKS.bestsellers, PICKS_COUNT * 2),
    getPublicProducts(PICKS.newest, PICKS_COUNT * 2),
    Promise.all(BRAND_SHOWCASES.map(({ brand }) => getBrandShowcase(brand))),
  ]);
  const allCategories = categories ?? [];
  const sidebar = resolveNav(home.navigation.sidebar, allCategories, brands ?? []);
  const showcase = resolveShowcase(home.showcase.tiles, allCategories, brands ?? [], artwork);
  // The deals funnel is the page's only deals section, and it is there only
  // when there is a deal to put in it.
  const deals = (flashSales ?? []).filter((p) => p.is_opportunity);

  // Content tied to flash sales (a slide, the "Şok" promo box) only shows while one is live.
  // Managed in /admin/hero and /admin/promos.
  // Any colour of any product carrying a claimable sale is enough.
  const has = { flash_sales: (flashSales ?? []).some((p) => p.variants.some((v) => v.flash_sale)) };
  const cmsSlides = (content?.slides ?? []).filter((s) => meets(s.requires, has)).map(toHeroSlide);
  const slides = cmsSlides.length > 0 ? cmsSlides : [FALLBACK_SLIDE];
  // Of the promo boxes, only the red "Ayrıcalıklar & Avantajlar" card is
  // shown now; the rest stay in /admin/promos but no longer reach the page.
  const spotlight = promoRows(content?.promos ?? [], has)
    .flat()
    .find((box) => box.variant === "social");

  return (
    <>
      {/* Follows the visitor's theme; the slider and advantage tiles are always dark,
          the brand strip always light. */}
      <main className="flex flex-1 flex-col bg-background text-foreground">
        {/* The shop as an Organization: stated once, on the page search
            engines read it from, rather than on every page (including 404s). */}
        <JsonLd data={organizationJsonLd(home.footer)} />
        {/* With its SearchAction: the header's search box, as Google can offer it. */}
        <JsonLd data={websiteJsonLd()} />
        {featured && featured.length > 0 && (
          <JsonLd
            data={productListJsonLd(featured, "/", new Map(allCategories.map((c) => [c.id, c])))}
          />
        )}

        {/* The first slide's title is the page's h1; with the slider switched
            off, the page still needs one. */}
        {!sections.hero && <h1 className="sr-only">{TITLE}</h1>}

        {/* Module 4: the category column (closed until "KATEGORİLER" opens
            it), with the hero beside it. */}
        {sections.hero && (
          <div className={`${PAGE_CONTAINER} pt-3 sm:pt-4 lg:flex lg:items-start`}>
            <CategorySidebar items={sidebar} />
            <div className="min-w-0 flex-1">
              {/* Module 5: hero slider. With the column closed it takes two
                  thirds of the row and the two promo boxes the last third;
                  opening the column folds the boxes away and the slider keeps
                  the rest. Animated sizes rather than a 12-column span, so the
                  fold runs alongside the column opening instead of jumping. */}
              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0fr)] lg:gap-x-0 lg:transition-[grid-template-columns,column-gap] lg:duration-300 lg:ease-[ease] motion-reduce:transition-none lg:sidebar-closed:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:sidebar-closed:gap-x-4">
                <HeroSlider slides={slides} />
                <HeroAside />
              </div>
            </div>
          </div>
        )}

        {/* Modules 6 & 7: the channels, the brand and the advantages, in
            columns split by hairlines under the hero row. With the category
            column open its top line sits flush under the column's last row,
            closing the list; with it closed (and below lg, where there is no
            column) the band keeps clear of the hero's rounded corners. The
            bottom margin is short because the deals section below brings its
            own padding: together they make the same 48px as the top. */}
        {sections.promos && spotlight && (
          <div
            className={`${PAGE_CONTAINER} mt-12 mb-6 sm:mb-4 lg:mt-0 lg:transition-[margin] lg:duration-300 lg:ease-[ease] motion-reduce:transition-none lg:sidebar-closed:mt-12`}
          >
            <PromoSpotlight box={spotlight} />
          </div>
        )}

        {/* Module 9: "Fırsatları Kaçırma" — the deals, and the page's only
            deals section. It renders nothing when none are running. */}
        {sections.deals && (
          <DealsFunnel
            initialProducts={deals}
            categories={allCategories}
            title={home.deals.title}
            subtitle={home.deals.subtitle}
          />
        )}

        {/* Module 9b: the brand ticker between the deals and the gallery. No
            heading — the names are the content. */}
        {sections.brands && <BrandTicker brands={home.brands.items} />}

        {/* Module 9c: "Sizin İçin Seçtiklerimiz", two tabbed product lists. */}
        <FeaturedProductsShowcase lists={{ bestsellers: showable(bestsellers), newest: showable(newest) }} />

        {/* Module 9d: "Markalarımız", one heading over a band per brand,
            alternating sides, just above the gallery. */}
        {brandRows.some((row) => row.length > 0) && (
          <section aria-labelledby="markalarimiz-baslik">
            <h2
              id="markalarimiz-baslik"
              className="mb-8 pt-12 text-center text-3xl font-extrabold text-gray-900 md:text-4xl dark:text-white"
            >
              MARKALARIMIZ
            </h2>
            {BRAND_SHOWCASES.map(({ slug, brandName, logo, bg, description }, i) => (
              <BrandShowcase
                key={slug}
                brandName={brandName}
                logoSrc={logo.src}
                logoWidth={logo.width}
                logoHeight={logo.height}
                description={description}
                brandLink={brandHref(slug)}
                products={brandRows[i]}
                reverseLayout={i % 2 === 1}
                bgClassName={bg}
              />
            ))}
          </section>
        )}

        {/* Module 10: the catalog as a gallery, in place of the old
            "Öne çıkanlar" carousel. */}
        {sections.showcase && (
          <CatalogShowcase title={home.showcase.title} subtitle={home.showcase.subtitle} tiles={showcase} />
        )}

        {/* Module 11: the advantages. */}
        {sections.advantages && <AdvantagesSection content={home.advantages} />}

        {/* Module 12: the corporate close, between the advantages and the footer. */}
        {sections.about && <CorporateTrust content={home.about} />}
      </main>
    </>
  );
}
