"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type SubmitEvent } from "react";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, FolderTree, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Collapse } from "@/components/ui/Collapse";
import { Switch } from "@/components/ui/Switch";
import { BannerField } from "@/components/admin/BannerField";
import { CategoryBulkSettingsDialog } from "@/components/admin/CategoryBulkSettings";
import { ImageField } from "@/components/admin/homepage/fields";
import {
  adminAssignProductCategory,
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminListProducts,
  adminUpdateCategory,
} from "@/lib/adminApi";
import { branchIds, canPlaceUnder, categoryTree, flattenTree, MAX_CATEGORY_DEPTH, openedTo } from "@/lib/categories";
import type { TreeNode } from "@/lib/categoryTree";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import { scrollIntoPlace } from "@/lib/scrollIntoPlace";
import { TRANSLATIONS_ANCHOR } from "@/lib/translationReturn";
import type { AdminCategory, AdminProduct, TranslatedLocale } from "@/types";

const selectClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100";

interface FormState {
  name: string;
  slug: string;
  parentId: string; // "" = top-level
  sortOrder: string;
  isActive: boolean;
  imageUrl: string | null;
  /** The category page's wide banner; null = none. */
  bannerUrl: string | null;
  description: string;
  /** The passage closing the page, in place of the shop's "Alt SEO Metni". */
  seoTitle: string;
  seoText: string;
  /** "Çeviriler": English and Arabic name and description; no name = not saved. */
  translations: Record<TranslatedLocale, { name: string; description: string; draft: boolean; source: string | null }>;
}

const NO_TRANSLATIONS = {
  en: { name: "", description: "", draft: false, source: null },
  ar: { name: "", description: "", draft: false, source: null },
};
const TRANSLATION_LABEL: Record<TranslatedLocale, string> = { en: "İngilizce (EN)", ar: "Arapça (AR)" };
/** Rich text with no words in it is blank. */
const blankHtml = (html: string) => !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const EMPTY: FormState = {
  name: "",
  slug: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
  imageUrl: null,
  bannerUrl: null,
  description: "",
  seoTitle: "",
  seoText: "",
  translations: NO_TRANSLATIONS,
};

/** A tree row's indent by its level: group, subcategory, sub-subcategory. */
const ROW_INDENT = ["", "ms-8", "ms-16"];

/**
 * The catalog's categories: the tree (groups → subcategories → theirs, three
 * levels at most; a branch opens and closes, the groups open at first) with
 * add, rename, delete, on/off and cover image, and product → category moves.
 * Lives in "Ana Sayfa Düzenleme" › Kategoriler; `onChange` tells the
 * editor around it when the tree changed, so its pickers and link checks
 * see the new categories at once.
 */
