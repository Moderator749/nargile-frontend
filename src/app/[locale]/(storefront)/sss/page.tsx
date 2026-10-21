import type { Metadata } from "next";

import { InfoPage } from "@/components/info/InfoPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_HREF, faqItems, faqJsonLd } from "@/lib/faq";
import { faqMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const m = faqMessages[locale];
  return pageMetadata({ title: m.title, description: m.description, href: FAQ_HREF, locale, locales: "all" });
}

export default async function FaqPage() {
  const { locale } = await getI18n();
  const items = faqItems(locale);
  return (
    <InfoPage title={faqMessages[locale].title} href={FAQ_HREF}>
      <JsonLd data={faqJsonLd(items, locale)} />
      <div className="divide-y divide-border">
        {items.map((item) => (
          <section key={item.id} id={item.id} className="scroll-mt-[var(--header-height)] py-6 first:pt-0 last:pb-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">{item.question}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">{item.answer}</p>
          </section>
        ))}
      </div>
    </InfoPage>
  );
}
