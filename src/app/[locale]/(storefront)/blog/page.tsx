import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { InfoPage } from "@/components/info/InfoPage";
import { BLOG_HREF, articleHref, articles } from "@/lib/blog";
import { blogMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const m = blogMessages[locale];
  return pageMetadata({ title: m.title, description: m.description, href: BLOG_HREF, locale, locales: "all" });
}

export default async function BlogPage() {
  const { locale } = await getI18n();
  return (
    <InfoPage title={blogMessages[locale].title} href={BLOG_HREF}>
      <ul className="divide-y divide-border">
        {articles(locale).map((article) => (
          <li key={article.slug} className="py-6 first:pt-0 last:pb-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              <Link href={articleHref(article)} className="transition-colors duration-200 hover:text-accent">
                {article.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">{article.description}</p>
            <ul className="mt-3 space-y-1">
              {article.sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`${articleHref(article)}#${section.id}`}
                    className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-accent rtl:-scale-x-100" aria-hidden />
                    {section.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </InfoPage>
  );
}
