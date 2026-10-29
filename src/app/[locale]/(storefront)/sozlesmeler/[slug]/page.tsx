import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { RichText } from "@/components/ui/RichText";
import { getI18n } from "@/lib/i18n/server";
import { LEGAL_PAGES } from "@/lib/legalPages";
import { getLegalDocuments } from "@/lib/server/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return LEGAL_PAGES.map(({ slug }) => ({ slug }));
}

async function documentFor(slug: string) {
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) return null;
  return (await getLegalDocuments())?.find((d) => d.key === page.key) ?? null;
}

export async function generateMetadata(props: PageProps<"/[locale]/sozlesmeler/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = await documentFor(slug);
  return doc ? { title: doc.title } : { robots: { index: false } };
}

/**
 * A legal text the footer links to (KVKK, çerez politikası, kullanım şartları),
 * as the admin last saved it in "Yasal Metinler" — the same text checkout's
 * modals show. In Turkish on every language's page: it is a Turkish legal text.
 */
export default async function LegalPage(props: PageProps<"/[locale]/sozlesmeler/[slug]">) {
  const [{ slug }, { t }] = await Promise.all([props.params, getI18n()]);
  const doc = await documentFor(slug);
  if (!doc) notFound();
  return (
    <BilgiLayout
      title={doc.title}
      breadcrumbs={[
        { name: t.nav.crumbHome, href: "/" },
        { name: doc.title, href: `/sozlesmeler/${slug}` },
      ]}
    >
      <article lang="tr">
        <RichText html={doc.body} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300" />
      </article>
    </BilgiLayout>
  );
}
