
import Link from "@/components/i18n/Link";
import type { RelatedLink } from "@/lib/related";

/** "İlgili Kategoriler": plain links as tags, under the product's own shelves. */
export function RelatedCategories({ links }: { links: RelatedLink[] }) {
  if (links.length === 0) return null;
  return (
    <nav aria-labelledby="related-categories-heading" className="mt-14 border-t border-border pt-10">
      <h2
        id="related-categories-heading"
        className="text-center text-2xl font-semibold tracking-tighter text-foreground sm:text-3xl"
      >
        İlgili Kategoriler
      </h2>
      <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-red-500/50 hover:text-red-600 dark:bg-zinc-900 dark:hover:text-red-400"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
