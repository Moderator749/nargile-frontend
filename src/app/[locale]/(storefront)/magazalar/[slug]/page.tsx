import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { StoreDetails } from "@/components/stores/StoreDetails";
import { getI18n } from "@/lib/i18n/server";
import { storeMessages } from "@/lib/i18n/messages/stores";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getHomepage } from "@/lib/server/homepage";
import { STORES, STORES_HREF, findStore, storeHref, storeJsonLd, whatsappLink } from "@/lib/stores";

export const dynamicParams = false;

export function generateStaticParams() {
  return STORES.map((store) => ({ slug: store.slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/magazalar/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([props.params, getI18n()]);
  const store = findStore(slug);
  if (!store) return { robots: { index: false } };
  const copy = store.copy[locale];
  return pageMetadata({
    title: copy.title,
    description: copy.description,
    href: storeHref(store),
    locale,
    locales: "all",
    images: store.photos.map((p) => p.src),
    imageAlt: copy.heading,
    // A draft stays out of search results until the shop confirms it (lib/stores).
    noindex: !store.verified,
  });
}

export default async function StorePage(props: PageProps<"/[locale]/magazalar/[slug]">) {
  const [{ slug }, { locale, t }, home] = await Promise.all([props.params, getI18n(), getHomepage()]);
  const store = findStore(slug);
  if (!store) notFound();
  const m = storeMessages[locale];
  const crumbs = [
    { name: t.nav.crumbHome, href: "/" },
    { name: m.indexHeading, href: STORES_HREF },
    { name: store.district[locale], href: storeHref(store) },
  ];
  const phone = store.phone ?? home.footer.phone;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={breadcrumbJsonLd(crumbs, locale)} />
      {/* Only once confirmed: structured data is read as fact. */}
      {store.verified && <JsonLd data={storeJsonLd(store, locale, phone)} />}
      <CatalogHeading title={store.copy[locale].heading} breadcrumbs={crumbs} />
      <div className="mt-8">
        <StoreDetails
          store={store}
          other={STORES.find((s) => s.slug !== store.slug) ?? null}
          locale={locale}
          phone={phone}
          whatsapp={store.whatsapp && store.whatsapp !== phone ? store.whatsapp : null}
          whatsappHref={store.whatsapp ? whatsappLink(store.whatsapp, m.whatsappGreeting) : home.footer.whatsapp_href}
        />
      </div>
    </main>
  );
}
