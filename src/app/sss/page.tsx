import type { Metadata } from "next";

import { InfoPage } from "@/components/info/InfoPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ, FAQ_HREF, faqJsonLd } from "@/lib/faq";

const TITLE = "Destek & Sıkça Sorulan Sorular";
const DESCRIPTION =
  "Toptan fiyatlar, dağıtımını yaptığımız markalar, minimum sipariş tutarı ve kafe/mağaza teslimatı hakkında sıkça sorulan sorular.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: FAQ_HREF },
  openGraph: { title: TITLE, description: DESCRIPTION, url: FAQ_HREF },
};

export default function FaqPage() {
  return (
    <InfoPage title={TITLE} href={FAQ_HREF}>
      <JsonLd data={faqJsonLd()} />
      <div className="divide-y divide-border">
        {FAQ.map((item) => (
          <section key={item.id} id={item.id} className="scroll-mt-[var(--header-height)] py-6 first:pt-0 last:pb-0">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100">{item.question}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">{item.answer}</p>
          </section>
        ))}
      </div>
    </InfoPage>
  );
}
