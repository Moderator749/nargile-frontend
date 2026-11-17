import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { productMessages } from "@/lib/i18n/messages/product";
import { categoryHref } from "@/lib/seo";
import type { Category } from "@/types";

/**
 * "Tüm Nargile Lüleleri →" under the product's own text: the way on to every
 * product of its primary category, for a shopper weighing alternatives, and
 * an internal link to the category in the words people search it with (the
 * category's own name, not "ürünleri" tacked on where the name is already a
 * plural). A card the width of the column, quiet until hovered, so it never
 * competes with "Sepete Ekle" above it.
 */
export function ProductCategoryLink({ category }: { category: Category }) {
  const t = useMessages(productMessages);
  const count = category.product_count;
  return (
    <Link
      href={categoryHref(category.slug)}
      className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 transition-colors duration-200 hover:border-foreground/20 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground ring-1 ring-inset ring-border transition-colors duration-200 group-hover:text-foreground">
          <LayoutGrid className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">{t.allOfCategory(category.name)}</span>
          {count ? <span className="block text-xs text-muted-foreground">{t.categoryCount(count)}</span> : null}
        </span>
      </span>
      <ArrowRight
        aria-hidden
        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground motion-safe:group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:motion-safe:group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
