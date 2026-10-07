import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { catalogSearchHref } from "@/lib/home";
import type { Brand, Category } from "@/types";

interface BrandFiltersProps {
  brands: Brand[];
  /** Set types: the subcategories of "Nargile Takımları". */
  types: Category[];
}

const linkClass =
  "group flex items-center justify-between gap-3 whitespace-nowrap rounded-full bg-[#f5f5f7] px-4 py-2 dark:bg-white/[0.06] dark:hover:bg-white/10 lg:dark:bg-transparent text-sm font-medium tracking-tight text-foreground transition-colors duration-200 hover:bg-[#ececef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:-mx-3 lg:rounded-xl lg:bg-transparent lg:px-3 lg:text-[15px]";

/**
 * Module 3: brand / type side-filters. A white panel beside the slider on
 * desktop, a chip row on mobile. Brands come from /admin/brands; types are the
 * set subcategories from /admin/categories.
 */
export function BrandFilters({ brands, types }: BrandFiltersProps) {
  const groups = [
    { title: "Markalar", items: brands.map((b) => ({ key: `b${b.id}`, label: b.name, href: catalogSearchHref(b.search_term) })) },
    { title: "Takımlar", items: types.map((c) => ({ key: `c${c.id}`, label: c.name, href: `/catalog/${c.slug}` })) },
  ].filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <aside aria-label="Markalar ve tipler" className="rounded-[2rem] bg-white p-6 shadow-sm shadow-black/[0.04] lg:p-7 dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.06]">
      <div className="flex gap-8 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-7 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <div key={group.title} className="shrink-0">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">{group.title}</h2>
            <ul className="mt-3 flex gap-2 lg:flex-col lg:gap-0.5">
              {group.items.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                    <ArrowUpRight
                      className="hidden h-4 w-4 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 lg:block"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
