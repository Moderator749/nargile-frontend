import type { Metadata } from "next";
import { ArrowRight, SearchX } from "lucide-react";

import Link from "@/components/i18n/Link";
import { PrePaintFallback } from "@/components/layout/PrePaintFallback";
import { errorMessages } from "@/lib/i18n/messages/layout";
import { getMessages } from "@/lib/i18n/server";
import { getCategories } from "@/lib/server/catalog";

/** Both 404 pages' metadata, in the page's language: never indexed, its links still followed. */
export async function notFoundMetadata(): Promise<Metadata> {
  const m = await getMessages(errorMessages);
  return { title: m.notFoundMeta, robots: { index: false, follow: true } };
}

/**
 * The 404 itself, without the shop's chrome: whoever renders it decides where
 * the menus come from (app/not-found.tsx and app/(storefront)/not-found.tsx).
 * It offers the way back in: home, the catalog, and every top-level category as
 * it stands.
 */
export async function NotFoundContent() {
  const m = await getMessages(errorMessages);
  const categories = ((await getCategories()) ?? [])
    .filter((c) => c.parent_id === null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
      <PrePaintFallback />
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <SearchX className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-6 font-mono text-sm font-semibold tracking-widest text-red-600 dark:text-red-400">404</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{m.notFoundTitle}</h1>
      <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground">{m.notFoundBody}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {m.home}
        </Link>
        <Link
          href="/catalog"
          className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-foreground ring-1 ring-inset ring-border transition-colors duration-200 hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {m.allProducts} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>

      {categories.length > 0 && (
        <nav aria-label={m.categories} className="mt-12 w-full">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{m.categories}</h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/catalog/${c.slug}`}
                  className="inline-flex rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-foreground transition-colors duration-200 hover:border-red-400/60 hover:text-red-600 dark:bg-zinc-900 dark:hover:text-red-400"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
