"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { adminSelectClass, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { BrokenCategoryNote, inputClass } from "@/components/admin/homepage/fields";
import { Switch } from "@/components/ui/Switch";
import { categoryTree } from "@/lib/categories";
import { brokenCategoryLink } from "@/lib/catalogLinks";
import { navHref } from "@/lib/storefrontNav";
import type { Brand, Category, HomeNavItem } from "@/types";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-zinc-400";
type TargetKind = "category" | "brand" | "link" | "search";

const targetOf = (item: HomeNavItem): TargetKind =>
  item.href ? "link" : item.slug ? "category" : item.brand ? "brand" : "search";

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white";

function Entry({
  item,
  link,
  name,
  index,
  count,
  update,
  move,
  remove,
  accent,
  categories,
  brands,
}: {
  item: HomeNavItem;
  /** Where the entry goes, as the storefront resolves it today. */
  link: string;
  /** What it is called on the storefront when its own label is empty. */
  name: string;
  index: number;
  count: number;
  update: (patch: Partial<HomeNavItem>) => void;
  move: (to: number) => void;
  remove: () => void;
  accent: boolean;
  categories: Category[];
  brands: Brand[];
}) {
  const id = useId();
  const enabled = item.enabled !== false;
  const badLink = !isSiteOrHttpsLink(link);
  const broken = badLink ? null : brokenCategoryLink(link, categories);
  const kind = targetOf(item);
  const cleared = { slug: null, brand: null, href: null, search: null };
  // Switching kind clears the others, so an entry always means exactly one
  // thing; the name stays, so the menu does not go blank on the way.
  const setKind = (next: TargetKind) => {
    const label = item.label || name;
    if (next === "category") update({ ...cleared, label, slug: categories[0]?.slug ?? "" });
    else if (next === "brand") update({ ...cleared, label, brand: brands[0]?.slug ?? "" });
    else if (next === "link") update({ ...cleared, label, href: link });
    else update({ ...cleared, label });
  };
  const setLink = (href: string) => update({ ...cleared, href, label: item.label || name });

  return (
    <li
      className={`rounded-xl border p-3 transition-colors ${
        enabled
          ? "border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900"
          : "border-dashed border-slate-300 bg-slate-50 dark:border-white/15 dark:bg-white/[0.02]"
      }`}
    >
      {/* Order, visibility and removal, in one row above the fields. */}
      <div className="mb-3 flex items-center gap-1">
        <span className="mr-1 w-6 text-right font-mono text-xs text-slate-400">{index + 1}.</span>
        <button type="button" className={iconButton} disabled={index === 0} onClick={() => move(index - 1)} aria-label="Yukarı taşı">
          <ArrowUp className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" className={iconButton} disabled={index === count - 1} onClick={() => move(index + 1)} aria-label="Aşağı taşı">
          <ArrowDown className="h-4 w-4" aria-hidden />
        </button>
        <p className={`ml-2 min-w-0 flex-1 truncate text-xs font-semibold ${enabled ? "text-slate-700 dark:text-zinc-300" : "text-slate-400 line-through"}`}>
          {item.label || name || "(adsız)"}
        </p>
        <span id={`${id}-shown`} className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
          {enabled ? "Açık" : "Kapalı"}
        </span>
        <Switch checked={enabled} onChange={(on) => update({ enabled: on })} labelledBy={`${id}-shown`} />
        <button
          type="button"
          className={`${iconButton} ml-1 hover:text-red-600`}
          onClick={remove}
          aria-label={`Sil: ${item.label || name || index + 1}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Three parts: the name shown, what kind of target, and the target itself. */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem_minmax(0,1.3fr)]">
        <div className="space-y-1">
          <label htmlFor={`${id}-name`} className={labelClass}>
            İsim
          </label>
          <input
            id={`${id}-name`}
            value={item.label || name}
            maxLength={60}
            placeholder="ör. LÜLELER"
            onChange={(e) => update({ label: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-kind`} className={labelClass}>
            Hedef
          </label>
          <select
            id={`${id}-kind`}
            value={kind}
            onChange={(e) => setKind(e.target.value as TargetKind)}
            className={adminSelectClass}
          >
            <option value="category">Kategori</option>
            <option value="brand">Marka</option>
            <option value="link">Özel bağlantı</option>
            <option value="search">Katalog araması</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-value`} className={labelClass}>
            {kind === "category" ? "Kategori" : kind === "brand" ? "Marka" : kind === "link" ? "Bağlantı" : "Aranacak kelime"}
          </label>
          {kind === "category" ? (
            <select
              id={`${id}-value`}
              value={item.slug ?? ""}
              onChange={(e) => update({ slug: e.target.value })}
              className={adminSelectClass}
            >
              {/* A slug the catalog no longer has stays selectable, so it is not lost silently. */}
              {item.slug && !categories.some((c) => c.slug === item.slug) && (
                <option value={item.slug}>{item.slug} (bulunamadı)</option>
              )}
              {categoryTree(categories)
                .flatMap((group) => [group, ...group.children])
                .map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.parent_id ? "— " : ""}
                    {c.name}
                  </option>
                ))}
            </select>
          ) : kind === "brand" ? (
            <select
              id={`${id}-value`}
              value={item.brand ?? ""}
              onChange={(e) => update({ brand: e.target.value })}
              className={adminSelectClass}
            >
              {item.brand && !brands.some((b) => b.slug === item.brand) && (
                <option value={item.brand}>{item.brand} (bulunamadı — aranır)</option>
              )}
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : kind === "link" ? (
            <>
              <input
                id={`${id}-value`}
                value={link}
                maxLength={300}
                placeholder="/catalog/luleler veya https://…"
                aria-invalid={badLink || undefined}
                onChange={(e) => setLink(e.target.value)}
                className={`${inputClass} font-mono ${badLink || broken ? "border-red-400 focus:border-red-500" : ""}`}
              />
              {badLink && <p className="text-[11px] text-red-600 dark:text-red-400">/ ile ya da https:// ile başlamalı.</p>}
              <BrokenCategoryNote broken={broken} onFix={setLink} />
            </>
          ) : (
            <input
              id={`${id}-value`}
              value={item.search ?? ""}
              maxLength={80}
              placeholder={`Boş bırakılırsa: “${item.label || name}”`}
              onChange={(e) => update({ search: e.target.value || null })}
              className={inputClass}
            />
          )}
          {kind !== "link" && <p className="truncate font-mono text-[11px] text-slate-400 dark:text-zinc-500">→ {link}</p>}
        </div>
      </div>

      {accent && (
        <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={!!item.accent}
            onChange={(e) => update({ accent: e.target.checked })}
            className="h-4 w-4 accent-red-600"
          />
          Kırmızı vurgula (kampanya)
        </label>
      )}
    </li>
  );
}

/**
 * One menu ("Sol Kategori" or "Üst Kategori"), as a vertical list of entries:
 * a name, a target kind and the target each (a category, a brand, a link of
 * its own or a catalog search), with order, on/off and delete — and a button
 * to add one. Under a non-link target, the link it resolves to today.
 */
export function CategoryMenuEditor({
  items,
  onChange,
  max,
  accent,
  categories,
  brands,
}: {
  items: HomeNavItem[];
  onChange: (items: HomeNavItem[]) => void;
  max: number;
  accent: boolean;
  categories: Category[];
  brands: Brand[];
}) {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
  const nameOf = (item: HomeNavItem) =>
    (item.slug && bySlug.get(item.slug)?.name) || (item.brand && brandBySlug.get(item.brand)?.name) || "";

  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  // A new entry starts on the first category not already in this menu.
  function add() {
    const taken = new Set(items.map((i) => i.href ?? (i.slug ? `/catalog/${i.slug}` : "")));
    const free = categoryTree(categories)
      .flatMap((g) => [g, ...g.children])
      .find((c) => !taken.has(`/catalog/${c.slug}`));
    onChange([
      ...items,
      free
        ? { label: free.name.toLocaleUpperCase("tr-TR"), href: `/catalog/${free.slug}`, enabled: true }
        : { label: "YENİ KATEGORİ", href: "/catalog", enabled: true },
    ]);
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {items.map((item, i) => (
          <Entry
            key={i}
            item={item}
            link={item.href ?? navHref(item, bySlug, brandBySlug)}
            name={nameOf(item)}
            index={i}
            count={items.length}
            update={(patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))}
            move={(to) => move(i, to)}
            remove={() => onChange(items.filter((_, j) => j !== i))}
            accent={accent}
            categories={categories}
            brands={brands}
          />
        ))}
      </ul>
      <button
        type="button"
        disabled={items.length >= max}
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-400 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 dark:border-white/15 dark:text-zinc-300"
      >
        <Plus className="h-4 w-4" aria-hidden /> Yeni Kategori Ekle
        <span className="text-xs font-normal text-slate-400">
          ({items.length}/{max})
        </span>
      </button>
    </div>
  );
}
