"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Loader2, RotateCcw, Save } from "lucide-react";

import { AdminCategoriesView } from "@/components/admin/AdminCategoriesView";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { TranslationsTab } from "@/components/admin/homepage/TranslationsTab";
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
import { adminGetHomepage, adminListBrands, adminSaveHomepage } from "@/lib/adminApi";
import { fetchCategories } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import { brokenCategoryLink } from "@/lib/catalogLinks";
import { DEFAULT_HOMEPAGE, SECTION_LABELS, resolveHomepage } from "@/lib/homepage";
import { refreshStorefront } from "@/lib/revalidate";
import type { Brand, Category, HomeBlock, Homepage, HomeSections } from "@/types";

type TabKey =
  | "sections"
  | "catalog"
  | "navigation"
  | "hero"
  | "deals"
  | "brands"
  | "showcase"
  | "seo"
  | "footer"
  | "mobile"
  | "translations";

/** Deep links (/admin/homepage?tab=katalog-kategorileri), e.g. from the retired /admin/categories. */
const TAB_PARAM: Record<string, TabKey> = {
  "katalog-kategorileri": "catalog",
  "kategori-duzenle": "navigation",
  "mobil-yonetim": "mobile",
  ceviriler: "translations",
};

/** Each tab, and the part of the document it edits (none for the two that link out). */
const TABS: { key: TabKey; label: string; doc?: keyof Homepage; section?: keyof HomeSections }[] = [
  { key: "sections", label: "Bölümler" },
  { key: "mobile", label: "Mobil Yönetim", doc: "mobile" },
  { key: "catalog", label: "Katalog Kategorileri" },
  { key: "navigation", label: "Kategori Düzenle", doc: "navigation" },
  { key: "hero", label: "Hero & Kutular", section: "hero" },
  { key: "deals", label: "Fırsatlar", doc: "deals", section: "deals" },
  { key: "brands", label: "Markalar Şeridi", doc: "brands", section: "brands" },
  { key: "showcase", label: "Premium Yelpaze", doc: "showcase", section: "showcase" },
  // The homepage switch for this passage is the one still called "about".
  { key: "seo", label: "Alt SEO Metni", doc: "seo_intro", section: "about" },
  { key: "footer", label: "Footer", doc: "footer", section: "footer" },
  // The texts above in English and Arabic; saves on its own.
  { key: "translations", label: "Çeviriler (EN/AR)" },
];

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
  return null;
}

/** Admin: "Ana Sayfa Düzenleme" — switches and copy for the homepage, menus and footer. */
export function AdminHomepageView() {
  const [saved, setSaved] = useState<Homepage | null>(null);
  const [doc, setDoc] = useState<Homepage | null>(null);
  // Open on the tab a link asked for, else the switches.
  const requested = TAB_PARAM[useSearchParams().get("tab") ?? ""];
  const [tab, setTab] = useState<TabKey>(requested ?? "sections");
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

  const current = TABS.find((t) => t.key === tab)!;
  const set = <K extends keyof Homepage>(key: K) => (value: Homepage[K]) => setDoc((d) => (d ? { ...d, [key]: value } : d));

  return (
    <>
      <AdminPageHeader
        title="Ana Sayfa Düzenleme"
        description="Ana sayfanın bölümlerini açıp kapatın; menüleri, metinleri, görselleri ve footer’ı düzenleyin. Kaydedilen her şey mağazada hemen yayına girer."
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
          <div role="tablist" aria-label="Ana sayfa bölümleri" className="mb-6 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
            {TABS.map((t) => {
              const active = t.key === tab;
              const hidden = t.section && !saved.sections[t.section];
              const changed = t.doc && !same(doc[t.doc], saved[t.doc]);
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-red-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
                  } ${hidden && !active ? "opacity-50" : ""}`}
                >
                  {t.label}
                  {changed && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" aria-label="kaydedilmemiş" />}
                </button>
              );
            })}
          </div>

          {result && (
            <div className="mb-4">
              <Alert variant={result.kind}>{result.text}</Alert>
            </div>
          )}

          {current.section && !saved.sections[current.section] && (
            <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              Bu bölüm şu an mağazada gizli. Düzenleyebilirsiniz; “Bölümler” sekmesinden açınca görünür.
            </p>
          )}

          <div role="tabpanel" aria-label={current.label}>
            {tab === "sections" && (
              <SectionsTab
                sections={saved.sections}
                order={saved.order}
                busy={toggling}
                onToggle={(k, on) => void toggle(k, on)}
                onReorder={reorder}
              />
            )}
            {tab === "catalog" && <AdminCategoriesView onChange={reloadCategories} />}
            {tab === "navigation" && (
              <NavigationTab
                value={doc.navigation}
                set={set("navigation")}
                categories={categories}
                brands={brands}
              />
            )}
            {tab === "hero" && <HeroTab />}
            {tab === "deals" && <DealsTab value={doc.deals} set={set("deals")} />}
            {tab === "brands" && <BrandsTab value={doc.brands} set={set("brands")} />}
            {tab === "showcase" && <ShowcaseTab value={doc.showcase} set={set("showcase")} categories={categories} brands={brands} />}
            {tab === "seo" && <SeoIntroTab value={doc.seo_intro} set={set("seo_intro")} />}
            {tab === "footer" && <FooterTab value={doc.footer} set={set("footer")} />}
            {tab === "mobile" && <MobileTab value={doc.mobile} set={set("mobile")} />}
            {tab === "translations" && <TranslationsTab doc={saved} />}
          </div>

          {current.doc && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={same(doc[current.doc], DEFAULT_HOMEPAGE[current.doc])}
                onClick={() => {
                  const key = current.doc!;
                  setDoc((d) => (d ? { ...d, [key]: DEFAULT_HOMEPAGE[key] } : d));
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Bu bölümü varsayılana döndür
              </button>
            </div>
          )}

          {/* The save bar: always reachable, and loud only when there is something to save.
              Katalog Kategorileri saves each change itself, so it shows only
              if other tabs have unsaved edits. */}
          <div className={`${tab === "catalog" && !dirty ? "hidden" : ""} fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/90`}>
            <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3 sm:px-6">
              <p className="mr-auto text-xs text-slate-500 dark:text-zinc-400">
                {dirty ? "Kaydedilmemiş değişiklikler var." : "Tüm değişiklikler kaydedildi."}
              </p>
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={() => setDoc(saved)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
