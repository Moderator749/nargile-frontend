import { BILGI_DOCUMENTS, bilgiHref } from "@/lib/bilgi";
import { ARTICLES, BLOG_HREF, articleHref } from "@/lib/blog";
import { FAQ, FAQ_HREF } from "@/lib/faq";
import { brandCanonical } from "@/lib/seo";
import { getBrands, getCategories, getPublicProducts } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Category } from "@/types";

/*
 * /llms.txt (https://llmstxt.org): the shop in one Markdown page for AI
 * assistants and their crawlers — what it sells, where each part of the
 * catalogue lives, which brands it carries and the rules a buyer asks about.
 *
 * Built from the same data as the pages (categories and brands from the API,
 * the advantages and contact details from "Ana Sayfa Düzenleme", the FAQ and
 * the information pages from the code), so it never says what the site does
 * not. Regenerated hourly, like the sitemap.
 */

export const revalidate = 3600;

const url = (href: string) => `${SITE_URL}${href}`;
/** One line of Markdown: no line breaks, no stray link syntax. */
const line = (text: string) => text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();

export async function GET() {
  const [categories, brands, home] = await Promise.all([getCategories(), getBrands(), getHomepage()]);
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
          if (href.startsWith("/catalog/")) return { name: b.name, href };
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
      `- [${line(c.name)}](${url(`/catalog/${c.slug}`)}): ${c.product_count} ürün`,
      ...childrenOf(c).map((s) => `  - [${line(s.name)}](${url(`/catalog/${s.slug}`)}): ${s.product_count} ürün`),
    ]),
    // A subcategory whose parent has nothing of its own still has a page.
    ...stocked
      .filter((c) => c.parent_id !== null && !topLevel.some((t) => t.id === c.parent_id))
      .map((c) => `- [${line(c.name)}](${url(`/catalog/${c.slug}`)}): ${c.product_count} ürün`),
    "",
  ];

  if (brandLinks.length > 0) {
    out.push("## Markalar", "", ...brandLinks.map((b) => `- [${line(b.name)}](${url(b.href)})`), "");
  }

  // Title and description only: the card's note is fine print for the
  // "Devamını oku" dialog, not a rule to summarise.
  const advantages = home.advantages.cards.filter((c) => c.title.trim() && c.description.trim());
  if (advantages.length > 0) {
    out.push(
      "## Alışveriş koşulları",
      "",
      ...advantages.map((c) => `- ${line(c.title)}: ${line(c.description)}`),
      "",
    );
  }

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
    "- Ürün sayfaları /product/<ürün-adı> adresindedir ve schema.org Product, Offer ve BreadcrumbList verisi taşır.",
    "",
  );

  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
