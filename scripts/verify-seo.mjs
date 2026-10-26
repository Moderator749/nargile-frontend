#!/usr/bin/env node
/**
 * Technical SEO smoke test against a running storefront.
 *
 *   npm run verify:seo                        # http://localhost:3000
 *   npm run verify:seo -- https://www.example.com
 *
 * Reads the server-rendered HTML — what a crawler gets before any JavaScript —
 * and checks, on the homepage, the catalog, a sample of categories, products
 * and brand pages and the information pages:
 *   - one <title>, a meta description of sensible length, a canonical URL
 *     without a query string, the Open Graph and Twitter card tags;
 *   - every application/ld+json block parses, and the types each page needs
 *     are there (Product with an Offer — a ProductGroup with a variant per
 *     colour — on a product page, each offer with its return policy and any
 *     shipping it states free and in Turkey, BreadcrumbList on
 *     category and product pages, OnlineStore + WebSite with a SearchAction on
 *     the homepage);
 *   - all of it in <head>, for an ordinary browser as well as for a crawler
 *     (next.config.ts turns streamed metadata off);
 *   - exactly one <h1>, <h2> sections, no skipped heading level, and every
 *     product card titled by an <h3>; every <img> with a non-empty alt, and
 *     product photos named "<Ürün> - <Kategori> | Nargile Malzemesi";
 *   - product pages at /product/<slug>, the canonical saying so; the old
 *     /product/<uuid> and the old store's /<slug> answering a 301 to it;
 *   - /robots.txt disallows the private paths and names the sitemap;
 *   - /sitemap.xml is valid, lists only absolute URLs, every product by slug
 *     (no id) with a <lastmod>, and every category with products, dated;
 *   - /llms.txt is Markdown with the categories and absolute links;
 *   - every photo goes through next/image (resized, WebP/AVIF), none raw;
 *   - a product page carries its whole description in the HTML (clamped
 *     only visually), "Benzer Ürünler" and "İlgili Kategoriler" links;
 *   - the old store's category and information addresses answer 301;
 *   - a filtered URL (?q=…) keeps the clean canonical.
 *
 * Exits 1 on any failure, printing each one.
 */

const BASE = (process.argv[2] ?? process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API = (process.env.API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

const failures = [];
let checks = 0;
const check = (ok, message) => {
  checks += 1;
  if (!ok) failures.push(message);
  return ok;
};

// The pages are read as an ordinary browser: metadata must be in <head> for
// every visitor, not only for the crawlers Next recognises (htmlLimitedBots).
const BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const CRAWLER = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function get(path, agent = BROWSER) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers: { "User-Agent": agent } });
  return { status: res.status, text: await res.text(), location: res.headers.get("location"), type: res.headers.get("content-type") };
}

/** "/x" redirects for good to `to` (a path), in one hop. */
async function movedTo(path, to) {
  const { status, location } = await get(path);
  const target = location ? new URL(location, BASE).pathname : "";
  check(status === 301 && target === to, `${path}: ${status} → ${location ?? "nowhere"}, expected 301 → ${to}`);
}

const plain = (html) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** <meta name|property="key" content="…"> values, in document order. */
function metaValues(html, key) {
  const out = [];
  const re = /<meta\b[^>]*>/gi;
  for (const tag of html.match(re) ?? []) {
    const name = /\b(?:name|property)="([^"]+)"/i.exec(tag)?.[1];
    const content = /\bcontent="([^"]*)"/i.exec(tag)?.[1];
    if (name === key && content !== undefined) out.push(decode(content));
  }
  return out;
}

function jsonLd(html, path) {
  const blocks = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const [, body] of html.matchAll(re)) {
    try {
      blocks.push(JSON.parse(body));
    } catch (err) {
      check(false, `${path}: JSON-LD does not parse (${err.message})`);
    }
  }
  return blocks;
}

const typesOf = (blocks) => blocks.flatMap((b) => (Array.isArray(b["@type"]) ? b["@type"] : [b["@type"]]));

/**
 * The <head>, and the page body without anything Next renders for later:
 * streamed RSC payloads repeat the markup inside <script> strings.
 */
