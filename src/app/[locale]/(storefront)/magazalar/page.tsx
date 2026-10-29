import type { Metadata } from "next";
import { ArrowRight, MapPin } from "lucide-react";

import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import Link from "@/components/i18n/Link";
import { JsonLd } from "@/components/seo/JsonLd";
import { getI18n } from "@/lib/i18n/server";
import { storeMessages } from "@/lib/i18n/messages/stores";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { STORES, STORES_HREF, fullAddress, publishedStores, storeHref } from "@/lib/stores";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  const m = storeMessages[locale];
  return pageMetadata({
    title: m.indexTitle,
    description: m.indexDescription,
    href: STORES_HREF,
    locale,
    locales: "all",
    noindex: publishedStores().length === 0,
  });
}

/** Both stores, each a card leading to its own page. */
export default async function StoresPage() {
  const { locale, t } = await getI18n();
  const m = storeMessages[locale];
  const crumbs = [
    { name: t.nav.crumbHome, href: "/" },
    { name: m.indexHeading, href: STORES_HREF },
  ];
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={breadcrumbJsonLd(crumbs, locale)} />
      <CatalogHeading title={m.indexHeading} breadcrumbs={crumbs} />
      <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-700 dark:text-zinc-300">{m.indexIntro}</p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {STORES.map((store) => (
          <li key={store.slug}>
            <Link
              href={storeHref(store)}
              className="group flex h-full flex-col rounded-3xl border border-border bg-white p-6 transition-colors hover:border-neutral-900 sm:p-8 dark:bg-muted dark:hover:border-white"
            >
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">{store.copy[locale].heading}</h2>
              <p className="mt-3 flex gap-2 text-sm text-neutral-600 dark:text-zinc-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                {fullAddress(store)}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                {m.see}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