export function AdminCategoriesView({
  onChange,
  openId,
  onSaved,
}: {
  onChange?: () => void;
  /** Open this category in the form, at its "Çeviriler" (a link from "Çeviri Onayları"). */
  openId?: number | null;
  /** Told a save went through, with the name: the approvals take the admin back. */
  onSaved?: (name: string) => void;
} = {}) {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  // "Tüm Ürünlere Toplu Ayar Uygula": the category it is open for, and what the last one did.
  const [bulkFor, setBulkFor] = useState<AdminCategory | null>(null);
  const [bulkDone, setBulkDone] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const translationsRef = useRef<HTMLDetailsElement>(null);
  // `openId`'s category, once the list is in: opened in the form, its
  // translations unfolded, then scrolled to and focused (once).
  const opened = useRef(false);
  const focusPending = useRef(false);

  const reload = () =>
    adminListCategories()
      .then((rows) => {
        setCategories(rows);
        onChange?.();
        return rows;
      })
      .catch((err: unknown) => setLoadError(getApiErrorMessage(err, "Kategoriler yüklenemedi.")));

  useEffect(() => {
    const controller = new AbortController();
    adminListCategories(controller.signal)
      .then(setCategories)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Kategoriler yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!openId || !categories || opened.current) return;
    const category = categories.find((c) => c.id === openId);
    if (!category) return;
    opened.current = true;
    focusPending.current = true;
    startEdit(category);
  }, [openId, categories]);

  // The linked category is in the form: to its translations, held in place
  // while the editors above them mount (lib/scrollIntoPlace).
  useEffect(() => {
    if (!focusPending.current || !editing || editing.id !== openId) return;
    const section = translationsRef.current;
    const form = formRef.current;
    if (!section || !form) return;
    focusPending.current = false;
    section.open = true;
    return scrollIntoPlace(section, form);
  }, [editing, openId]);

  const tree = useMemo(() => categoryTree(categories ?? []), [categories]);
  // The open branches; null until the admin opens or closes one: the groups
  // open (their subcategories in sight), what is below those closed.
  const [expanded, setExpanded] = useState<Set<number> | null>(null);
  const groupsOpen = useMemo(() => new Set(tree.filter((g) => g.children.length).map((g) => g.id)), [tree]);
  const branches = useMemo(() => branchIds(tree), [tree]);
  const open = expanded ?? groupsOpen;
  const allOpen = branches.length > 0 && branches.every((id) => open.has(id));
  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev ?? groupsOpen);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  /** The branches above this category opened, so its row is in sight. */
  const reveal = (id: number, rows: readonly AdminCategory[] = categories ?? []) =>
    setExpanded((prev) => openedTo(prev ?? groupsOpen, id, rows));
  // A parent is a group or a subcategory; the ones this category can't go
  // under (its own branch, or a fourth level with what it brings) are shown
  // greyed out, so the form offers only what the server takes.
  const parentOptions = flattenTree(tree)
    .filter(({ depth }) => depth < MAX_CATEGORY_DEPTH - 1)
    .map(({ category, depth }) => ({
      category,
      depth,
      allowed: canPlaceUnder(editing?.id ?? null, category.id, categories ?? []),
    }));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
  };

  function startEdit(c: AdminCategory) {
    setEditing(c);
    reveal(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id ? String(c.parent_id) : "",
      sortOrder: String(c.sort_order),
      isActive: c.is_active,
      imageUrl: c.image_url ?? null,
      bannerUrl: c.banner_url ?? null,
      description: c.description ?? "",
      seoTitle: c.seo_title ?? "",
      seoText: c.seo_text ?? "",
      translations: {
        // A draft (Claude's) keeps its flag and source until "Onayla".
        en: { name: c.translations?.en?.name ?? "", description: c.translations?.en?.description ?? "", draft: !!c.translations?.en?.draft, source: c.translations?.en?.source ?? null },
        ar: { name: c.translations?.ar?.name ?? "", description: c.translations?.ar?.description ?? "", draft: !!c.translations?.ar?.draft, source: c.translations?.ar?.source ?? null },
      },
    });
    setResult(null);
  }

  function startCreate(parentId: number | null) {
    setEditing(null);
    setForm({ ...EMPTY, parentId: parentId ? String(parentId) : "" });
    setResult(null);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !form.name.trim()) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      parent_id: form.parentId ? Number(form.parentId) : null,
      sort_order: Math.max(0, Number.parseInt(form.sortOrder, 10) || 0),
      is_active: form.isActive,
      image_url: form.imageUrl?.trim() || null,
      banner_url: form.bannerUrl?.trim() || null,
      description: form.description.trim() || null,
      seo_title: form.seoTitle.trim() || null,
      seo_text: blankHtml(form.seoText) ? null : form.seoText.trim(),
      // Only the languages with a name; one emptied here is removed.
      translations: Object.fromEntries(
        (["en", "ar"] as const)
          .filter((l) => form.translations[l].name.trim())
          .map((l) => [
            l,
            {
              name: form.translations[l].name.trim(),
              description: blankHtml(form.translations[l].description) ? null : form.translations[l].description.trim(),
              ...(form.translations[l].draft ? { draft: true, source: form.translations[l].source } : {}),
            },
          ]),
      ),
    };
    try {
      const saved = editing ? await adminUpdateCategory(editing.id, body) : await adminCreateCategory(body);
      const rows = await reload();
      // The saved one in sight, a new subcategory included.
      if (rows) reveal(saved.id, rows);
      void refreshStorefront();
      setEditing(null);
      setForm(EMPTY);
      setResult({ kind: "success", text: `Kaydedildi: ${saved.name}. Menü ve katalog güncellendi.` });
      onSaved?.(saved.name);
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kategori kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: AdminCategory) {
    if (!window.confirm(`"${c.name}" silinsin mi?`)) return;
    try {
      await adminDeleteCategory(c.id);
      await reload();
      void refreshStorefront();
      if (editing?.id === c.id) startCreate(null);
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Silinemedi (önce alt kategorileri ve ürünleri taşıyın).") });
    }
  }

  /** A category's row and, for a branch, its subcategories, sliding open and closed under it. */
  const node = (c: TreeNode<AdminCategory>, depth: number): ReactNode => {
    const branch = c.children.length > 0;
    const isOpen = branch && open.has(c.id);
    const childrenId = `category-children-${c.id}`;
    const title = (
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${depth ? "" : "font-semibold"} ${c.is_active ? "" : "text-slate-400 line-through dark:text-zinc-500"}`}>
          {c.name}
          {!c.is_active && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 no-underline dark:bg-white/10 dark:text-zinc-400">
              Pasif
            </span>
          )}
        </p>
        <p className="truncate font-mono text-xs text-slate-500 dark:text-zinc-400">
          /{c.slug}
          {/* Closed, what it holds out of sight. */}
          {branch && !isOpen && <span className="font-sans"> · {c.children.length} alt kategori</span>}
        </p>
      </div>
    );
    return (
      <li key={c.id}>
        <div
          // A narrow screen: the name on a line of its own, the count and tools under it.
          className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2.5 transition-colors @lg:flex-nowrap ${ROW_INDENT[depth] ?? ROW_INDENT[2]} ${
            editing?.id === c.id ? "bg-red-50 dark:bg-red-500/10" : ""
          }`}
        >
          {branch ? (
            // The arrow and the name both open and close it.
            <button
              type="button"
              onClick={() => toggle(c.id)}
              aria-expanded={isOpen}
              aria-controls={childrenId}
              title={isOpen ? "Alt kategorileri gizle" : "Alt kategorileri göster"}
              className="-my-1 flex min-w-0 flex-1 basis-full items-center gap-2 rounded-lg py-1 text-left @lg:basis-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            >
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-90" : ""}`}
                aria-hidden
              />
              {title}
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 basis-full items-center gap-2 @lg:basis-0">
              {/* A leaf: the arrow's room, so the names line up. */}
              <span className="h-4 w-4 shrink-0" aria-hidden />
              {title}
            </div>
          )}
          <div className="ms-auto flex shrink-0 items-center gap-3">
            <span className="text-xs tabular-nums text-slate-500 dark:text-zinc-400" title="Doğrudan bu kategorideki ürünler">
              {c.product_count} ürün
            </span>
            <span className="w-10 text-right font-mono text-xs text-slate-400" title="Sıra">
              #{c.sort_order}
            </span>
            <div className="flex gap-1">
              {/* A group and a subcategory take children; the third level is the last. */}
              {depth < MAX_CATEGORY_DEPTH - 1 ? (
                <button type="button" onClick={() => startCreate(c.id)} aria-label={`${c.name} altına kategori ekle`} className={iconBtn}>
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <span className="h-8 w-8" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => setBulkFor(c)}
                aria-label={`Tüm ürünlere toplu ayar: ${c.name}`}
                title="Tüm ürünlere toplu ayar uygula"
                className={iconBtn}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" onClick={() => startEdit(c)} aria-label={`Düzenle: ${c.name}`} className={iconBtn}>
                <Pencil className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" onClick={() => handleDelete(c)} aria-label={`Sil: ${c.name}`} className={iconBtn}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
        {branch && (
          <Collapse open={isOpen} id={childrenId}>
            <ul>{c.children.map((x) => node(x, depth + 1))}</ul>
          </Collapse>
        )}
      </li>
    );
  };

  return (
    <>
      <p className="mb-6 text-sm text-slate-600 dark:text-zinc-400">
        Katalogdaki gruplar ve alt kategoriler, en fazla 3 seviye (Ana grup › Alt kategori › Alt-alt kategori): ürün
        formundaki kategori listesi ve mağazadaki kategori sayfaları (/…) buradan gelir. Bir kategori sayfası, altındaki
        bütün kategorilerin ürünlerini de listeler.
      </p>

      <div className="grid gap-6 @4xl:grid-cols-[1fr_24rem]">
        <section aria-labelledby="tree-heading" className={`${panelClass} min-w-0 p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="tree-heading" className="flex items-center gap-2 text-sm font-semibold">
              <FolderTree className="h-4 w-4 text-slate-400" aria-hidden /> Menü ağacı
            </h2>
            <div className="flex items-center gap-4">
              {branches.length > 0 && (
                // Everything open, or only the groups in sight.
                <button
                  type="button"
                  onClick={() => setExpanded(allOpen ? new Set() : new Set(branches))}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {allOpen ? <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />}
                  {allOpen ? "Tümünü kapat" : "Tümünü aç"}
                </button>
              )}
              <button type="button" onClick={() => startCreate(null)} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
                <Plus className="h-4 w-4" aria-hidden /> Ana grup
              </button>
            </div>
          </div>
          {bulkDone && (
            <div className="mt-4">
              <Alert variant="success">{bulkDone}</Alert>
            </div>
          )}
          {loadError ? (
            <div className="mt-4">
              <Alert variant="error">{loadError}</Alert>
            </div>
          ) : categories === null ? (
            <div className="mt-4 h-64 motion-safe:animate-pulse" aria-busy />
          ) : (
            <ul className="-mx-2 mt-4 divide-y divide-slate-200 dark:divide-white/10">{tree.map((g) => node(g, 0))}</ul>
          )}
        </section>

        <form ref={formRef} onSubmit={handleSubmit} className={`${panelClass} h-fit space-y-4 p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editing ? `Düzenle: ${editing.name}` : "Yeni kategori"}</h2>
            {editing && (
              <button type="button" onClick={() => startCreate(null)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400">
                <X className="h-3.5 w-3.5" aria-hidden /> Vazgeç
              </button>
            )}
          </div>
          <Input label="Ad" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ör. Közlükler" />
          <Input
            label="Adres (slug)"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="boş: addan üretilir"
            hint="Sayfa adresi: /<slug> (sitenin kökünde, ürünlerle aynı alanda; bir ürünün ya da sitenin bir sayfasının adresi olamaz). Değiştirirseniz eski adres yeni adrese yönlendirilir."
          />
          <BannerField value={form.bannerUrl} onChange={(url) => set("bannerUrl", url)} />
          <div className="space-y-1.5">
            <p id="cat-description-label" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Kategori açıklaması
            </p>
            <RichTextEditor
              id="cat-description"
              labelledBy="cat-description-label"
              value={form.description}
              onChange={(html) => set("description", html)}
              minHeight="7rem"
              placeholder="Kategori sayfasının altında, ürünlerin ardından görünür; uzun metin “Devamını Oku” ile açılır."
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              İlk cümleler arama sonuçlarındaki açıklama olarak da kullanılır. Boş bırakılırsa hazır metin gösterilir.
            </p>
          </div>
          {/* The passage at the foot of the page, in place of the shop's own. */}
          <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
            <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Sayfa sonu metni</legend>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ürünlerin altındaki başlık ve yazı. Boş bırakılırsa sayfa ürünlerle biter (ana sayfanın
              “Alt SEO Metni” burada tekrarlanmaz). Yalnızca Türkçe sayfada.
            </p>
            <Input
              label="Başlık"
              value={form.seoTitle}
              maxLength={160}
              onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="boş: kategori adı"
            />
            <div className="space-y-1.5">
              <p id="cat-seo-text-label" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Yazı
              </p>
              <RichTextEditor
                id="cat-seo-text"
                labelledBy="cat-seo-text-label"
                value={form.seoText}
                onChange={(html) => set("seoText", html)}
                minHeight="7rem"
                placeholder="İlk paragraf görünür; devamı “Devamını Oku” ile açılır."
              />
            </div>
          </fieldset>
          {/* The category in English and Arabic: its /en and /ar pages and
              the menu there. No name = the Turkish is shown (not indexed). */}
          <details
            ref={translationsRef}
            id={TRANSLATIONS_ANCHOR}
            tabIndex={-1}
            className="scroll-mt-4 rounded-lg border border-slate-200 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-white/10"
            open={!!(form.translations.en.name || form.translations.ar.name)}
          >
            <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-zinc-300">
              Çeviriler (EN / AR)
              {(["en", "ar"] as const).map((l) =>
                form.translations[l].name.trim() ? (
                  <span key={l} className="ms-2 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {l.toUpperCase()}
                  </span>
                ) : null,
              )}
            </summary>
            <div className="mt-3 space-y-4">
              {(["en", "ar"] as const).map((l) => (
                <div key={l} className="space-y-2" dir={l === "ar" ? "rtl" : "ltr"} lang={l}>
                  {form.translations[l].draft && (
                    <div dir="ltr" lang="tr" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <span>{TRANSLATION_LABEL[l]}: Claude çevirisi — taslak, arama motorlarına kapalı.</span>
                      <button
                        type="button"
                        onClick={() => set("translations", { ...form.translations, [l]: { ...form.translations[l], draft: false, source: null } })}
                        className="rounded-full bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-500"
                      >
                        Onayla
                      </button>
                    </div>
                  )}
                  <Input
                    label={`${TRANSLATION_LABEL[l]} — ad`}
                    value={form.translations[l].name}
                    onChange={(e) => set("translations", { ...form.translations, [l]: { ...form.translations[l], name: e.target.value } })}
                    maxLength={150}
                  />
                  <p id={`cat-${l}-description-label`} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
                    {TRANSLATION_LABEL[l]} — açıklama
                  </p>
                  <RichTextEditor
                    id={`cat-${l}-description`}
                    labelledBy={`cat-${l}-description-label`}
                    value={form.translations[l].description}
                    onChange={(html) => set("translations", { ...form.translations, [l]: { ...form.translations[l], description: html } })}
                    minHeight="5rem"
                  />
                </div>
              ))}
            </div>
          </details>
          <div className="space-y-1.5">
            <label htmlFor="cat-parent" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Üst kategori
            </label>
            <select id="cat-parent" value={form.parentId} onChange={(e) => set("parentId", e.target.value)} className={selectClass}>
              <option value="">— Ana grup (menüde başlık)</option>
              {parentOptions.map(({ category, depth, allowed }) => (
                <option key={category.id} value={category.id} disabled={!allowed}>
                  {"   ".repeat(depth)}
                  {depth ? "↳ " : ""}
                  {category.name}
                </option>
              ))}
            </select>
            {parentOptions.some((o) => !o.allowed) && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Menü en fazla 3 seviye; soluk seçenekler bu kategoriyi (alt kategorileriyle birlikte) 3 seviyenin altına
                iter ya da kendi dalının içine koyar.
              </p>
            )}
          </div>
          <Input
            label="Sıra"
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
            hint="Küçük sayı önce gösterilir."
          />
          <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3 dark:border-white/10">
            <div>
              <p id="cat-active" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Mağazada göster
              </p>
              <p id="cat-active-hint" className="text-xs text-slate-500 dark:text-zinc-400">
                Kapalıyken menülerde ve katalogda görünmez (alt kategorileriyle); ürünleri silinmez.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onChange={(on) => set("isActive", on)}
              labelledBy="cat-active"
              describedBy="cat-active-hint"
            />
          </div>
          <ImageField
            label="Kapak görseli"
            value={form.imageUrl}
            onChange={(url) => set("imageUrl", url)}
            hint="Ana sayfadaki “Premium Ürün Yelpazesi” kutusunda kullanılır; boşsa bir ürün fotoğrafı alınır."
          />
          {result && <Alert variant={result.kind}>{result.text}</Alert>}
          <Button type="submit" loading={saving} disabled={!form.name.trim()}>
            {editing ? "Güncelle" : "Kategori ekle"}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={() => setBulkFor(editing)}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> Tüm Ürünlere Toplu Ayar Uygula
            </Button>
          )}
        </form>
      </div>

      <CategoryBulkSettingsDialog
        category={bulkFor}
        hasSubcategories={!!bulkFor && (categories ?? []).some((c) => c.parent_id === bulkFor.id)}
        onClose={() => setBulkFor(null)}
        onApplied={(message) => {
          setBulkFor(null);
          setBulkDone(message);
        }}
      />

      <ProductMapper categories={categories ?? []} onMoved={() => void reload()} />
    </>
  );
}

