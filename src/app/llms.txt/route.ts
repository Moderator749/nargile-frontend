import { BILGI_DOCUMENTS, PERKS_PAGE, bilgiHref } from "@/lib/bilgi";
import { ARTICLES, BLOG_HREF, articleHref } from "@/lib/blog";
import { FAQ, FAQ_HREF } from "@/lib/faq";
import { brandCanonical, categoryHref } from "@/lib/seo";
import { getBrands, getCategories, getPublicProducts, getStoreParameters } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { formatRate } from "@/lib/storeParameters";
import type { Category, ParameterTier, StoreParameters } from "@/types";

/*
 * /llms.txt (https://llmstxt.org): the shop in one Markdown page for AI
 * assistants and their crawlers — what it sells, where each part of the
 * catalogue lives, which brands it carries and the rules a buyer asks about.
 *
 * Built from the same data as the pages (categories and brands from the API,
 * the shopping rules from "Parametreler" — what checkout applies — the
 * contact details from "Ana Sayfa Düzenleme", the FAQ and the information
 * pages from the code), so it never says what the site does not. The rules
 * are read fresh, so the file is built per request.
 */

// Per request: the rules are read fresh (getStoreParameters), never cached.
export const revalidate = 0;

const url = (href: string) => `${SITE_URL}${href}`;

/** "3000.00" → "3.000 TL". */
const tl = (amount: string | number) => `${Number(amount).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL`;

/** A ladder as "30.000 TL üzeri %5, 50.000 TL üzeri %8"; empty without a rung that gives anything. */
const ladder = (tiers: ParameterTier[]) =>
  tiers
    .filter((t) => Number(t.rate) > 0)
    .sort((a, b) => Number(a.threshold) - Number(b.threshold))
    .map((t) => `${tl(t.threshold)} ve üzeri ${formatRate(t.rate)}`)
    .join(", ");

/** The retail shopping rules, as "Ayrıcalıklar ve Avantajlar" states them. */
function shoppingRules(params: StoreParameters): string[] {
  const rules = [`Ücretsiz kargo: ${tl(params.free_shipping_threshold)} ve üzeri perakende siparişlerde.`];
  const volume = ladder(params.volume_tiers);
  if (volume) rules.push(`Sepet indirimi: ${volume} (sepet tutarına göre, ödeme adımında otomatik).`);
  const transfer = ladder(params.bank_transfer_tiers);
  if (transfer) rules.push(`Havale/EFT indirimi: ${transfer}.`);
  const { loyalty } = params;
  if (loyalty.enabled && Number(loyalty.base_rate) > 0) {
    rules.push(`SultanPuan: ${tl(loyalty.band_min)} – ${tl(loyalty.band_max)} arası siparişlerde ${formatRate(loyalty.base_rate)} puan.`);
    if (loyalty.annual_bonus_points > 0) {
      const counted = Number(loyalty.annual_order_ceiling) > 0 ? `${tl(loyalty.annual_order_ceiling)} altındaki siparişlerin` : "Siparişlerin";
      rules.push(
        `KumbaraPuan: ${counted} son ${loyalty.annual_period_days} gündeki toplamı ${tl(loyalty.annual_spend_threshold)}'ye ulaşınca ${loyalty.annual_bonus_points.toLocaleString("tr-TR")} puan.`,
      );
    }
  }
  rules.push("İstanbul içi aynı gün kurye teslimatı (10:00 – 20:00).");
  return rules;
}
/** One line of Markdown: no line breaks, no stray link syntax. */
const line = (text: string) => text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();

