import type { ReactNode } from "react";

import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/seo";

/**
 * The shell every footer information page shares: the trail and title, an
 * optional "last updated" line, and the text on a readable measure.
 */
export function InfoPage({
  title,
  href,
  updatedAt,
  children,
}: {
  title: string;
  href: string;
  updatedAt?: string | null;
  children: ReactNode;
}) {
  const crumbs = [
    { name: "Ana Sayfa", href: "/" },
    { name: title, href },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <CatalogHeading title={title} breadcrumbs={crumbs} />
      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          Son güncelleme: <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
        </p>
      )}
      <article className="mt-8 rounded-3xl border border-border bg-white p-6 sm:p-10 dark:bg-muted">{children}</article>
    </main>
  );
}
