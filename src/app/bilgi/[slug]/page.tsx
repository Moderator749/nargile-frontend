import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BilgiBody } from "@/components/bilgi/BilgiBody";
import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { BILGI_DOCUMENTS, BILGI_HREF, bilgiHref } from "@/lib/bilgi";

export const dynamicParams = false;

export function generateStaticParams() {
  return BILGI_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

const findDocument = (slug: string) => BILGI_DOCUMENTS.find((doc) => doc.slug === slug);

export async function generateMetadata(props: PageProps<"/bilgi/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const doc = findDocument(slug);
  if (!doc) return { title: "Sayfa bulunamadı", robots: { index: false } };
  const href = bilgiHref(doc);
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: href },
    openGraph: { title: doc.title, description: doc.description, url: href },
  };
}

export default async function BilgiDocumentPage(props: PageProps<"/bilgi/[slug]">) {
  const { slug } = await props.params;
  const doc = findDocument(slug);
  if (!doc) notFound();

  return (
    <BilgiLayout
      title={doc.title}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
        { name: "Bilgi Sayfaları", href: BILGI_HREF },
        { name: doc.title, href: bilgiHref(doc) },
      ]}
    >
      <article>
        <BilgiBody blocks={doc.blocks} />
      </article>
    </BilgiLayout>
  );
}
