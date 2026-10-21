import { Fragment, type ReactNode } from "react";
import type { Metadata } from "next";

import { BrandStatement } from "@/components/home/BrandStatement";
import { CatalogShowcase } from "@/components/home/CatalogShowcase";
import { BrandShowcase } from "@/components/home/BrandShowcase";
import { BrandTicker } from "@/components/home/BrandTicker";
import { CampaignBanners } from "@/components/home/CampaignBanners";
import { DealsFunnel } from "@/components/home/DealsFunnel";
import { FeaturedProductsShowcase } from "@/components/home/FeaturedProductsShowcase";
import { HeroAside } from "@/components/home/HeroAside";
import { GamesShowcase } from "@/components/home/GamesShowcase";
import { HeroSlider } from "@/components/home/HeroSlider";
import { KozluklerShowcase } from "@/components/home/KozluklerShowcase";
import { KumbaraShowcase } from "@/components/home/KumbaraShowcase";
import { LuleShowcase } from "@/components/home/LuleShowcase";
import { SeoIntro } from "@/components/home/SeoIntro";
import { StorePerks } from "@/components/home/StorePerks";
import { SultanPuanShowcase } from "@/components/home/SultanPuanShowcase";
import { CategorySidebar } from "@/components/layout/CategorySidebar";
import { JsonLd } from "@/components/seo/JsonLd";
import { FEATURED_PRODUCTS_COUNT } from "@/lib/config";
import { brandHref, organizationJsonLd, pageMetadata, productListJsonLd, websiteJsonLd } from "@/lib/seo";
import { FALLBACK_SLIDE, heroPromo, meets, toHeroSlide, withDefaultImage } from "@/lib/home";
import { GAMES_CATEGORY_SLUG, KOZLUK_CATEGORY_SLUG, gamesShowcase, kozlukShowcase } from "@/lib/homeShowcases";
import {
  getBrands,
  getCategories,
  getFlashSaleProducts,
  getHomeContent,
  getBestsellers,
  getNewestProducts,
  getPublicProducts,
  getSultanPuanShowcase,
  getTileArtwork,
} from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { resolveShowcase, tileSlug } from "@/lib/showcase";
import { resolveNav } from "@/lib/storefrontNav";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { PAGE_CONTAINER } from "@/lib/layout";
import { displayVariant } from "@/lib/variants";
import type { CatalogProduct, HomeBlock, HomeMobileSection } from "@/types";

// Rendered per request so a flash sale that starts or ends is reflected at once
// (its countdowns and the slides that depend on one). Catalog fetches keep their
// own revalidate window in the data cache. The special-day strip is read in the
// browser from the layout, so it is current whatever this says.
export const revalidate = 0;

/** Category whose products are featured on the homepage. */
const FEATURED_CATEGORY_SLUG = "celik-takimlar";

/**
 * "Sizin İçin Seçtiklerimiz": "Çok Satanlar" is the products sold most
 * (approved and shipped orders), "Yeni Gelenler" the latest added; each is one
 * sliding row, five in view on a desktop. A tab short of its count is topped
 * up — see `fillPicks`.
 */
const PICK_KEYS = ["bestsellers", "newest"] as const;
const PICKS_COUNT = 15;

/** "Lüle Alırken Kararsız Kalacaksınız": this category's products, as the row under the picks. */
const LULE_CATEGORY_SLUG = "luleler";
const LULE_COUNT = 15;

/** "Kumbara 20.000 TL": this category's products, in the band above the deals. */
const KUMBARA_CATEGORY_SLUG = "marpuclar";
const KUMBARA_COUNT = 15;

/** "Közlükler" and "Oyun & Eğlence" read their whole category, up to this many. */
const SHOWCASE_CATEGORY_MAX = 100;

type Picks = Record<(typeof PICK_KEYS)[number], CatalogProduct[]>;

/** A product worth showing: one with a photo and a price to put under it. */
const showable = (products: CatalogProduct[] | null, count = PICKS_COUNT) =>
  (products ?? []).filter((p) => p.image_url && p.variants.some((v) => v.price)).slice(0, count);

