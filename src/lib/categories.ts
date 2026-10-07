import { Cog, Flame, Layers, Leaf, Package, Shield, Wind, Wrench, type LucideIcon } from "lucide-react";

import type { Category, CategoryNode } from "@/types";

interface CategoryCopy {
  icon: LucideIcon;
  /** Meta description and hero subtitle for the category page. */
  description: string;
}

// Keyed by backend category slug. Unknown slugs fall back to DEFAULT_COPY.
const COPY: Record<string, CategoryCopy> = {
  "nargile-takimlari": {
    icon: Wind,
    description:
      "Kafe ve işletmeler için dayanıklı, endüstriyel nargile takımları. Toptan ve bayi fiyatlarıyla hızlı tedarik.",
  },
  komurler: {
    icon: Flame,
    description:
      "Uzun yanan, kokusuz nargile kömürleri. Kilogram ve koli seçenekleriyle toptan kömür tedariki.",
  },
  luleler: {
    icon: Layers,
    description:
      "Seramik, silikon ve kil nargile lüleleri. Isıyı dengeli dağıtan profesyonel lüle modelleri.",
  },
  "celik-takimlar": {
    icon: Shield,
    description: "Paslanmaz çelik nargile takımları: yoğun kullanıma dayanıklı, uzun ömürlü gövdeler.",
  },
  "tuketim-sarf": {
    icon: Leaf,
    description: "Nargile kömürleri ve sarf malzemeleri: işletmenizin günlük tüketimi için toptan tedarik.",
  },
  "donanim-parcalar": {
    icon: Cog,
    description: "Lüleler, közlükler, marpuçlar, yedek şişeler ve aksesuarlar: nargileniz için tüm parçalar.",
  },
  aksesuarlar: {
    icon: Wrench,
    description: "Hortum, maşa, rüzgarlık ve yedek parçalar: işletmenizin ihtiyaç duyduğu tüm nargile aksesuarları.",
  },
};

const DEFAULT_COPY: CategoryCopy = {
  icon: Package,
  description: "Endüstriyel nargile ürünleri, kömür ve lüleler. Kafe, toptancı ve bayilere özel fiyatlar.",
};

export function categoryCopy(slug: string | null | undefined): CategoryCopy {
  return (slug && COPY[slug]) || DEFAULT_COPY;
}

const bySortThenName = (a: Category, b: Category) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "tr");

/** Two-level tree: top-level groups, each with its subcategories, in menu order. */
export function categoryTree(categories: Category[]): CategoryNode[] {
  const children = new Map<number, Category[]>();
  for (const c of categories) {
    if (c.parent_id !== null) children.set(c.parent_id, [...(children.get(c.parent_id) ?? []), c]);
  }
  return categories
    .filter((c) => c.parent_id === null)
    .sort(bySortThenName)
    .map((c) => ({ ...c, children: (children.get(c.id) ?? []).sort(bySortThenName) }));
}

/** The category's top-level group (itself when top-level). */
export function topLevelOf(category: Category, categories: Category[]): Category {
  return category.parent_id === null ? category : (categories.find((c) => c.id === category.parent_id) ?? category);
}