export async function GET() {
  const [categories, brands, home, params] = await Promise.all([
    getCategories(),
    getBrands(),
    getHomepage(),
    getStoreParameters(),
  ]);
  const stocked = (categories ?? []).filter((c) => (c.product_count ?? 0) > 0);
  const topLevel = stocked.filter((c) => c.parent_id === null);
  const childrenOf = (parent: Category) => stocked.filter((c) => c.parent_id === parent.id);

  // A brand is listed where its products are: its category of the same slug,
  // or its own page when it has products on sale (a brand whose products are
  // not sold online has nothing to point at).
  const brandLinks = (
    await Promise.all(
      (brands ?? [])
        .filter((b) => b.is_active)
        .map(async (b) => {
          const href = brandCanonical(b.slug, stocked);
          if (!href.startsWith("/marka/")) return { name: b.name, href };
          const found = await getPublicProducts(undefined, 1, 0, b.search_term);
          return found && found.length > 0 ? { name: b.name, href } : null;
        }),
    )
  ).filter((b): b is { name: string; href: string } => b !== null);

  const footer = home.footer;
  const contact = [
    footer.phone?.trim() && `Telefon: ${footer.phone.trim()}`,
    footer.email?.trim() && `E-posta: ${footer.email.trim()}`,
    footer.hours?.trim() && `Çalışma saatleri: ${line(footer.hours)}`,
    ...footer.branches.map((b) => `${b.name} şubesi: ${line(b.address)}`),
  ].filter(Boolean);

  const out: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${line(DEFAULT_DESCRIPTION)}`,
    "",
    "Türkiye'de nargile ekipmanı satan bir e-ticaret mağazası: Sultan Nargile ve Legend Hookah markalarının üreticisi, " +
      "Oduman Nargile'nin Türkiye dağıtıcısı. Perakende müşterilere ve kafe, toptancı, bayi gibi firma hesaplarına satış yapar; " +
      "firma hesapları onaydan sonra kendi fiyat grubunu görür. Fiyatlar Türk lirası ve KDV dahildir.",
    "",
    "Önemli: Tütün ve tütün mamulleri internet üzerinden satılmaz (Türkiye mevzuatı). Katalog yalnızca nargile takımları, " +
      "kömür, lüle, marpuç, şişe ve aksesuarları içerir.",
    "",
    "## Kategoriler",
    "",
    `- [Tüm ürünler](${url("/catalog")}): Kataloğun tamamı; ?q= ile arama yapılabilir.`,
    ...topLevel.flatMap((c) => [
      `- [${line(c.name)}](${url(categoryHref(c.slug))}): ${c.product_count} ürün`,
      ...childrenOf(c).map((s) => `  - [${line(s.name)}](${url(categoryHref(s.slug))}): ${s.product_count} ürün`),
    ]),
    // A subcategory whose parent has nothing of its own still has a page.
    ...stocked
      .filter((c) => c.parent_id !== null && !topLevel.some((t) => t.id === c.parent_id))
      .map((c) => `- [${line(c.name)}](${url(categoryHref(c.slug))}): ${c.product_count} ürün`),
    "",
  ];

  if (brandLinks.length > 0) {
    out.push("## Markalar", "", ...brandLinks.map((b) => `- [${line(b.name)}](${url(b.href)})`), "");
  }

  out.push(
    "## Alışveriş koşulları",
    "",
    ...shoppingRules(params).map((rule) => `- ${rule}`),
    `- Tümü ve ayrıntıları: [${PERKS_PAGE.title}](${url(PERKS_PAGE.href)})`,
    "",
  );

  out.push(
    "## Politikalar ve bilgi sayfaları",
    "",
    ...BILGI_DOCUMENTS.map((doc) => `- [${line(doc.title)}](${url(bilgiHref(doc))}): ${line(doc.description)}`),
    `- [Sıkça Sorulan Sorular](${url(FAQ_HREF)}): ${FAQ.map((f) => line(f.question)).join(" · ")}`,
    "",
    "## Rehberler",
    "",
    `- [Blog](${url(BLOG_HREF)})`,
    ...ARTICLES.map((a) => `- [${line(a.title)}](${url(articleHref(a))})`),
    "",
  );

  if (contact.length > 0) out.push("## İletişim", "", ...contact.map((c) => `- ${c}`), "");

  out.push(
    "## Makineler için",
    "",
    `- [Site haritası](${url("/sitemap.xml")}): Her kategori ve ürün sayfası, son güncelleme tarihleriyle.`,
    "- Ürün sayfaları /<ürün-adı> adresindedir (sitenin kökünde) ve schema.org Product, Offer ve BreadcrumbList verisi taşır.",
    "",
  );

  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
