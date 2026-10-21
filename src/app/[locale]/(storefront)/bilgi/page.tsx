import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { BilgiLayout } from "@/components/bilgi/BilgiLayout";
import { BILGI_DOCUMENTS, BILGI_HREF, PERKS_PAGE, bilgiHref } from "@/lib/bilgi";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Bilgi Sayfaları";
const DESCRIPTION =
  "Sultan Nargile ayrıcalıkları ve avantajları, üyelik ve kullanım şartları, kargo ve teslimat şartları ve mesafeli satış sözleşmesi.";

export const metadata: Metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, href: BILGI_HREF });

export default function BilgiIndexPage() {
  return (
    <BilgiLayout
      title={TITLE}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
        { name: TITLE, href: BILGI_HREF },
      ]}
    >
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {[{ ...PERKS_PAGE }, ...BILGI_DOCUMENTS.map((doc) => ({ ...doc, href: bilgiHref(doc) }))].map((doc) => (
          <li key={doc.href}>
            <Link href={doc.href} className="group flex items-start justify-between gap-4 py-5">
              <span>
                <span className="block text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                  {doc.title}
                </span>
                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">{doc.description}</span>
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-red-600 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </BilgiLayout>
  );
}
