"use client";

import { useSearchParams } from "next/navigation";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { usePagePath } from "@/components/i18n/navigation";
import Link from "@/components/i18n/Link";
import { navLabel, type ResolvedNav } from "@/lib/storefrontNav";

/**
 * One line of text per category, on the page itself: no box, no shadow, a
 * hairline between rows (on the <li>, so the last one goes without). Hover
 * brings the shop's red into the text and lifts the row to white — the page is
 * #f5f5f7, so a grey wash would not show.
 */
const ROW =
  "group flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
const ITEM = `${ROW} text-gray-700 hover:bg-white hover:text-red-700 dark:text-neutral-300 dark:hover:bg-white/[0.04] dark:hover:text-red-400`;

/** The row the visitor is already on: in red, on the same faint wash. */
const CURRENT = `${ROW} bg-white text-red-700 dark:bg-white/[0.04] dark:text-red-400`;
/** An entry the admin marked red ("Kırmızı vurgula": the deals). */
const ACCENT = `${ROW} text-red-700 hover:bg-white dark:text-red-400 dark:hover:bg-white/[0.04]`;

/**
 * The category column's list.
 *
 * Shared by the sidebar and the phone drawer so the two cannot drift apart.
 * The row the visitor is on is marked — matched on the path for a category page
 * and on the search for a brand, which is how those entries link.
 */
export function CategoryList({
  items,
  onNavigate,
}: {
  items: ResolvedNav[];
  /** Close the drawer on a tap; the sidebar has nothing to close. */
  onNavigate?: () => void;
}) {
  // Without its language (/en/cart is /cart), as every check below expects.
  const pathname = usePagePath();
  const locale = useLocale();
  const query = useSearchParams().get("q");

  const isCurrent = ({ href }: ResolvedNav) => {
    const [path, search] = href.split("?");
    if (path !== pathname) return false;
    if (!search) return true;
    return new URLSearchParams(search).get("q") === query;
  };

  return (
    <ul>
      {items.map((item, i) => {
        const current = isCurrent(item);
        const label = navLabel(item.label, locale);
        return (
          <li key={`${item.href}-${i}`} className="border-b border-border last:border-0">
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={current ? CURRENT : item.accent ? ACCENT : ITEM}
            >
              {/* No trailing ">": a row is a link to its page, and none opens a sub-menu. */}
              <span className="min-w-0 truncate" title={label}>
                {label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
