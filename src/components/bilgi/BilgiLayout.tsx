import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import Link from "@/components/i18n/Link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, type Breadcrumb } from "@/lib/seo";

/**
 * The editorial page the Bilgi Sayfaları share: a quiet trail, the title, and
 * the text on a wide reading measure.
 */
export function BilgiLayout({
  title,
  breadcrumbs,
  children,
}: {
  title: string;
  breadcrumbs: Breadcrumb[];
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:py-16">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <nav aria-label="Sayfa konumu" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-neutral-900 dark:text-white">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.href}
                      className="transition-colors duration-200 hover:text-neutral-900 dark:hover:text-white"
                    >
                      {crumb.name}
                    </Link>
                    <ChevronRight className="h-3 w-3 text-neutral-300 dark:text-neutral-700" aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 className="mb-6 text-2xl font-black uppercase tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        {title}
      </h1>
      {children}
    </main>
  );
}