/** The rows' items taken in turn: the first of each row, then the second of each… */
function interleave<T>(rows: readonly T[][]): T[] {
  const out: T[] = [];
  for (let i = 0; rows.some((row) => i < row.length); i++) {
    for (const row of rows) if (i < row.length) out.push(row[i]);
  }
  return out;
}

/**
 * Tops each tab up to `PICKS_COUNT` from `spare`, in its order, skipping any
 * product either tab already shows. So "Çok Satanlar" keeps its two rows while
 * few products have sold yet, and neither tab leaves a gap on a small catalog.
 */
function fillPicks(lists: Picks, spare: CatalogProduct[]): Picks {
  const taken = new Set(Object.values(lists).flat().map((p) => p.id));
  const filled = { ...lists };
  for (const key of PICK_KEYS) {
    const list = [...filled[key]];
    for (const p of spare) {
      if (list.length >= PICKS_COUNT) break;
      if (taken.has(p.id)) continue;
      taken.add(p.id);
      list.push(p);
    }
    filled[key] = list;
  }
  return filled;
}

/**
 * "Markalarımız": one section per brand under a single heading, down the page
 * in a zig-zag (brand on the left, then the right, then the left). `brand` is the products' own brand name and the
 * term they are searched by; `slug` is its /marka page.
 */
