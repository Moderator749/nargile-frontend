import Link from "next/link";

import { categoryTree, topLevelOf } from "@/lib/categories";
import type { Category } from "@/types";

interface CategoryTabsProps {
  categories: Category[];
  /** Active category slug; null for "all". */
  active: string | null;
}

const base =
  "inline-flex h-8 shrink-0 snap-start items-center whitespace-nowrap rounded-full px-4 text-[13px] tracking-tight transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const idle = "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground";
const current = "bg-foreground font-medium text-background";
const subBase =
  "inline-flex h-7 shrink-0 snap-start items-center whitespace-nowrap rounded-full px-3 text-xs tracking-tight ring-1 ring-inset transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const subIdle = "text-muted-foreground ring-border hover:text-foreground hover:ring-foreground/20";
const subCurrent = "bg-white font-medium text-foreground ring-foreground/20 dark:bg-white/10";

const rowClass = "-mx-1 flex snap-x gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Real links (crawlable, one URL per category) styled as tabs: the top-level
 * groups, then the active group's subcategories.
 */
export function CategoryTabs({ categories, active }: CategoryTabsProps) {
  const tree = categoryTree(categories);
  const activeCategory = categories.find((c) => c.slug === active);
  const group = activeCategory ? topLevelOf(activeCategory, categories) : null;
  const subs = tree.find((g) => g.id === group?.id)?.children ?? [];

  const tabs: { slug: string | null; name: string; href: string }[] = [
    { slug: null, name: "Tümü", href: "/catalog" },
    ...tree.map((c) => ({ slug: c.slug, name: c.name, href: `/catalog/${c.slug}` })),
  ];

  return (
    <nav aria-label="Kategoriler" className="min-w-0 space-y-1">
      <ul className={rowClass}>
        {tabs.map((tab) => {
          const isActive = tab.slug === (group?.slug ?? null);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={tab.slug === active ? "page" : undefined}
                className={`${base} ${isActive ? current : idle}`}
              >
                {tab.name}
              </Link>
            </li>
          );
        })}
      </ul>
      {subs.length > 0 && (
        <ul className={rowClass} aria-label={`${group?.name} alt kategorileri`}>
          {subs.map((c) => (
            <li key={c.id}>
              <Link
                href={`/catalog/${c.slug}`}
                aria-current={c.slug === active ? "page" : undefined}
                className={`${subBase} ${c.slug === active ? subCurrent : subIdle}`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
