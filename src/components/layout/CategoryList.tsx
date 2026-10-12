"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";

import type { ResolvedNav } from "@/lib/storefrontNav";

/**
 * One embossed pill per category: a hairline of white along its top edge and a
 * soft shadow under it, so the row reads as a raised key rather than a line in
 * a table. On hover it lifts a little and the shop's red arrives in the text,
 * the border and the shadow at once.
 */
const ITEM = [
  "group flex h-9 items-center justify-between gap-2 rounded-xl px-3.5 transition-all duration-200",
  "border border-neutral-200/70 bg-white dark:border-white/10 dark:bg-neutral-800/90",
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(0,0,0,0.04)]",
  "dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.3)]",
  "hover:border-red-400/50 hover:shadow-[0_4px_12px_rgba(220,38,38,0.12)]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
  "motion-safe:hover:-translate-y-0.5",
].join(" ");

/** The pill the visitor is already on: pressed in rather than raised. */
const CURRENT =
  "group flex h-9 items-center justify-between gap-2 rounded-xl border border-red-500/40 bg-red-50 px-3.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent dark:border-red-400/40 dark:bg-red-500/10";

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
  const pathname = usePathname();
  const query = useSearchParams().get("q");

  const isCurrent = ({ href }: ResolvedNav) => {
    const [path, search] = href.split("?");
    if (path !== pathname) return false;
    if (!search) return true;
    return new URLSearchParams(search).get("q") === query;
  };

  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const current = isCurrent(item);
        return (
          <li key={`${item.href}-${i}`}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={current ? CURRENT : ITEM}
            >
              <span
                className={`min-w-0 truncate text-[11px] font-bold uppercase leading-4 tracking-wider transition-colors duration-200 ${
                  current
                    ? "text-red-600 dark:text-red-300"
                    : "text-neutral-800 group-hover:text-red-600 dark:text-neutral-200 dark:group-hover:text-red-400"
                }`}
                title={item.label}
              >
                {item.label}
              </span>
              <ChevronRight
                className={`h-3 w-3 shrink-0 transition-all duration-200 ${
                  current
                    ? "text-red-600 dark:text-red-300"
                    : "text-neutral-400 group-hover:text-red-600 motion-safe:group-hover:translate-x-0.5 dark:group-hover:text-red-400"
                }`}
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