const BRAND_SHOWCASES = [
  {
    brand: "Sultan",
    slug: "sultan",
    brandName: "Sultan Nargile",
    logo: { src: "/images/logo.png", width: 2756, height: 359 },
    description:
      "Geleneksel nargile zanaatını modern mühendislikle buluşturan Sultan Nargile; dayanıklı çelik takımları, tescilli aksesuarları ve benzersiz içim kalitesiyle sektör standartlarını belirliyor.",
  },
  {
    brand: "Oduman",
    slug: "oduman",
    brandName: "Oduman",
    // A square file with the mark across its middle: framed to the mark's band
    // (about 942×385), and shown smaller than the wordmarks, being taller.
    logo: { src: "/images/oduman_logo.png", width: 960, height: 960, displayWidth: 180, frameRatio: 2.45 },
    description:
      "Camın zarafetini paslanmaz çelikle birleştiren Oduman, kompakt ve yenilikçi tasarımlarıyla nargile deneyimine modern bir dokunuş katıyor. Her detayıyla kusursuz bir içim keyfi.",
  },
  {
    brand: "Legend",
    slug: "legend",
    brandName: "Legend Hookah",
    logo: { src: "/images/logo_legend.png", width: 2892, height: 710 },
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
  const [
    categories, featured, flashSales, brands, content, artwork, bestsellers, newest, brandRows, sultanPuan, lules, marpuclar,
    kozlukProducts, gameProducts,
  ] = await Promise.all([
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
      getBestsellers(PICKS_COUNT * 2),
      getNewestProducts(PICKS_COUNT * 2),
      Promise.all(BRAND_SHOWCASES.map(({ brand }) => getBrandShowcase(brand))),
      getSultanPuanShowcase(),
      // With room to spare, as the picks: some have no photo or no price.
      getPublicProducts(LULE_CATEGORY_SLUG, LULE_COUNT * 2),
      getPublicProducts(KUMBARA_CATEGORY_SLUG, KUMBARA_COUNT * 2),
      // The two bands pick from their whole category (≈45 and ≈25 products),
      // and are not asked for while they are switched off.
      sections.kozlukler ? getPublicProducts(KOZLUK_CATEGORY_SLUG, SHOWCASE_CATEGORY_MAX) : null,
      sections.games ? getPublicProducts(GAMES_CATEGORY_SLUG, SHOWCASE_CATEGORY_MAX) : null,
    ]);
  const kozlukBand = kozlukShowcase(kozlukProducts);
  const gamesBand = gamesShowcase(gameProducts);
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
  const cmsSlides = (content?.slides ?? [])
    // Numbered before the filter, so a slide keeps its default photo whether or
    // not the one before it is showing.
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => meets(slide.requires, has))
    .map(({ slide, index }) => withDefaultImage(toHeroSlide(slide), index))
    // A portrait photo for phones, from "Mobil Yönetim", by the slide's id.
    .map((slide) => ({
      ...slide,
      mobileImage: home.mobile.hero_images.find((entry) => String(entry.slide_id) === slide.id)?.image ?? null,
    }));
  const slides = cmsSlides.length > 0 ? cmsSlides : [FALLBACK_SLIDE];

  // "Mobil Yönetim": a section switched off for phones is in the HTML for
  // every screen (the page is rendered once for all of them) and hidden below
  // `md` — where its lazy images, never on screen, are never fetched either.
  const hiddenOnPhones = new Set(home.mobile.hidden);
  const phones = (key: HomeMobileSection, section: ReactNode) =>
    hiddenOnPhones.has(key) ? <div className="max-md:hidden">{section}</div> : section;
  // The promo box beside the hero (the channels and the way to the
  // advantages), from /admin/promos.
  const spotlight = heroPromo(content?.promos ?? [], has);

  // A short tab is topped up from the featured category, then the brand rows
  // (the house brands, dearest first: the hookah sets), taken a brand at a
  // time; with neither, from the catalog's first page.
  const lists: Picks = { bestsellers: showable(bestsellers), newest: showable(newest) };
  const short = Object.values(lists).some((list) => list.length < PICKS_COUNT);
  const ready = [...showable(featured, Infinity), ...interleave(brandRows)];
  const spare = !short
    ? []
    : ready.length > 0
      ? ready
      : showable(await getPublicProducts(undefined, PICKS_COUNT * 4), PICKS_COUNT * 4);
  const picks = fillPicks(lists, spare);

  // The homepage's sections between the hero and the footer, by id. The page
  // shows them in `home.order` (the admin's, else lib/homeBlocks' default), so
  // each is whole on its own: no section counts on its neighbour.
  const blocks: Record<HomeBlock, () => ReactNode> = {
    // The payment advantages as a quiet bar, no boxes.
    perks: () => phones("perks", <StorePerks />),
    // The brand ticker on its own. Decorative: a screen reader hears the list
    // once, in the other ticker ("brands").
    brands_top: () =>
      phones("brand_ticker", <BrandTicker brands={home.brands.items} decorative className="pb-2 pt-4 sm:pt-5" />),
    // "Sizin İçin Seçtiklerimiz": two tabbed product lists in one row that
    // slides sideways.
    picks: () => <FeaturedProductsShowcase lists={picks} categories={allCategories} />,
    // "Lüle Alırken Kararsız Kalacaksınız", with the courier perk.
    lules: () =>
      phones(
        "lules",
        <LuleShowcase
          products={showable(lules, LULE_COUNT)}
          categories={allCategories}
          categoryHref={`/catalog/${LULE_CATEGORY_SLUG}`}
        />,
      ),
    // "%10 SultanPuan": the loyalty card and the products whose price alone
    // earns it. Nothing while the programme is off or no product is priced in
    // its band.
    sultanpuan: () =>
      sultanPuan && phones("sultanpuan", <SultanPuanShowcase showcase={sultanPuan} categories={allCategories} />),
    // "Kumbara 20.000 TL": the annual bonus, over the Marpuçlar. Nothing while
    // the bonus is off or the category is empty.
    kumbara: () =>
      phones("kumbara", <KumbaraShowcase products={showable(marpuclar, KUMBARA_COUNT)} categories={allCategories} />),
    // "Fırsatları Kaçırma": the page's only deals section, a dark band. It
    // renders nothing when none are running.
    deals: () => (
      <DealsFunnel initialProducts={deals} categories={allCategories} title={home.deals.title} subtitle={home.deals.subtitle} />
    ),
    // The campaign boxes: the big one and the mini bento (placeholder art
    // until the shop's photos).
    campaigns: () => phones("campaigns", <CampaignBanners />),
    // "Sektörde Referans Noktası", on a white band of its own.
    promos: () =>
      phones(
        "brand_statement",
        <div className="bg-white dark:bg-transparent">
          <div className={`${PAGE_CONTAINER} pt-2 pb-6`}>
            <BrandStatement />
          </div>
        </div>,
      ),
    // The brand ticker. No heading — the names are the content.
    brands: () => phones("brand_ticker", <BrandTicker brands={home.brands.items} />),
    // "Markalarımız": one heading over a band per brand, alternating sides.
    brand_showcase: () =>
      brandRows.some((row) => row.length > 0) &&
      phones(
        "brand_showcase",
        <section aria-labelledby="markalarimiz-baslik">
          <h2
            id="markalarimiz-baslik"
            className="pt-12 text-center text-3xl font-extrabold text-gray-900 md:text-4xl dark:text-white"
          >
            Markalarımız
          </h2>
          {/* The red rule under the heading, as "Premium Ürün Yelpazesi" has. */}
          <span aria-hidden className="mx-auto mt-4 mb-8 block h-1.5 w-14 rounded-full bg-red-600" />
          {BRAND_SHOWCASES.map(({ slug, brandName, logo, description }, i) => (
            <BrandShowcase
              key={slug}
              categories={allCategories}
              brandName={brandName}
              logoSrc={logo.src}
              logoWidth={logo.width}
              logoHeight={logo.height}
              logoDisplayWidth={"displayWidth" in logo ? logo.displayWidth : undefined}
              logoFrameRatio={"frameRatio" in logo ? logo.frameRatio : undefined}
              description={description}
              brandLink={brandHref(slug)}
              products={brandRows[i]}
              reverseLayout={i % 2 === 1}
            />
          ))}
        </section>,
      ),
    // "Közlükler": the dark, ember-lit band — a featured piece beside four,
    // devices and accessories as tabs. Nothing with an empty category.
    kozlukler: () => kozlukBand && phones("kozlukler", <KozluklerShowcase data={kozlukBand} />),
    // "Oyun & Eğlence": the green felt game table — tavla, okey and iskambil
    // as a fanned hand of cards, the dearest sets under it.
    games: () => gamesBand && phones("games", <GamesShowcase data={gamesBand} />),
    // "Premium Ürün Yelpazesi": the catalog as a gallery (the category bento).
    showcase: () =>
      phones("showcase", <CatalogShowcase title={home.showcase.title} subtitle={home.showcase.subtitle} tiles={showcase} />),
    // The shop in a few plain paragraphs ("Alt SEO Metni").
    about: () => <SeoIntro copy={home.seo_intro} />,
  };

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
            it), with the hero beside it, on a white band edge to edge that
            runs on under the perks bar to the picks; the column keeps its own
            grey (CategorySidebar). */}
        {sections.hero && (
          <div className="bg-white dark:bg-transparent">
          <div className={`${PAGE_CONTAINER} pt-3 sm:pt-4 lg:flex lg:items-stretch`}>
            <CategorySidebar items={sidebar} />
            <div className="min-w-0 flex-1">
              {/* Module 5: hero slider, with the channels and advantages beside
                  it (below lg they stand under it). The slider is the same size
                  with the category column open or closed — the row less the
                  column's 280px (16rem + its 1.5rem margin), 952px from xl.
                  Open, the column takes those 280px and the boxes are hidden;
                  closed, the boxes take them (264px + a 16px gap). Both sides
                  change over the same 300ms on the same curve, so the slider
                  only slides aside: never wider, never taller. */}
              <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_0px] lg:gap-x-0 lg:transition-[grid-template-columns,column-gap] lg:duration-300 lg:ease-[ease] motion-reduce:transition-none lg:sidebar-closed:grid-cols-[minmax(0,1fr)_264px] lg:sidebar-closed:gap-x-4">
                <HeroSlider slides={slides} />
                {/* Hidden by its own class: a wrapper would take its place in the row's grid. */}
                <HeroAside box={spotlight} className={hiddenOnPhones.has("promos") ? "max-md:hidden" : ""} />
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Everything between the hero and the footer, in the order set in
            "Ana Sayfa Düzenleme › Bölümler" (lib/homeBlocks), each behind its
            own switch there. */}
        {home.order.map((id) => sections[id] && <Fragment key={id}>{blocks[id]()}</Fragment>)}
      </main>
    </>
  );
}
