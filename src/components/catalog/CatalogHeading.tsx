import Link from "@/components/i18n/Link";
import { ReadMore } from "@/components/ui/ReadMore";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { getMessages } from "@/lib/i18n/server";
import type { Breadcrumb } from "@/lib/seo";

/**
 * The category's name, the one line of trail above it and, where the shop has
 * written one, its introduction — two lines and "Devamını Oku", so the grid
 * still starts above the fold.
 *
 * The trail stays — in 11px rather than the old banner — because the page
 * emits BreadcrumbList structured data, and that markup is supposed to
 * describe a path the visitor can actually see.
 */
export async function CatalogHeading({
  title,
  breadcrumbs,
  intro,
  logo,
}: {
  title: string;
  breadcrumbs: Breadcrumb[];
  intro?: string | null;
  /** A brand page's logo, beside its name. */
  logo?: string | null;
}) {
  const t = await getMessages(catalogMessages);
  return (
    <header className="mb-4">
      <nav aria-label={t.breadcrumb}>
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

      <div className="mt-2 flex items-center gap-4">
        {logo && (
          // On a white tile in both themes: an uploaded logo may be a JPEG
          // with its own white ground, which would otherwise show as a box.
          // As wide as the logo needs at the tile's height: a wordmark gets room, a square stays square.
          <span className="flex h-14 min-w-14 max-w-[45%] shrink-0 items-center justify-center rounded-xl bg-white px-3 py-2 ring-1 ring-neutral-200 sm:h-16 sm:max-w-[13rem] dark:ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded logo, shown as it is */}
            <img src={logo} alt="" className="h-full w-auto max-w-full object-contain" />
          </span>
        )}
        <h1 className="text-xl font-bold uppercase tracking-tight text-neutral-900 sm:text-2xl dark:text-white">{title}</h1>
      </div>
      {intro && (
        <div className="mt-2 max-w-3xl">
          <ReadMore id="kategori-aciklamasi" html={intro} lines={2} className="text-sm text-muted-foreground" />
        </div>
      )}
    </header>
  );
}
