import Link from "@/components/i18n/Link";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { getMessages } from "@/lib/i18n/server";
import type { CategoryFamily } from "@/lib/categories";

const PILL =
  "inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:focus-visible:outline-white";
const IDLE =
  "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 dark:border-border dark:bg-transparent dark:text-neutral-300 dark:hover:border-white dark:hover:text-white";
const CURRENT = "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";

/**
 * The category's family under its heading: "Tümü" (the group's own page),
 * then each of its kinds, the one on screen marked. Plain links in the
 * server's HTML, so every kind is a click — and a crawl — away from the group,
 * and the group from each kind. One scrolling line on a phone.
 */
export async function CategoryFamilyNav({ family, current }: { family: CategoryFamily; current: string }) {
  const t = await getMessages(catalogMessages);
  const links = [
    { slug: family.group.slug, name: t.familyAll },
    ...family.members.map((c) => ({ slug: c.slug, name: c.name })),
  ];
  return (
    <nav aria-label={t.family(family.group.name)} className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <ul className="flex gap-1.5 md:flex-wrap">
        {links.map(({ slug, name }) => {
          const here = slug === current;
          return (
            <li key={slug}>
              <Link
                href={`/catalog/${slug}`}
                aria-current={here ? "page" : undefined}
                className={`${PILL} ${here ? CURRENT : IDLE}`}
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
