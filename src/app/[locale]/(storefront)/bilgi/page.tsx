import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { BILGI_HREF, bilgiDocuments, bilgiHref, perksPage } from "@/lib/bilgi";
import { bilgiMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const m = bilgiMessages[locale];
  return pageMetadata({ title: m.title, description: m.description, href: BILGI_HREF, locale, locales: "all" });
}

export default async function BilgiIndexPage() {
  const { locale, t } = await getI18n();
  const m = bilgiMessages[locale];
  return (
    <BilgiLayout
      title={m.title}
      breadcrumbs={[
        { name: t.nav.home, href: "/" },
        { name: m.title, href: BILGI_HREF },
      ]}
    >
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {[{ ...perksPage(locale) }, ...bilgiDocuments(locale).map((doc) => ({ ...doc, href: bilgiHref(doc) }))].map((doc) => (
          <li key={doc.href}>
            <Link href={doc.href} className="group flex items-start justify-between gap-4 py-5">
              <span>
                <span className="block text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                  {doc.title}
                </span>
                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">{doc.description}</span>
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-red-600 transition-transform duration-200 rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </BilgiLayout>
  );
}
