import { Cog, Flame, Layers, Leaf, Package, Shield, Wind, Wrench, type LucideIcon } from "lucide-react";

import type { Category, CategoryNode } from "@/types";

interface CategoryCopy {
  icon: LucideIcon;
  /** Meta description and hero subtitle for the category page. */
  description: string;
}

// Keyed by backend category slug (the taxonomy in the e7c4b19a2f60 migration):
// the seven groups and the sub-categories with something of their own to say.
// Unknown slugs fall back to DEFAULT_COPY.
const COPY: Record<string, CategoryCopy> = {
  "nargile-takimlari": {
    icon: Wind,
    description: "Çelik, klasik, Rus ve masaüstü nargile takımları. Kafe ve işletmelere toptan ve bayi fiyatlarıyla hızlı tedarik.",
  },
  "celik-takimlar": {
    icon: Shield,
    description: "Paslanmaz çelik nargile takımları: yoğun kullanıma dayanıklı, uzun ömürlü gövdeler.",
  },
  luleler: {
    icon: Layers,
    description: "Phunnel ve killer, sırlı ve sırsız, toprak, seramik, cam ve silikon lüleler. Isıyı dengeli dağıtan profesyonel modeller.",
  },
  "kozlukler-isi-yonetimi": {
    icon: Flame,
    description: "Közlükler (HMD), folyo, rüzgarlık ve maşalar: içim boyunca ısıyı sabit tutan ekipmanlar.",
  },
  "marpuc-ve-hortumlar": {
    icon: Wrench,
    description: "Silikon ve klasik marpuçlar, uçlar ve adaptörler: rahat çekim için doğru hortum.",
  },
  "sipsiler-ve-aksesuarlar": {
    icon: Cog,
    description: "Sipsiler, contalar, yedek parçalar, temizlik ürünleri ve taşıma çantaları.",
  },
  "nargile-komurleri": {
    icon: Flame,
    description: "Uzun yanan, kokusuz hindistan cevizi ve hızlı yanan nargile kömürleri; kilogram ve koli seçenekleriyle toptan tedarik.",
  },
  "tutun-bitkisel-ve-sarf": {
    icon: Leaf,
    description: "Bitkisel karışımlar ve sarf malzemeleri: işletmenizin günlük tüketimi için toptan tedarik.",
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
