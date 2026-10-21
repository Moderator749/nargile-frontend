import type { Metadata } from "next";

import { PriceCatalogPage } from "@/components/catalog/PriceCatalogPage";
import { pageMessages } from "@/lib/i18n/messages/layout";
import { getMessages } from "@/lib/i18n/server";
import { PAGE_CONTAINER } from "@/lib/layout";

// A customer's own printout: never in a search index.
export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages(pageMessages);
  return { title: m.priceCatalogTitle, robots: { index: false, follow: false } };
}

/** /fiyat-katalogu?k=<hand-off key> — opened by "Fiyat Kataloğu İndir" on the catalog page. */
export default async function Page(props: PageProps<"/[locale]/fiyat-katalogu">) {
  const k = (await props.searchParams).k;
  return (
    <main className={`${PAGE_CONTAINER} flex-1 py-8`}>
      <PriceCatalogPage requestKey={(Array.isArray(k) ? k[0] : k) ?? ""} />
    </main>
  );
}
