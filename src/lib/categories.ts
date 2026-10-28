import { Cog, Flame, Layers, Leaf, Package, Shield, Wind, Wrench, type LucideIcon } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";
import type { Category, CategoryNode } from "@/types";

interface CategoryCopy {
  icon: LucideIcon;
  /** Meta description and hero subtitle for the category page. */
  description: string;
}

/** The written copy in each language: Turkish is the source, English and Arabic the trade's own words for it. */
interface WrittenCopy {
  icon: LucideIcon;
  description: Record<Locale, string>;
}

// Keyed by backend category slug (the taxonomy in the b8e3f17c4d92 migration):
// the eight groups and the sub-categories with something of their own to say.
// Unknown slugs fall back to DEFAULT_COPY.
const COPY: Record<string, WrittenCopy> = {
  "nargile-takimlari": {
    icon: Wind,
    description: {
      tr: "Çantalı, kafe tipi ve masaüstü nargile takımları. Kafe ve işletmelere toptan ve bayi fiyatlarıyla hızlı tedarik.",
      en: "Hookah sets with carry bags, café-grade and tabletop hookahs. Fast supply for cafés and lounges at wholesale and dealer prices.",
      ar: "شيشة كاملة مع حقيبة، وشيش للمقاهي وشيش طاولة صغيرة. توريد سريع للمقاهي والمحلات بأسعار الجملة والموزعين.",
    },
  },
  "cantali-nargile-takimlari": {
    icon: Shield,
    description: {
      tr: "Taşıma çantasıyla gelen nargile takımları: güvenle taşınır, düzenli saklanır.",
      en: "Hookah sets that come with a carry bag: safe to carry, neatly stored.",
      ar: "أطقم شيشة مع حقيبة حمل: تُنقل بأمان وتُحفظ بترتيب.",
    },
  },
  luleler: {
    icon: Layers,
    description: {
      tr: "Killer, phunnel, cam ve silikon lüleler. Isıyı dengeli dağıtan profesyonel modeller.",
      en: "Killer, Phunnel, glass and silicone hookah bowls. Professional bowls that spread the heat evenly.",
      ar: "رؤوس شيشة Killer وPhunnel وزجاج وسيليكون. موديلات احترافية توزّع الحرارة بالتساوي.",
    },
  },
  "sarf-malzemeleri": {
    icon: Leaf,
    description: {
      tr: "Nargile kömürleri, bitkisel ürünler, folyolar, sipsiler ve kullan at marpuçlar: işletmenizin günlük tüketimi için toptan tedarik.",
      en: "Hookah charcoal, herbal products, foil, sipsi pipes and disposable hookah hoses: wholesale supply for your venue's everyday use.",
      ar: "فحم شيشة، منتجات عشبية، ورق ألمنيوم، سبسي ولي شيشة للاستخدام مرة واحدة: توريد بالجملة لاستهلاك محلك اليومي.",
    },
  },
  aksesuarlar: {
    icon: Cog,
    description: {
      tr: "Askılı sipsiler, tütün çatalları, matlar, şerbetlikler, çantalar, elekler, köz tavaları, bacalar, rüzgarlıklar ve maşalar.",
      en: "Sipsi pipes with lanyards, tobacco forks, mats, molasses catchers, bags, screens, charcoal pans, charcoal chimney starters, wind covers and charcoal tongs.",
      ar: "سبسي مع علّاقة، شوك المعسل، حصائر، مصائد المعسل، حقائب، شبكات، صحون فحم، مداخن إشعال الفحم، أغطية رأس الشيشة وملاقط فحم.",
    },
  },
  marpuclar: {
    icon: Wrench,
    description: {
      tr: "Silikon ve deri marpuçlar, silikon hortumlar ve marpuç başlıkları: rahat çekim için doğru hortum.",
      en: "Silicone and leather hookah hoses, silicone tubing and hose handles: the right hose for a smooth draw.",
      ar: "لي شيشة سيليكون وجلد، خراطيم سيليكون ومقابض لي: الخرطوم المناسب لسحبة سلسة.",
    },
  },
  "isi-yonetim-araclari": {
    icon: Flame,
    description: {
      tr: "Közlükler (HMD) ve ısı yönetim araçları: içim boyunca ısıyı sabit tutan ekipmanlar.",
      en: "Heat management devices (HMD) and heat control accessories that keep the heat steady for the whole session.",
      ar: "منظمات حرارة الشيشة (كالود) وأدوات التحكم بالحرارة التي تحافظ على حرارة ثابتة طوال الجلسة.",
    },
  },
  "yedek-parca": {
    icon: Package,
    description: {
      tr: "Nargile şişeleri, rezistans ve ızgaralar, adaptör ve difüzörler, yapıştırıcılar, bilyalar, contalar ve bez bantlar.",
      en: "Hookah bases, heating elements and grates, adapters and diffusers, adhesives, purge valve balls, grommets and cloth tape.",
      ar: "قواعد شيشة، مقاومات تسخين وشبكات، محولات وناشرات، مواد لاصقة، كرات صمام التنفيس، جلدات وأشرطة قماشية.",
    },
  },
  yakicilar: {
    icon: Flame,
    description: {
      tr: "Elektrikli ocaklar, pürmüzler, çakmaklar ve gazlar: kömürü hızlı ve güvenle yakmak için.",
      en: "Electric charcoal burners, torches, lighters and lighter gas: for lighting your charcoal quickly and safely.",
      ar: "مواقد فحم كهربائية، ولاعات شعلة، ولاعات وغاز: لإشعال الفحم بسرعة وأمان.",
    },
  },
  "nargile-komurleri": {
    icon: Flame,
    description: {
      tr: "Uzun yanan, kokusuz hindistan cevizi ve hızlı yanan nargile kömürleri; kilogram ve koli seçenekleriyle toptan tedarik.",
      en: "Long-burning, odourless natural coconut hookah charcoal and quick-light charcoal, supplied wholesale by the kilo or by the case.",
      ar: "فحم شيشة من جوز الهند الطبيعي طويل الاشتعال وبدون رائحة، وفحم سريع الاشتعال؛ توريد بالجملة بالكيلو أو بالكرتونة.",
    },
  },
};

