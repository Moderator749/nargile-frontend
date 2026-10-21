import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { InfoPage } from "@/components/info/InfoPage";
import { ARTICLES, BLOG_HREF, articleHref } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Blog";
const DESCRIPTION = "Nargile lülesi, ekipman seçimi ve içim üzerine Sultan Nargile rehberleri.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, href: BLOG_HREF });

export default function BlogPage() {
  return (
    <InfoPage title={TITLE} href={BLOG_HREF}>
      <ul className="divide-y divide-border">
        {ARTICLES.map((article) => (
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
                    <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden />
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
