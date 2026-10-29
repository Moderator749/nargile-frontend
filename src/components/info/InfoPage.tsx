import type { ReactNode } from "react";

import { CatalogHeading } from "@/components/catalog/CatalogHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { infoShellMessages } from "@/lib/i18n/messages/info";
import { getI18n } from "@/lib/i18n/server";
import { breadcrumbJsonLd } from "@/lib/seo";

/**
 * The shell every footer information page shares: the trail and title, an
 * optional "last updated" line, and the text on a readable measure. The
 * title comes in the page's language from the caller; "Ana Sayfa", the
 * "last updated" label and its date are put in it here.
 */
export async function InfoPage({
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
  const { locale, t } = await getI18n();
  const m = infoShellMessages[locale];
  const crumbs = [
    { name: t.nav.crumbHome, href: "/" },
    { name: title, href },
  ];
  // lib/format's formatDate, in the page's language (Turkish: the same "tr-TR" output).
  const date = (iso: string) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={breadcrumbJsonLd(crumbs, locale)} />
      <CatalogHeading title={title} breadcrumbs={crumbs} />
      {updatedAt && (
        <p className="text-xs text-muted-foreground">
          {m.lastUpdated} <time dateTime={updatedAt}>{date(updatedAt)}</time>
        </p>
      )}
      <article className="mt-8 rounded-3xl border border-border bg-white p-6 sm:p-10 dark:bg-muted">{children}</article>
    </main>
  );
}
