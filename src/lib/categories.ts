import { Cog, Flame, Layers, Leaf, Package, Shield, Wind, Wrench, type LucideIcon } from "lucide-react";

import type { Category, CategoryNode } from "@/types";

interface CategoryCopy {
  icon: LucideIcon;
  /** Meta description and hero subtitle for the category page. */
  description: string;
}

// Keyed by backend category slug (the taxonomy in the b8e3f17c4d92 migration):
// the eight groups and the sub-categories with something of their own to say.
// Unknown slugs fall back to DEFAULT_COPY.
const COPY: Record<string, CategoryCopy> = {
  "nargile-takimlari": {
    icon: Wind,
    description: "Çantalı, kafe tipi ve masaüstü nargile takımları. Kafe ve işletmelere toptan ve bayi fiyatlarıyla hızlı tedarik.",
  },
  "cantali-nargile-takimlari": {
    icon: Shield,
    description: "Taşıma çantasıyla gelen nargile takımları: güvenle taşınır, düzenli saklanır.",
  },
  luleler: {
    icon: Layers,
    description: "Killer, phunnel, cam ve silikon lüleler. Isıyı dengeli dağıtan profesyonel modeller.",
  },
  "sarf-malzemeleri": {
    icon: Leaf,
    description: "Nargile kömürleri, bitkisel ürünler, folyolar, sipsiler ve kullan at marpuçlar: işletmenizin günlük tüketimi için toptan tedarik.",
  },
  aksesuarlar: {
    icon: Cog,
    description: "Askılı sipsiler, tütün çatalları, matlar, şerbetlikler, çantalar, elekler, köz tavaları, bacalar, rüzgarlıklar ve maşalar.",
  },
  marpuclar: {
    icon: Wrench,
    description: "Silikon ve deri marpuçlar, silikon hortumlar ve marpuç başlıkları: rahat çekim için doğru hortum.",
  },
  "isi-yonetim-araclari": {
    icon: Flame,
    description: "Közlükler (HMD) ve ısı yönetim araçları: içim boyunca ısıyı sabit tutan ekipmanlar.",
  },
  "yedek-parca": {
    icon: Package,
    description: "Nargile şişeleri, rezistans ve ızgaralar, adaptör ve difüzörler, yapıştırıcılar, bilyalar, contalar ve bez bantlar.",
  },
  yakicilar: {
    icon: Flame,
    description: "Elektrikli ocaklar, pürmüzler, çakmaklar ve gazlar: kömürü hızlı ve güvenle yakmak için.",
  },
  "nargile-komurleri": {
    icon: Flame,
    description: "Uzun yanan, kokusuz hindistan cevizi ve hızlı yanan nargile kömürleri; kilogram ve koli seçenekleriyle toptan tedarik.",
  },
};

// The current taxonomy's names for two of the groups above, word for word the
// same shelves.
COPY.komurler = COPY["nargile-komurleri"];
COPY.kozlukler = COPY["isi-yonetim-araclari"];

const DEFAULT_COPY: CategoryCopy = {
  icon: Package,
  description: "Endüstriyel nargile ürünleri, kömür ve lüleler. Kafe, toptancı ve bayilere özel fiyatlar.",
};

/** Whether this category has copy written for it, rather than the shared default. */
export const hasCategoryCopy = (slug: string | null | undefined) => !!slug && slug in COPY;

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
