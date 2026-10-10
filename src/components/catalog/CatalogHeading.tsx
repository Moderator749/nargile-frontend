import Link from "next/link";

import type { Breadcrumb } from "@/lib/seo";

/**
 * The category's name, and the one line of trail above it.
 *
 * The trail stays — in 11px rather than the old banner — because the page
 * emits BreadcrumbList structured data, and that markup is supposed to
 * describe a path the visitor can actually see.
 */
export function CatalogHeading({ title, breadcrumbs }: { title: string; breadcrumbs: Breadcrumb[] }) {
  return (
    <header className="mb-4">
      <nav aria-label="Sayfa konumu">
        <ol className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-foreground">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.href} className="transition-colors duration-200 hover:text-foreground">
                      {crumb.name}
                    </Link>
                    <span aria-hidden className="text-neutral-300 dark:text-neutral-700">
                      /
                    </span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 className="mt-2 text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl dark:text-white">
        {title}
      </h1>
    </header>
  );
}