/** Search products and move a selection into a category (the "ürün eşleştirme" tool). */
function ProductMapper({ categories, onMoved }: { categories: AdminCategory[]; onMoved: () => void }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(""); // category slug; "" = all
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState("");
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const tree = useMemo(() => categoryTree(categories), [categories]);
  const nameOf = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      adminListProducts({ q: q.trim(), category: filter || null, limit: 100 }, controller.signal)
        .then((list) => {
          setProducts(list);
          setError(null);
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Ürünler yüklenemedi."));
        });
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, filter, nonce]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allShown = (products ?? []).length > 0 && (products ?? []).every((p) => selected.has(p.id));

  async function move() {
    if (selected.size === 0 || target === "" || moving) return;
    setMoving(true);
    setMessage(null);
    try {
      const n = await adminAssignProductCategory([...selected], target === "none" ? null : Number(target));
      setSelected(new Set());
      setNonce((x) => x + 1);
      onMoved();
      void refreshStorefront();
      setMessage(`${n} ürün taşındı.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Ürünler taşınamadı."));
    } finally {
      setMoving(false);
    }
  }

  const flat = flattenTree(tree);
  const label = (name: string, depth: number) => `${"   ".repeat(depth)}${depth ? "↳ " : ""}${name}`;
  const categoryOptions = flat.map(({ category: c, depth }) => (
    <option key={c.id} value={c.id}>
      {label(c.name, depth)}
    </option>
  ));

  return (
    <section aria-labelledby="mapper-heading" className={`${panelClass} mt-6 p-5 sm:p-6`}>
      <h2 id="mapper-heading" className="text-sm font-semibold">
        Ürünleri kategoriye ata
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">Arayın, seçin ve hedef kategoriye taşıyın.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <label htmlFor="mapper-q" className="sr-only">
            Ürün ara
          </label>
          <input
            id="mapper-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad veya kod (ör. çelik, sipsi)"
            className={`${selectClass} pl-9`}
          />
        </div>
        <label htmlFor="mapper-filter" className="sr-only">
          Kategoriye göre süz
        </label>
        <select id="mapper-filter" value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClass}>
          <option value="">Tüm kategoriler</option>
          {flat.map(({ category: c, depth }) => (
            <option key={c.slug} value={c.slug}>
              {label(c.name, depth)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
        {products === null ? (
          <div className="h-40 motion-safe:animate-pulse" aria-busy />
        ) : products.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-zinc-400">Ürün bulunamadı.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    aria-label="Gösterilenlerin tümünü seç"
                    checked={allShown}
                    onChange={() =>
                      setSelected((s) => {
                        const next = new Set(s);
                        for (const p of products) {
                          if (allShown) next.delete(p.id);
                          else next.add(p.id);
                        }
                        return next;
                      })
                    }
                  />
                </th>
                <th className="py-2 font-medium">Ürün</th>
                <th className="px-4 py-2 font-medium">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Seç: ${p.name}`}
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td className="py-2">
                    <span className="block truncate">{p.name}</span>
                    <span className="font-mono text-xs text-slate-400">{p.base_code}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 dark:text-zinc-400">
                    {p.category_id ? (nameOf.get(p.category_id) ?? "—") : "Kategorisiz"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="mapper-target" className="text-sm font-medium">
          {selected.size} seçili →
        </label>
        <select id="mapper-target" value={target} onChange={(e) => setTarget(e.target.value)} className={`${selectClass} sm:w-72`}>
          <option value="">Hedef kategori seçin</option>
          {categoryOptions}
          <option value="none">— Kategoriden çıkar</option>
        </select>
        <div className="sm:w-40">
          <Button type="button" onClick={move} loading={moving} disabled={selected.size === 0 || target === ""}>
            Taşı
          </Button>
        </div>
        {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
      </div>
    </section>
  );
}
