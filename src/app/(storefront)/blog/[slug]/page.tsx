import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { InfoPage } from "@/components/info/InfoPage";
import { LegalText } from "@/components/legal/LegalText";
import { JsonLd } from "@/components/seo/JsonLd";
import { ARTICLES, articleHref, type Article } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

const findArticle = (slug: string) => ARTICLES.find((article) => article.slug === slug);

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = findArticle(slug);
  if (!article) return { title: "Yazı bulunamadı", robots: { index: false } };
  return pageMetadata({
    title: article.title,
    description: article.description,
    href: articleHref(article),
    type: "article",
  });
}

function articleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    mainEntityOfPage: `${SITE_URL}${articleHref(article)}`,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: `${SITE_URL}/icon.svg` },
  };
}

export default async function ArticlePage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const article = findArticle(slug);
  if (!article) notFound();

  return (
    <InfoPage title={article.title} href={articleHref(article)}>
      <JsonLd data={articleJsonLd(article)} />
      <p className="text-base leading-7 text-slate-700 dark:text-zinc-300">{article.intro}</p>

      <nav aria-label="Bu yazıda" className="mt-6 rounded-2xl border border-border p-4">
        <ul className="space-y-1.5">
          {article.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {article.sections.map((section) => (
        <section key={section.id} id={section.id} className="mt-10 scroll-mt-[var(--header-height)]">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100">{section.title}</h2>
          <LegalText body={section.body} headingLevel={3} />
        </section>
      ))}

      <Link
        href="/catalog/luleler"
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 hover:border-accent hover:text-accent"
      >
        Lüleleri incele
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </InfoPage>
  );
}
