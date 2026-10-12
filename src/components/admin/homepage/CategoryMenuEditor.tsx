"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { BrokenCategoryNote, inputClass } from "@/components/admin/homepage/fields";
import { Switch } from "@/components/ui/Switch";
import { categoryTree } from "@/lib/categories";
import { brokenCategoryLink } from "@/lib/catalogLinks";
import { navHref } from "@/lib/storefrontNav";
import type { Brand, Category, HomeNavItem } from "@/types";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-zinc-400";
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
}) {
  const id = useId();
  const enabled = item.enabled !== false;
  const badLink = !isSiteOrHttpsLink(link);
  const broken = badLink ? null : brokenCategoryLink(link, categories);
  const setLink = (href: string) => update({ slug: null, brand: null, search: null, href, label: item.label || name });

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

      <div className="grid gap-3 sm:grid-cols-2">
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
          <label htmlFor={`${id}-href`} className={labelClass}>
            Bağlantı
          </label>
          {/* Editing the link makes it a plain link: no category or brand behind it. */}
          <input
            id={`${id}-href`}
            value={link}
            maxLength={300}
            placeholder="/catalog/luleler veya https://…"
            aria-invalid={badLink || undefined}
            onChange={(e) => setLink(e.target.value)}
            className={`${inputClass} font-mono ${badLink || broken ? "border-red-400 focus:border-red-500" : ""}`}
          />
          {badLink && <p className="text-[11px] text-red-600 dark:text-red-400">/ ile ya da https:// ile başlamalı.</p>}
          <BrokenCategoryNote broken={broken} onFix={setLink} />
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
 * a name and a link each, with order, on/off and delete — and a button to add
 * one. Entries saved before as a category or brand reference show the link
 * they resolve to, and become plain links once that link is edited.
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
