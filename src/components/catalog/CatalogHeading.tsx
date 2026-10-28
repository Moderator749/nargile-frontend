import Link from "@/components/i18n/Link";
import { SearchTitle } from "@/components/catalog/SearchTitle";
import { ReadMore } from "@/components/ui/ReadMore";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { getMessages } from "@/lib/i18n/server";
import type { Breadcrumb } from "@/lib/seo";

/**
 * The page's name and the one line of trail above it. A listing's is
 * `compact` on a phone — one line each — so the first row of products is in
 * view as the page opens.
 *
 * The trail stays — in 11px rather than the old banner — because the page
 * emits BreadcrumbList structured data, and that markup is supposed to
 * describe a path the visitor can actually see.
 */
export async function CatalogHeading({
  title,
  breadcrumbs,
  searchable = false,
  compact = false,
}: {
  title: string;
  breadcrumbs: Breadcrumb[];
  /** A product listing's: the name on one line on a phone. */
  compact?: boolean;
  /** The whole catalog, where the header's search lands: the heading names the search while there is one. */
  searchable?: boolean;
}) {
  const t = await getMessages(catalogMessages);
  return (
    <header className={compact ? "mb-3 md:mb-4" : "mb-4"}>
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
                    {/* A finger-sized target on the 10px line, without moving it. */}
                    <Link href={crumb.href} className="-my-3 inline-block py-3 transition-colors duration-200 hover:text-foreground">
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

      {/* A listing's long name is cut short on a phone (all of it in the title and the trail). */}
      <h1
        title={compact && !searchable ? title : undefined}
        className={`font-bold uppercase tracking-tight text-neutral-900 dark:text-white ${
          compact
            ? "mt-1 truncate text-lg leading-tight md:mt-2 md:whitespace-normal md:text-2xl"
            : "mt-2 text-xl sm:text-2xl"
        }`}
      >
        {searchable ? <SearchTitle title={title} /> : title}
      </h1>
    </header>
  );
}

/**
 * Where the shop has written one, the category's introduction: two lines and
 * "Devamını Oku". Under the heading from `md` up; on a phone it waits under
 * the products, its name over it, so the grid starts right under the title
 * (CatalogView places it). All of it is in the HTML either way.
 */
export async function CatalogIntro({ title, html }: { title: string; html: string }) {
  const t = await getMessages(catalogMessages);
  return (
    <section aria-label={t.about(title)} className="max-w-3xl">
      <p aria-hidden className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground md:hidden">
        {t.about(title)}
      </p>
      <ReadMore id="kategori-aciklamasi" html={html} lines={2} className="text-sm text-muted-foreground" />
    </section>
  );
}
