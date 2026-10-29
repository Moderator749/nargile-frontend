import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BilgiBody } from "@/components/bilgi/BilgiBody";
import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { BILGI_DOCUMENTS, BILGI_HREF, bilgiDocument, bilgiHref } from "@/lib/bilgi";
import { bilgiMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

// The slugs are Turkish in every language (/en/bilgi/mesafeli-satis-sozlesmesi).
export function generateStaticParams() {
  return BILGI_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/bilgi/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([props.params, getI18n()]);
  const doc = bilgiDocument(slug, locale);
  if (!doc) return { title: bilgiMessages[locale].notFound, robots: { index: false } };
  return pageMetadata({ title: doc.title, description: doc.description, href: bilgiHref(doc), locale, locales: "all" });
}

export default async function BilgiDocumentPage(props: PageProps<"/[locale]/bilgi/[slug]">) {
  const [{ slug }, { locale, t }] = await Promise.all([props.params, getI18n()]);
  const doc = bilgiDocument(slug, locale);
  if (!doc) notFound();

  return (
    <BilgiLayout
      title={doc.title}
      breadcrumbs={[
        { name: t.nav.crumbHome, href: "/" },
        { name: bilgiMessages[locale].title, href: BILGI_HREF },
        { name: doc.title, href: bilgiHref(doc) },
      ]}
    >
      <article>
        <BilgiBody blocks={doc.blocks} />
      </article>
    </BilgiLayout>
  );
}