function split(html) {
  const head = /<head>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? "";
  const body = (/<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<template\b[\s\S]*?<\/template>/gi, "");
  return { head, body };
}

async function page(path, { expect = [], canonical = path, indexable = true, sections = true } = {}) {
  const { status, text } = await get(path);
  if (!check(status === 200, `${path}: HTTP ${status}`)) return null;
  const { head, body } = split(text);

  const titles = head.match(/<title>([\s\S]*?)<\/title>/gi) ?? [];
  check(titles.length === 1, `${path}: ${titles.length} <title> tags`);
  const title = decode(titles[0]?.replace(/<\/?title>/gi, "") ?? "");
  check(title.length >= 10 && title.length <= 90, `${path}: title length ${title.length} ("${title}")`);

  const [description = ""] = metaValues(head, "description");
  check(description.length >= 50 && description.length <= 170, `${path}: description length ${description.length}`);

  const canonicalHref = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i.exec(head)?.[1] ?? "";
  check(!!canonicalHref, `${path}: no canonical`);
  check(!canonicalHref.includes("?"), `${path}: canonical has a query string (${canonicalHref})`);
  check(new URL(canonicalHref || "x:/").pathname === new URL(canonical, BASE).pathname, `${path}: canonical ${canonicalHref}, expected ${canonical}`);

  for (const key of ["og:title", "og:description", "og:url", "og:image", "og:type", "og:site_name", "og:locale"]) {
    check(metaValues(head, key).length > 0, `${path}: missing ${key}`);
  }
  check(metaValues(head, "twitter:card")[0] === "summary_large_image", `${path}: twitter:card is not summary_large_image`);
  for (const key of ["twitter:title", "twitter:description", "twitter:image"]) {
    check(metaValues(head, key).length > 0, `${path}: missing ${key}`);
  }
  for (const image of metaValues(head, "og:image")) {
    check(/^https?:\/\//.test(image), `${path}: og:image is not absolute (${image})`);
  }

  const robots = metaValues(head, "robots").join(",");
  check(indexable ? !robots.includes("noindex") : robots.includes("noindex"), `${path}: robots "${robots}" (indexable=${indexable})`);

  const blocks = jsonLd(text, path);
  const types = typesOf(blocks);
  for (const type of expect) check(types.includes(type), `${path}: no ${type} JSON-LD (has ${types.join(", ") || "none"})`);

  // A streamed Suspense segment (<div hidden id="S:n">) replaces its fallback
  // once the browser swaps it in, so the shell before the first one is the
  // page; the segments count only when the shell has no heading at all.
  const cut = body.search(/<div hidden id="S:\d+">/);
  const shell = cut === -1 ? body : body.slice(0, cut);
  const h1 = shell.match(/<h1\b/gi)?.length || (body.match(/<h1\b/gi)?.length ?? 0);
  check(h1 === 1, `${path}: ${h1} <h1> elements`);
  // The outline: <h1> first, then no level skipped on the way down (an <h3>
  // straight under the <h1>, or an <h4> under an <h2>).
  const headings = [...shell.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(([, level, inner]) => ({
    level: Number(level),
    text: plain(inner),
  }));
  check(headings[0]?.level === 1, `${path}: the first heading is <h${headings[0]?.level}>, not the <h1>`);
  if (sections) check(headings.some((h) => h.level === 2), `${path}: no <h2> section`);
  headings.forEach((h, i) => {
    if (i > 0 && h.level > headings[i - 1].level + 1) {
      check(false, `${path}: <h${h.level}> "${h.text}" right after <h${headings[i - 1].level}> "${headings[i - 1].text}"`);
    }
  });
  const imgs = (body.match(/<img\b[^>]*>/gi) ?? []).filter((img) => !/aria-hidden="true"/.test(img));
  const noAlt = imgs.filter((img) => !/\balt="[^"]*\S[^"]*"/.test(img));
  check(noAlt.length === 0, `${path}: ${noAlt.length} <img> with no or empty alt`);
  const alts = imgs.map((img) => decode(/\balt="([^"]*)"/.exec(img)?.[1] ?? ""));
  // Resized and re-encoded by next/image, not the original file (an SVG
  // needs no resizing).
  const raw = imgs.filter((img) => !/\bsrc="\/_next\/image\?/.test(img) && !/\bsrc="[^"]*\.svg"/.test(img));
  check(raw.length === 0, `${path}: ${raw.length} unoptimised <img> (${/\bsrc="([^"]+)"/.exec(raw[0] ?? "")?.[1]})`);

  return { head, body, shell, headings, alts, blocks, title, description };
}

/** The page's product: a Product, or a ProductGroup of colours. */
const productBlock = (blocks) => blocks.find((b) => b["@type"] === "Product" || b["@type"] === "ProductGroup");

function productChecks(path, blocks) {
  const product = productBlock(blocks);
  if (!check(!!product, `${path}: no Product or ProductGroup`)) return;
  const group = product["@type"] === "ProductGroup";
  const variants = group ? product.hasVariant ?? [] : [product];
  if (group) {
    check(variants.length > 1, `${path}: ProductGroup with ${variants.length} variant(s)`);
    check(product.variesBy?.includes("https://schema.org/color"), `${path}: ProductGroup.variesBy ${product.variesBy}`);
  }
  for (const key of ["name", "image"]) check(product[key] !== undefined, `${path}: ${product["@type"]}.${key} missing`);
  for (const v of variants) for (const key of ["sku", "offers"]) check(v[key] !== undefined, `${path}: ${v.name}: ${key} missing`);
  const offers = variants.flatMap((v) => [].concat(v.offers ?? []));
  for (const offer of offers) {
    const returns = offer.hasMerchantReturnPolicy;
    check(returns?.merchantReturnDays === 14 && returns?.applicableCountry === "TR", `${path}: offer without the 14-day return policy`);
    const ship = offer.shippingDetails;
    if (ship) check(ship.shippingRate?.value === 0 && ship.shippingDestination?.addressCountry === "TR", `${path}: shippingDetails ${JSON.stringify(ship)}`);
    check(offer["@type"] === "Offer", `${path}: offer type ${offer["@type"]}`);
    check(offer.priceCurrency === "TRY", `${path}: priceCurrency ${offer.priceCurrency}`);
    check(Number(offer.price) > 0, `${path}: price ${offer.price}`);
    check(/schema\.org\/(InStock|OutOfStock)$/.test(offer.availability ?? ""), `${path}: availability ${offer.availability}`);
  }
  const crumbs = blocks.find((b) => b["@type"] === "BreadcrumbList")?.itemListElement ?? [];
  check(crumbs.length >= 2 && crumbs[0].name === "Ana Sayfa", `${path}: breadcrumb does not start at Ana Sayfa`);
  check(crumbs.at(-1)?.name === product.name, `${path}: breadcrumb does not end at the product`);
}

async function main() {
  const [categories, brands, products] = await Promise.all(
    ["/categories/", "/brands/", "/products/?limit=100"].map((p) => fetch(`${API}${p}`).then((r) => r.json())),
  );

  // Robots. A deployment without NEXT_PUBLIC_ALLOW_INDEXING=true (staging)
  // must shut crawlers out entirely, and nothing below applies to it.
  const robots = (await get("/robots.txt")).text;
  if (/^Disallow: \/$/m.test(robots)) {
    const home = await get("/");
    check(/<meta name="robots" content="noindex, nofollow"/.test(home.text), "/: staging robots.txt but the page is indexable");
    console.log(`Indexing is OFF on ${BASE} (staging): robots.txt disallows everything, pages say noindex.`);
    console.log(`${checks - failures.length}/${checks} checks passed`);
    if (failures.length > 0) {
      for (const f of failures) console.error(`  ✗ ${f}`);
      process.exit(1);
    }
    return;
  }
  for (const path of ["/admin", "/account", "/cart", "/api", "/sifremi-unuttum", "/sifre-yenile"]) {
    check(new RegExp(`^Disallow: ${path}$`, "m").test(robots), `robots.txt: ${path} not disallowed`);
  }
  check(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(robots), "robots.txt: no Sitemap line");

  // Sitemap
  const sitemap = (await get("/sitemap.xml")).text;
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, e]) => ({
    loc: /<loc>([^<]+)<\/loc>/.exec(e)?.[1],
    lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(e)?.[1],
  }));
  check(sitemap.startsWith("<?xml") && sitemap.includes("http://www.sitemaps.org/schemas/sitemap/0.9"), "sitemap.xml: not a sitemap");
  check(entries.length > 0 && entries.every((e) => /^https?:\/\//.test(e.loc ?? "")), "sitemap.xml: relative or empty <loc>");
  const productEntries = entries.filter((e) => e.loc.includes("/product/"));
  check(productEntries.length >= products.length, `sitemap.xml: ${productEntries.length} products listed`);
  check(productEntries.every((e) => e.lastmod && !Number.isNaN(Date.parse(e.lastmod))), "sitemap.xml: product without a valid <lastmod>");
  const byId = productEntries.filter((e) => UUID.test(e.loc));
  check(byId.length === 0, `sitemap.xml: ${byId.length} product URLs by id (${byId[0]?.loc})`);
  const bySlug = new Set(productEntries.map((e) => new URL(e.loc).pathname));
  check(products.every((p) => bySlug.has(`/product/${p.slug}`)), "sitemap.xml: a product is missing from its slug URL");
  for (const c of categories.filter((c) => c.product_count > 0)) {
    const entry = entries.find((e) => new URL(e.loc).pathname === `/catalog/${c.slug}`);
    check(!!entry, `sitemap.xml: category ${c.slug} (${c.product_count} products) missing`);
    check(!!entry && !Number.isNaN(Date.parse(entry.lastmod ?? "")), `sitemap.xml: category ${c.slug} without a valid <lastmod>`);
  }
  check(!entries.some((e) => /\/(admin|account|cart|login|register)\b/.test(e.loc)), "sitemap.xml: lists a private page");

  // Pages
  const home = await page("/", { expect: ["OnlineStore", "WebSite"] });
  const website = home?.blocks.find((b) => b["@type"] === "WebSite");
  check(website?.potentialAction?.["@type"] === "SearchAction", "/: WebSite has no SearchAction");
  check(website?.potentialAction?.target?.urlTemplate?.includes("{search_term_string}"), "/: SearchAction urlTemplate");

  await page("/catalog", { expect: ["BreadcrumbList"] });
  await page("/catalog?q=legend&sort=price", { expect: ["BreadcrumbList"], canonical: "/catalog" });

  const listed = new Set(entries.map((e) => new URL(e.loc).pathname));
  const sampleCategories = categories.filter((c) => listed.has(`/catalog/${c.slug}`)).slice(0, 4);
  for (const c of sampleCategories) {
    const result = await page(`/catalog/${c.slug}`, { expect: ["BreadcrumbList", "ItemList"] });
    const crumbs = result?.blocks.find((b) => b["@type"] === "BreadcrumbList")?.itemListElement ?? [];
    check(crumbs.at(-1)?.name === c.name, `/catalog/${c.slug}: breadcrumb does not end at the category`);
    // Every product in the list is a card titled by an <h3>.
    const listed = result?.blocks.find((b) => b["@type"] === "ItemList")?.itemListElement ?? [];
    const h3 = new Set((result?.headings ?? []).filter((h) => h.level === 3).map((h) => h.text));
    const untitled = listed.filter((l) => !h3.has(l.item.name));
    check(listed.length > 0 && untitled.length === 0, `/catalog/${c.slug}: ${untitled.length} product cards without an <h3> title`);
    for (const l of listed) check(!UUID.test(l.item.url), `/catalog/${c.slug}: ItemList URL by id (${l.item.url})`);
  }

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  for (const p of [products[0], products[Math.floor(products.length / 2)], products.at(-1)]) {
    const path = `/product/${p.slug}`;
    check(!UUID.test(p.slug), `${p.id}: slug is an id`);
    const result = await page(path, { expect: ["BreadcrumbList"] });
    if (result) {
      productChecks(path, result.blocks);
      const product = productBlock(result.blocks);
      check(product?.url === `${new URL(product?.url ?? BASE).origin}${path}`, `${path}: Product.url ${product?.url}`);
      const category = categoryName.get(p.category_id);
      const alt = `${p.name}${category ? ` - ${category}` : ""} | Nargile Malzemesi`;
      check(result.alts.includes(alt), `${path}: no photo with alt "${alt}"`);
    }
    // The whole description is in the page, however short the visible part.
    if (p.description) {
      const lead = plain(p.description).slice(0, 60);
      check(plain(result?.body ?? "").includes(lead), `${path}: description not in the HTML ("${lead}")`);
    }
    const similar = /id="similar-products-heading"[\s\S]*?<\/section>/.exec(result?.body ?? "")?.[0] ?? "";
    const similarLinks = similar.match(/href="\/product\/[^"]+"/g) ?? [];
    check(similarLinks.length > 0, `${path}: no "Benzer Ürünler" links`);
    check(!similarLinks.includes(`href="${path}"`), `${path}: "Benzer Ürünler" links to the product itself`);
    const related = /id="related-categories-heading"[\s\S]*?<\/nav>/.exec(result?.body ?? "")?.[0] ?? "";
    check(/href="\/(catalog|marka)\/[^"]+"/.test(related), `${path}: no "İlgili Kategoriler" links`);

    // The old addresses: by id, by the old store's root path, in capitals.
    await movedTo(`/product/${p.id}`, path);
    await movedTo(`/${p.slug}`, path);
    await movedTo(`/product/${p.slug.toUpperCase()}`, path);
  }
  // The old store's category and information pages.
  for (const [from, to] of [
    ["/nargile-komuru", "/catalog/komurler"],
    ["/paslanmaz-celik-nargile-takimlari", "/catalog/celik-takimlar"],
    ["/teslimat-ve-kargolama-bilgileri", "/bilgi/kargo-ve-teslimat"],
  ]) {
    await movedTo(from, to);
  }

  // Crawlers too get the metadata in <head> (and the same page).
  const crawled = split((await get(`/product/${products[0].slug}`, CRAWLER)).text).head;
  check(/<title>/.test(crawled), "product page: no <title> in <head> for Googlebot");

  // llms.txt
  const llms = await get("/llms.txt");
  check(llms.status === 200, `/llms.txt: HTTP ${llms.status}`);
  check(/^text\/(markdown|plain)/.test(llms.type ?? ""), `/llms.txt: content-type ${llms.type}`);
  check(llms.text.startsWith("# "), "/llms.txt: does not start with an H1");
  check(/^## Kategoriler$/m.test(llms.text), "/llms.txt: no Kategoriler section");
  const llmsLinks = [...llms.text.matchAll(/\]\(([^)]+)\)/g)].map(([, href]) => href);
  check(llmsLinks.length > 0 && llmsLinks.every((href) => /^https?:\/\//.test(href)), "/llms.txt: relative or missing links");
  for (const c of categories.filter((c) => c.product_count > 0)) {
    check(llms.text.includes(`/catalog/${c.slug})`), `/llms.txt: category ${c.slug} missing`);
  }

  // Brand pages: one that is a category too (canonical to it), one with nothing on sale (noindex).
  const twin = brands.find((b) => categories.some((c) => c.slug === b.slug));
  if (twin) await page(`/marka/${twin.slug}`, { expect: ["BreadcrumbList"], canonical: `/catalog/${twin.slug}` });
  for (const b of brands.filter((b) => !categories.some((c) => c.slug === b.slug))) {
    const found = await fetch(`${API}/products/?limit=1&q=${encodeURIComponent(b.search_term)}`).then((r) => r.json());
    await page(`/marka/${b.slug}`, { expect: ["BreadcrumbList"], indexable: found.length > 0 });
  }

  for (const path of ["/sss", "/blog", "/bilgi"]) await page(path, { sections: false });

  console.log(`${checks - failures.length}/${checks} checks passed against ${BASE}`);
  if (failures.length > 0) {
    console.error(`\n${failures.length} failed:`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
