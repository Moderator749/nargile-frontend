import type { Metadata } from "next";

import { BLOG_QUESTION_LIST, BlogQuestionItem } from "@/components/blog/BlogQuestionItem";
import { InfoPage } from "@/components/info/InfoPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { BLOG_HREF } from "@/lib/blog";
import { asFaqItems, blogQuestions } from "@/lib/blogQuestions";
import { faqJsonLd } from "@/lib/faq";
import { blogMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const m = blogMessages[locale];
  return pageMetadata({ title: m.title, description: m.description, href: BLOG_HREF, locale, locales: "all" });
}

/**
 * The blog: every question of the shop's guides, each answer one click away,
 * the same list the footer's "Tüm yazıları gör" opens over any page — and
 * the page's FAQPage JSON-LD. The answers are all in the HTML, open or not.
 * The four lüle questions link on to their full articles (/blog/[slug]).
 */
export default async function BlogPage() {
  const { locale } = await getI18n();
  const m = blogMessages[locale];
  const items = blogQuestions(locale);
  return (
    <InfoPage title={m.title} href={BLOG_HREF}>
      <JsonLd data={faqJsonLd(asFaqItems(items), locale)} />
      <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">{m.questionsIntro}</p>
      <div className={`mt-4 ${BLOG_QUESTION_LIST}`}>
        {items.map((item) => (
          <BlogQuestionItem key={item.id} item={item} more={m.readArticle} heading="h2" />
        ))}
      </div>
    </InfoPage>
  );
}
