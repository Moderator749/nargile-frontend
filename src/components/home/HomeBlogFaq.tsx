import { ArrowRight, ChevronDown } from "lucide-react";

import { BlogFaqList } from "@/components/home/BlogFaqList";
import Link from "@/components/i18n/Link";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleHref, asFaqItems, blogQuestions, type AnswerBlock, type BlogQuestion } from "@/lib/blogQuestions";
import { faqJsonLd } from "@/lib/faq";
import type { Locale } from "@/lib/i18n/config";
import { homeMessages } from "@/lib/i18n/messages/home";

/** Questions in view before "Tüm Yazıları Gör". */
const SHOWN = 4;

/** "Etiket: açıklama" in a list: the label in bold, as the source sets it. */
function ListItem({ text }: { text: string }) {
  const colon = text.indexOf(": ");
  if (colon > 0 && colon <= 60) {
    return (
      <li>
        <strong>{text.slice(0, colon + 1)}</strong> {text.slice(colon + 2)}
      </li>
    );
  }
  return <li>{text}</li>;
}

function Answer({ blocks }: { blocks: AnswerBlock[] }) {
  return blocks.map((block, i) =>
    "h" in block ? (
      <h4 key={i}>{block.h}</h4>
    ) : "p" in block ? (
      <p key={i}>{block.p}</p>
    ) : (
      <ul key={i}>
        {block.ul.map((text, j) => (
          <ListItem key={j} text={text} />
        ))}
      </ul>
    ),
  );
}

function Question({ item, more }: { item: BlogQuestion; more: string }) {
  const href = articleHref(item.id);
  return (
    <details id={`sss-${item.id}`} className="group scroll-mt-24">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-600 sm:px-6 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
        <h3 className="text-[15px] font-semibold leading-snug text-gray-900 md:text-base dark:text-white">{item.question}</h3>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:-rotate-180 group-open:text-red-600 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="rich-text px-5 pb-6 text-sm leading-relaxed text-gray-600 sm:px-6 md:text-[15px] dark:text-zinc-400">
        <Answer blocks={item.answer} />
        {href && (
          <p>
            <Link href={href} className="inline-flex items-center gap-1 font-medium">
              {more}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}

/**
 * "Blog / SSS": the shop's fourteen short guides as an accordion, just over
 * "Alt SEO Metni" — the first four in view, the rest one "Tüm Yazıları Gör"
 * away — and the same questions as the page's FAQPage JSON-LD.
 *
 * Every answer is in the server's HTML, open or not: a closed <details> and
 * the folded ten are hidden from view only, so a crawler reads all fourteen,
 * as the JSON-LD says it should find them. Rendered on the server; only the
 * fold's toggle is a client component, and only the page's language is sent.
 */
export function HomeBlogFaq({ locale }: { locale: Locale }) {
  const t = homeMessages[locale];
  const items = blogQuestions(locale);
  const render = (item: BlogQuestion) => <Question key={item.id} item={item} more={t.blogFaqArticle} />;
  return (
    <section id="blog-sss" aria-labelledby="blog-sss-heading" className="mx-auto w-full max-w-4xl px-4 pt-16">
      <JsonLd data={faqJsonLd(asFaqItems(items), locale)} />
      <header className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">{t.blogFaqEyebrow}</p>
        <h2
          id="blog-sss-heading"
          className="mt-2 text-balance text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl dark:text-white"
        >
          {t.blogFaqTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base dark:text-zinc-400">{t.blogFaqSubtitle}</p>
      </header>
      <BlogFaqList
        shown={items.slice(0, SHOWN).map(render)}
        rest={items.slice(SHOWN).map(render)}
        allLabel={t.blogFaqAll(items.length)}
        lessLabel={t.blogFaqLess}
      />
    </section>
  );
}
