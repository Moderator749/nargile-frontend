import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { InfoPage } from "@/components/info/InfoPage";
import { LegalText } from "@/components/legal/LegalText";
import { JsonLd } from "@/components/seo/JsonLd";
import { ARTICLES, article as findArticle, articleHref, articles, type Article } from "@/lib/blog";
import { localePath, type Locale } from "@/lib/i18n/config";
import { blogMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

// The slugs are Turkish in every language (/en/blog/nargile-lulesi-nedir).
export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([props.params, getI18n()]);
  const article = findArticle(slug, locale);
  if (!article) return { title: blogMessages[locale].notFound, robots: { index: false } };
  return pageMetadata({
    title: article.title,
    description: article.description,
    href: articleHref(article),
    type: "article",
    locale,
    locales: "all",
  });
}

/** schema.org's `inLanguage` (BCP 47), as lib/seo writes it. */
const IN_LANGUAGE: Record<Locale, string> = { tr: "tr-TR", en: "en", ar: "ar" };

function articleJsonLd(article: Article, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: IN_LANGUAGE[locale],
    datePublished: article.datePublished,
    mainEntityOfPage: `${SITE_URL}${localePath(locale, articleHref(article))}`,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: `${SITE_URL}/icon.png` },
  };
}

export default async function ArticlePage(props: PageProps<"/[locale]/blog/[slug]">) {
  const [{ slug }, { locale }] = await Promise.all([props.params, getI18n()]);
  const article = findArticle(slug, locale);
  if (!article) notFound();
  const m = blogMessages[locale];

  return (
    <InfoPage title={article.title} href={articleHref(article)}>
      <JsonLd data={articleJsonLd(article, locale)} />
      {article.intro && <p className="mb-6 text-base leading-7 text-slate-700 dark:text-zinc-300">{article.intro}</p>}
      <LegalText body={article.body} headingLevel={2} />

      {/* The other articles, so a reader who came for one finds the rest. */}
      <nav aria-labelledby="more-articles" className="mt-12 rounded-2xl border border-border p-5">
        <h2 id="more-articles" className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
          {m.moreArticles}
        </h2>
        <ul className="space-y-2">
          {articles(locale)
            .filter((other) => other.slug !== article.slug)
            .map((other) => (
              <li key={other.slug}>
                <Link
                  href={articleHref(other)}
                  className="inline-flex items-start gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-accent rtl:-scale-x-100" aria-hidden />
                  {other.title}
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      <Link
        href="/luleler"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 hover:border-accent hover:text-accent"
      >
        {m.browseBowls}
        <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
      </Link>
    </InfoPage>
  );
}
