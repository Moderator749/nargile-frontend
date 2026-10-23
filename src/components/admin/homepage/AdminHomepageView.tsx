"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, FolderTree, Languages, Loader2, RotateCcw, Save, Smartphone } from "lucide-react";

import { AdminCategoriesView } from "@/components/admin/AdminCategoriesView";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { TranslationsTab } from "@/components/admin/homepage/TranslationsTab";
import {
  BentoForm,
  BrandShowcaseForm,
  CampaignsForm,
  LoyaltyForm,
  LulesForm,
  PerksForm,
  PicksForm,
  ProductRowForm,
  StatementForm,
} from "@/components/admin/homepage/sectionCopyForms";
import { isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import {
  SeoIntroTab,
  BrandsTab,
  DealsTab,
  FooterTab,
  HeroTab,
  MobileTab,
  NavigationTab,
  SectionsTab,
  ShowcaseTab,
} from "@/components/admin/homepage/sections";
import { Alert } from "@/components/ui/Alert";
import { Drawer } from "@/components/ui/Drawer";
import { adminGetHomepage, adminListBrands, adminSaveHomepage } from "@/lib/adminApi";
import { fetchCategories } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import { brokenCategoryLink } from "@/lib/catalogLinks";
import { DEFAULT_HOMEPAGE, SECTION_LABELS, resolveHomepage } from "@/lib/homepage";
import { refreshStorefront } from "@/lib/revalidate";
import type { Brand, Category, HomeBlock, Homepage, HomeSections } from "@/types";

type EditorKey =
  | "hero"
  | "perks"
  | "picks"
  | "lules"
  | "sultanpuan"
  | "kumbara"
  | "bento"
  | "deals"
  | "campaigns"
  | "statement"
  | "brands"
  | "brand_showcase"
  | "kozlukler"
  | "games"
  | "showcase"
  | "seo"
  | "footer"
  | "mobile"
  | "catalog"
  | "translations";

/**
 * Each editor the drawer opens: what it is called, the part of the document
 * it edits (none for those that save on their own), and the switches of the
 * sections it feeds, for the "hidden" note.
 */
const EDITORS: Record<
  EditorKey,
  { title: string; hint: string; doc?: keyof Homepage; sections?: (keyof HomeSections)[]; size: "md" | "lg" }
> = {
  hero: {
    title: "Hero Slider & Kategori Menüleri",
    hint: "Slaytlar ve kutular kendi sayfalarında; slider’ın yanındaki ve üstündeki menüler burada.",
    doc: "navigation",
    sections: ["hero"],
    size: "lg",
  },
  perks: {
    title: "Avantaj Çubuğu",
    hint: "Hero’nun altındaki üç avantaj: etiket, yazı ve simge.",
    doc: "perks",
    sections: ["perks"],
    size: "md",
  },
  picks: {
    title: "Sizin İçin Seçtiklerimiz",
    hint: "Başlık, sekmeler ve ücretsiz kargo notu.",
    doc: "picks",
    sections: ["picks"],
    size: "md",
  },
  lules: {
    title: "Lüle Alırken Kararsız Kalacaksınız",
    hint: "Başlık, çeşitler, bağlantı ve kurye notu.",
    doc: "lules",
    sections: ["lules"],
    size: "md",
  },
  sultanpuan: { title: "SultanPuan Bandı", hint: "Bandın yazıları.", doc: "sultanpuan", sections: ["sultanpuan"], size: "md" },
  kumbara: { title: "Kumbara Bandı", hint: "Bandın yazıları.", doc: "kumbara", sections: ["kumbara"], size: "md" },
  bento: {
    title: "Görsel Vitrin",
    hint: "Üç yatay (3:2) kutu: görsel, üzerindeki yazılar (slider gibi sürükle, boyutlandır, renklendir), koyu katman ve bağlantı.",
    doc: "bento",
    sections: ["bento"],
    size: "lg",
  },
  deals: { title: "Fırsatları Kaçırma", hint: "Fırsat vitrininin başlığı ve alt metni.", doc: "deals", sections: ["deals"], size: "md" },
  campaigns: {
    title: "Kampanya Kutuları",
    hint: "Büyük kutu ve üç küçük kutu: görsel, yazılar ve bağlantı.",
    doc: "campaigns",
    sections: ["campaigns"],
    size: "lg",
  },
  statement: {
    title: "Sektörde Referans Noktası",
    hint: "Başlık ve tanıtım metni.",
    doc: "statement",
    sections: ["promos"],
    size: "md",
  },
  brand_showcase: {
    title: "Markalarımız",
    hint: "Başlık, buton ve her markanın tanıtımı ile logosu.",
    doc: "brand_showcase",
    sections: ["brand_showcase"],
    size: "lg",
  },
  kozlukler: { title: "Közlükler", hint: "Ürün satırının yazıları.", doc: "kozlukler", sections: ["kozlukler"], size: "md" },
  games: { title: "Oyun & Eğlence", hint: "Ürün satırının yazıları.", doc: "games", sections: ["games"], size: "md" },
  brands: {
    title: "Markalar Şeridi",
    hint: "Markalar listesinden gelir; üst ve alt şerit aynıdır.",
    doc: "brands",
    sections: ["brands_top", "brands"],
    size: "md",
  },
  showcase: { title: "Premium Ürün Yelpazesi", hint: "Başlık ve kategori kutuları.", doc: "showcase", sections: ["showcase"], size: "md" },
  // The homepage switch for this passage is the one still called "about".
  seo: { title: "Alt SEO Metni", hint: "Ana sayfayı ve kategori sayfalarını kapatan tanıtım metni.", doc: "seo_intro", sections: ["about"], size: "md" },
  footer: { title: "Footer", hint: "İletişim, kolonlar ve sosyal medya; tüm sayfalarda.", doc: "footer", sections: ["footer"], size: "lg" },
  mobile: { title: "Mobil Yönetim", hint: "Telefonda (768px altı) gizlenecek bölümler.", doc: "mobile", size: "md" },
  catalog: { title: "Katalog Kategorileri", hint: "Her değişiklik kendi kaydedilir.", size: "lg" },
  // The homepage texts in English and Arabic; saves on its own.
  translations: { title: "Çeviriler (EN/AR)", hint: "Ana sayfa metinlerinin İngilizcesi ve Arapçası; kendi kaydedilir.", size: "lg" },
};

/** The pencil on a section's row opens these; a section missing here has nothing to set. */
const SECTION_EDITOR: Partial<Record<keyof HomeSections, EditorKey>> = {
  hero: "hero",
  perks: "perks",
  picks: "picks",
  lules: "lules",
  sultanpuan: "sultanpuan",
  kumbara: "kumbara",
  bento: "bento",
  deals: "deals",
  campaigns: "campaigns",
  promos: "statement",
  brand_showcase: "brand_showcase",
  kozlukler: "kozlukler",
  games: "games",
  brands_top: "brands",
  brands: "brands",
  showcase: "showcase",
  about: "seo",
  footer: "footer",
};

/** Page-wide editors, above the list of sections. */
const PAGE_EDITORS: { key: EditorKey; Icon: typeof Smartphone }[] = [
  { key: "mobile", Icon: Smartphone },
  { key: "catalog", Icon: FolderTree },
  { key: "translations", Icon: Languages },
];

/** Deep links (/admin/homepage?tab=katalog-kategorileri), e.g. from the retired /admin/categories. */
const TAB_PARAM: Record<string, EditorKey> = {
  "katalog-kategorileri": "catalog",
  "kategori-duzenle": "hero",
  "mobil-yonetim": "mobile",
  ceviriler: "translations",
};

const KEYS = Object.keys(DEFAULT_HOMEPAGE) as (keyof Homepage)[];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * What to store: every section that differs from the storefront default. A
 * section put back to the default is dropped, so it follows the default again.
 */
function toPayload(doc: Homepage): Partial<Homepage> {
  const out: Partial<Homepage> = {};
  for (const key of KEYS) {
    if (!same(doc[key], DEFAULT_HOMEPAGE[key])) (out as Record<string, unknown>)[key] = doc[key];
  }
  return out;
}

const SECTION_NAMES: Record<string, string> = {
  navigation: "Kategori Düzenle",
  deals: "Fırsatlar",
  brands: "Markalar Şeridi",
  showcase: "Premium Yelpaze",
  seo_intro: "Alt SEO Metni",
  footer: "Footer",
  mobile: "Mobil Yönetim",
  perks: "Avantaj Çubuğu",
  picks: "Sizin İçin Seçtiklerimiz",
  lules: "Lüle",
  sultanpuan: "SultanPuan Bandı",
  kumbara: "Kumbara Bandı",
  campaigns: "Kampanya Kutuları",
  bento: "Görsel Vitrin",
  statement: "Sektörde Referans Noktası",
  brand_showcase: "Markalarımız",
  kozlukler: "Közlükler",
  games: "Oyun & Eğlence",
};

/** The first problem, said where it is: "Footer › blog › links › 2 › href". */
function saveError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 422) {
    const detail = (err.response.data as { detail?: unknown })?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { loc?: (string | number)[]; msg?: string };
      const path = (first.loc ?? []).filter((p) => p !== "body");
      const where = path.map((p, i) => (i === 0 ? (SECTION_NAMES[String(p)] ?? p) : typeof p === "number" ? p + 1 : p)).join(" › ");
      return `Kaydedilemedi — ${where}: ${first.msg ?? "geçersiz değer"}`;
    }
  }
  return getApiErrorMessage(err, "Kaydedilemedi.");
}