// The current taxonomy's names for two of the groups above, word for word the
// same shelves.
COPY.komurler = COPY["nargile-komurleri"];
COPY.kozlukler = COPY["isi-yonetim-araclari"];

const DEFAULT_COPY: WrittenCopy = {
  icon: Package,
  description: {
    tr: "Orijinal nargile ürünleri, kömür ve lüleler. Kafe, toptancı ve bayilere özel fiyatlar.",
    en: "Professional hookah supplies, hookah charcoal and bowls. Special prices for cafés, wholesalers and dealers.",
    ar: "مستلزمات شيشة احترافية، فحم ورؤوس شيشة. أسعار خاصة للمقاهي وتجار الجملة والموزعين.",
  },
};

/** Whether this category has copy written for it, rather than the shared default. */
export const hasCategoryCopy = (slug: string | null | undefined) => !!slug && slug in COPY;

/** The category's icon and copy, in `locale` (Turkish unless asked). */
export function categoryCopy(slug: string | null | undefined, locale: Locale = "tr"): CategoryCopy {
  const copy = (slug && COPY[slug]) || DEFAULT_COPY;
  return { icon: copy.icon, description: copy.description[locale] };
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

/** A group and the subcategories of it that list something, for the row under a category's heading. */
export interface CategoryFamily {
  group: Category;
  members: Category[];
}

/**
 * The family a category belongs to: its group (itself, when it is one) and the
 * group's subcategories with products, in menu order — so "Nargile Takımları"
 * leads on to each kind of set, and each kind to its neighbours and back to
 * all of them. Null when the category has no group or the group no stocked
 * subcategory.
 */
export function categoryFamily(category: Category, categories: Category[]): CategoryFamily | null {
  const group = category.parent_id === null ? category : categories.find((c) => c.id === category.parent_id);
  if (!group) return null;
  const members = categories
    .filter((c) => c.parent_id === group.id && (c.product_count ?? 0) > 0)
    .sort(bySortThenName);
  return members.length > 0 ? { group, members } : null;
}

/** The category's group, when it is under one. */
export const parentCategory = (category: Category | null | undefined, categories: Category[]): Category | undefined =>
  category?.parent_id != null ? categories.find((c) => c.id === category.parent_id) : undefined;