/** Links the server will refuse, or that would 404, caught before the request with a readable message. */
function checkLinks(doc: Homepage, categories: Category[]): string | null {
  const bad = (href: string | null | undefined) => !!href && !isSiteOrHttpsLink(href);
  for (const [name, list] of [
    ["Üst Kategori", doc.navigation.top],
    ["Sol Kategori", doc.navigation.sidebar],
    ["Premium Yelpaze", doc.showcase.tiles],
  ] as const) {
    const i = list.findIndex((item) => bad(item.href));
    if (i >= 0) return `${name}, ${i + 1}. öğe: bağlantı / ile ya da https:// ile başlamalı.`;
    // A cleared link with nothing else behind it would quietly become a search.
    const empty = list.findIndex((item) => item.href === "" && !item.slug && !item.brand);
    if (empty >= 0) return `${name}, ${empty + 1}. öğe: bağlantı boş.`;
    const nameless = list.findIndex((item) => !item.label.trim() && !item.slug && !item.brand);
    if (nameless >= 0) return `${name}, ${nameless + 1}. öğe: isim boş.`;
    const dead = list.findIndex((item) => brokenCategoryLink(item.href, categories));
    if (dead >= 0) return `${name}, ${dead + 1}. öğe: “${list[dead].href}” var olmayan bir kategoriye gidiyor (404).`;
  }
  const f = doc.footer;
  for (const column of [f.blog, f.info, f.faq]) {
    const i = column.links.findIndex((l) => bad(l.href) || !l.href);
    if (i >= 0) return `Footer, “${column.title}” ${i + 1}. bağlantı: / ile ya da https:// ile başlamalı.`;
    if (bad(column.cta_href)) return `Footer, “${column.title}” alt butonu: bağlantı geçersiz.`;
  }
  const s = f.social.findIndex((l) => bad(l.href) || !l.href);
  if (s >= 0) return `Footer, sosyal medya ${s + 1}. bağlantı geçersiz.`;
  if (bad(f.whatsapp_href) || !f.whatsapp_href) return "Footer: WhatsApp bağlantısı https:// ile başlamalı.";
  const boxes = [doc.campaigns.lead, ...doc.campaigns.minis];
  const box = boxes.findIndex((b) => bad(b.href) || !b.href);
  if (box >= 0) return `Kampanya Kutuları, ${box === 0 ? "büyük kutu" : `küçük kutu ${box}`}: bağlantı / ile ya da https:// ile başlamalı.`;
  for (const [i, box] of doc.bento.boxes.entries()) {
    if (!box.image?.trim()) return `Görsel Vitrin, kutu ${i + 1}: görsel gerekli.`;
    if (bad(box.href) || !box.href) return `Görsel Vitrin, kutu ${i + 1}: bağlantı / ile ya da https:// ile başlamalı.`;
    const color = Object.values(box.text_colors ?? {}).find((c) => c && !/^#[0-9a-fA-F]{6}$/.test(c));
    if (color) return `Görsel Vitrin, kutu ${i + 1}: “${color}” geçerli bir renk değil (#RRGGBB).`;
  }
  if (bad(doc.lules.href) || !doc.lules.href) return "Lüle bölümü: “Tümünü gör” bağlantısı / ile ya da https:// ile başlamalı.";
  return null;
}

/**
 * Admin: "Ana Sayfa Düzenleme" — the homepage's sections in order, each with
 * its switch, and a pencil that opens its settings in a drawer; the page-wide
 * settings (phones, catalog categories, translations) open the same way.
 * Switches and moves save at once; the drawer's edits wait for "Kaydet".
 */
export function AdminHomepageView() {
  const [saved, setSaved] = useState<Homepage | null>(null);
  const [doc, setDoc] = useState<Homepage | null>(null);
  // Open on the editor a link asked for, else on the list.
  const router = useRouter();
  const requested = TAB_PARAM[useSearchParams().get("tab") ?? ""];
  const [editing, setEditing] = useState<EditorKey | null>(requested ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<keyof HomeSections | "order" | null>(null);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  /** The category tree changed (Katalog Kategorileri): the pickers and link checks follow it. */
  const reloadCategories = () => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  };

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      adminGetHomepage(controller.signal),
      fetchCategories(controller.signal).catch(() => []),
      adminListBrands(controller.signal).catch(() => []),
    ])
      .then(([settings, cats, brs]) => {
        const resolved = resolveHomepage(settings.data);
        setSaved(resolved);
        setDoc(resolved);
        setCategories(cats);
        setBrands(brs);
      })
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setLoadError(getApiErrorMessage(err, "Ana sayfa ayarları yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const dirty = useMemo(() => !!doc && !!saved && KEYS.some((k) => !same(doc[k], saved[k])), [doc, saved]);

  // Leaving with unsaved copy asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function persist(next: Homepage): Promise<Homepage> {
    const response = await adminSaveHomepage(toPayload(next));
    const resolved = resolveHomepage(response.data);
    setSaved(resolved);
    // The storefront caches these reads with the catalog; drop them now.
    await refreshStorefront();
    return resolved;
  }

  /** A switch saves on its own, on top of what is saved — never the unsaved edits. */
  async function toggle(key: keyof HomeSections, on: boolean) {
    if (!saved || !doc) return;
    setToggling(key);
    setResult(null);
    try {
      const stored = await persist({ ...saved, sections: { ...saved.sections, [key]: on } });
      setDoc((d) => (d ? { ...d, sections: stored.sections } : d));
      setResult({ kind: "success", text: `“${SECTION_LABELS[key].title}” ${on ? "gösteriliyor" : "gizlendi"}.` });
    } catch (err) {
      setResult({ kind: "error", text: saveError(err) });
    } finally {
      setToggling(null);
    }
  }

  /** A new order saves on its own too, on top of what is saved; false when it could not. */
  async function reorder(order: HomeBlock[]): Promise<boolean> {
    if (!saved) return false;
    setToggling("order");
    setResult(null);
    try {
      const stored = await persist({ ...saved, order });
      setDoc((d) => (d ? { ...d, order: stored.order } : d));
      setResult({ kind: "success", text: "Bölüm sırası kaydedildi; ana sayfa bu sırayla gösteriliyor." });
      return true;
    } catch (err) {
      setResult({ kind: "error", text: saveError(err) });
      return false;
    } finally {
      setToggling(null);
    }
  }

  async function save() {
    if (!doc) return;
    const problem = checkLinks(doc, categories);
    if (problem) return setResult({ kind: "error", text: problem });
    setSaving(true);
    setResult(null);
    try {
      const stored = await persist(doc);
      setDoc(stored);
      setResult({ kind: "success", text: "Kaydedildi. Değişiklikler mağazada yayında." });
    } catch (err) {
      setResult({ kind: "error", text: saveError(err) });
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof Homepage>(key: K) => (value: Homepage[K]) => setDoc((d) => (d ? { ...d, [key]: value } : d));
  const changedDoc = (key: keyof Homepage | undefined) => !!key && !!doc && !!saved && !same(doc[key], saved[key]);

  function open(key: EditorKey) {
    setResult(null);
    setEditing(key);
  }

  /** Closing keeps the edits: they stay marked on the row and in the save bar until saved. */
  function close() {
    setEditing(null);
    if (requested) router.replace("/admin/homepage", { scroll: false });
  }

  function editor(key: EditorKey, doc: Homepage, saved: Homepage) {
    switch (key) {
      case "hero":
        return (
          <div className="space-y-6">
            <HeroTab />
            <NavigationTab value={doc.navigation} set={set("navigation")} categories={categories} brands={brands} />
          </div>
        );
      case "deals":
        return <DealsTab value={doc.deals} set={set("deals")} />;
      case "brands":
        return <BrandsTab brands={brands} />;
      case "showcase":
        return <ShowcaseTab value={doc.showcase} set={set("showcase")} categories={categories} brands={brands} />;
      case "seo":
        return <SeoIntroTab value={doc.seo_intro} set={set("seo_intro")} />;
      case "footer":
        return <FooterTab value={doc.footer} set={set("footer")} />;
      case "mobile":
        return <MobileTab value={doc.mobile} set={set("mobile")} />;
      case "catalog":
        return <AdminCategoriesView onChange={reloadCategories} />;
      case "translations":
        return <TranslationsTab doc={saved} />;
      case "perks":
        return <PerksForm value={doc.perks} set={set("perks")} />;
      case "picks":
        return <PicksForm value={doc.picks} set={set("picks")} />;
      case "lules":
        return <LulesForm value={doc.lules} set={set("lules")} categories={categories} />;
      case "sultanpuan":
        return (
          <LoyaltyForm
            title="SultanPuan Bandı"
            value={doc.sultanpuan}
            onChange={set("sultanpuan")}
            placeholders={[{ name: "bant", means: "puan kazandıran tutar aralığı, ör. 20.000–29.999 TL" }]}
          />
        );
      case "kumbara":
        return (
          <LoyaltyForm
            title="Kumbara Bandı"
            value={doc.kumbara}
            onChange={set("kumbara")}
            placeholders={[
              { name: "tutar", means: "yıllık hedef, ör. 20.000 TL" },
              { name: "oran", means: "hedefte kazanılan ekstra, ör. %5" },
            ]}
          />
        );
      case "campaigns":
        return <CampaignsForm value={doc.campaigns} set={set("campaigns")} categories={categories} />;
      case "bento":
        return <BentoForm value={doc.bento} set={set("bento")} categories={categories} />;
      case "statement":
        return <StatementForm value={doc.statement} set={set("statement")} />;
      case "brand_showcase":
        return <BrandShowcaseForm value={doc.brand_showcase} set={set("brand_showcase")} />;
      case "kozlukler":
        return <ProductRowForm title="Közlükler" source="Közlükler" value={doc.kozlukler} onChange={set("kozlukler")} />;
      case "games":
        return <ProductRowForm title="Oyun & Eğlence" source="Oyun & Eğlence" value={doc.games} onChange={set("games")} />;
    }
  }

  const current = editing ? EDITORS[editing] : null;
  const resultAlert = result && <Alert variant={result.kind}>{result.text}</Alert>;

  return (
    <>
      <AdminPageHeader
        title="Ana Sayfa Düzenleme"
        description="Ana sayfanın bölümlerini sıralayın, açıp kapatın ve kalemle ayarlarını düzenleyin. Kaydedilen her şey mağazada hemen yayına girer."
        actions={
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:self-auto dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> Mağazayı aç
          </a>
        }
      />

      {loadError && <Alert variant="error">{loadError}</Alert>}

      {!doc || !saved ? (
        !loadError && <div className="h-96 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
      ) : (
        <div className="pb-24">
          <div className="mb-4 flex flex-wrap gap-2">
            {PAGE_EDITORS.map(({ key, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => open(key)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-red-400/60 hover:text-slate-900 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:text-white"
              >
                <Icon className="h-4 w-4 text-red-600" aria-hidden />
                {EDITORS[key].title}
                {changedDoc(EDITORS[key].doc) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="kaydedilmemiş" />
                )}
              </button>
            ))}
          </div>

          {!editing && resultAlert && <div className="mb-4">{resultAlert}</div>}

          <SectionsTab
            sections={saved.sections}
            order={saved.order}
            busy={toggling}
            onToggle={(k, on) => void toggle(k, on)}
            onReorder={reorder}
            onEdit={(k) => {
              const key = SECTION_EDITOR[k];
              return key ? () => open(key) : undefined;
            }}
            changed={(k) => {
              const key = SECTION_EDITOR[k];
              return !!key && changedDoc(EDITORS[key].doc);
            }}
          />

          <Drawer
            open={!!current}
            onClose={close}
            title={current?.title ?? ""}
            description={current?.hint}
            size={current?.size}
            footer={
              current?.doc ? (
                <DrawerActions
                  changed={changedDoc(current.doc)}
                  dirty={dirty}
                  saving={saving}
                  isDefault={same(doc[current.doc], DEFAULT_HOMEPAGE[current.doc])}
                  onReset={() => {
                    const key = current.doc!;
                    setDoc((d) => (d ? { ...d, [key]: DEFAULT_HOMEPAGE[key] } : d));
                  }}
                  onDiscard={() => {
                    const key = current.doc!;
                    setDoc((d) => (d ? { ...d, [key]: saved[key] } : d));
                  }}
                  onClose={close}
                  onSave={() => void save()}
                />
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
                  >
                    Kapat
                  </button>
                </div>
              )
            }
          >
            {editing && current && (
              <div className="space-y-4">
                {resultAlert}
                {current.sections?.every((k) => !saved.sections[k]) && (
                  <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                    Bu bölüm şu an mağazada gizli. Düzenleyebilirsiniz; listedeki anahtarıyla açınca görünür.
                  </p>
                )}
                {editor(editing, doc, saved)}
              </div>
            )}
          </Drawer>

          {/* Edits left unsaved when a drawer closed: the way to save them stays in reach. */}
          <div className={`${dirty && !editing ? "" : "hidden"} fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/90`}>
            <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3 sm:px-6">
              <p className="mr-auto text-xs text-slate-500 dark:text-zinc-400">Kaydedilmemiş değişiklikler var.</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDoc(saved)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Vazgeç
              </button>
              <SaveButton saving={saving} disabled={saving} onClick={() => void save()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SaveButton({ saving, disabled, onClick }: { saving: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:opacity-40"
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
      Kaydet
    </button>
  );
}

/** A drawer's footer: back to the default, drop this section's edits, close, save everything unsaved. */
function DrawerActions({
  changed,
  dirty,
  saving,
  isDefault,
  onReset,
  onDiscard,
  onClose,
  onSave,
}: {
  /** This section has unsaved edits. */
  changed: boolean;
  /** Anything has. */
  dirty: boolean;
  saving: boolean;
  isDefault: boolean;
  onReset: () => void;
  onDiscard: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button
        type="button"
        disabled={isDefault || saving}
        onClick={onReset}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Varsayılana döndür
      </button>
      <p className="me-auto text-xs text-slate-500 dark:text-zinc-400">
        {changed ? "Kaydedilmemiş değişiklikler var." : dirty ? "Başka bölümlerde kaydedilmemiş değişiklikler var." : "Kaydedildi."}
      </p>
      {changed && (
        <button
          type="button"
          disabled={saving}
          onClick={onDiscard}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          Vazgeç
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
      >
        Kapat
      </button>
      <SaveButton saving={saving} disabled={!dirty || saving} onClick={onSave} />
    </div>
  );
}
