"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";

import { sheetInputClass, sheetLabelClass } from "@/components/admin/products/SheetParts";
import { categoryTree } from "@/lib/categories";
import type { AdminCategory } from "@/types";

const fold = (s: string) => s.toLocaleLowerCase("tr-TR");

/**
 * "Kategori", several at once: the product is listed under every category
 * ticked here (MR.WOOD and Lüleler, say).
 *
 * The ticked ones show as pills above the list, in the order ticked. The first
 * is the primary — the one the product page's breadcrumb names — and any other
 * pill's star makes it the primary instead.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  /** The admin list, so a category switched off in the storefront still shows if the product is in it. */
  categories: AdminCategory[];
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const [filter, setFilter] = useState("");
  const byId = new Map(categories.map((c) => [c.id, c]));
  const isLive = (c: AdminCategory) => c.is_active !== false && (c.parent_id === null || byId.get(c.parent_id)?.is_active !== false);

  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const makePrimary = (id: number) => onChange([id, ...value.filter((v) => v !== id)]);

  const q = fold(filter.trim());
  // Groups with their subcategories under them, as the menu shows them. Active
  // categories only — the ones the storefront shows — except those the product
  // is already in, so they are not lost.
  const rows = categoryTree(categories)
    .flatMap((group) => [group, ...group.children])
    .map((c) => byId.get(c.id))
    .filter((c): c is AdminCategory => !!c && (isLive(c) || value.includes(c.id)))
    .filter((c) => !q || fold(c.name).includes(q) || (c.parent_id !== null && fold(byId.get(c.parent_id)?.name ?? "").includes(q)));

  return (
    <div>
      <label htmlFor="sheet-category-filter" className={sheetLabelClass}>
        Kategoriler
      </label>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Seçili kategoriler">
          {value.map((id, i) => {
            const c = byId.get(id);
            const name = c?.name ?? `#${id}`;
            return (
              <li key={id}>
                <span
                  className={`inline-flex items-center gap-1 rounded-full py-1 pl-1.5 pr-1 text-xs font-medium ring-1 ring-inset ${
                    i === 0
                      ? "bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/30"
                      : "bg-slate-100 text-slate-800 ring-slate-200 dark:bg-white/10 dark:text-zinc-100 dark:ring-white/15"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => makePrimary(id)}
                    disabled={i === 0}
                    aria-label={i === 0 ? `${name}: ana kategori` : `${name} ana kategori olsun`}
                    title={i === 0 ? "Ana kategori (ürün sayfasında görünen)" : "Ana kategori yap"}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-amber-500 disabled:text-red-600 dark:disabled:text-red-300"
                  >
                    <Star className="h-3 w-3" fill={i === 0 ? "currentColor" : "none"} aria-hidden />
                  </button>
                  {name}
                  {c && !isLive(c) ? " (pasif)" : ""}
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label={`${name} kategorisini kaldır`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <input
        id="sheet-category-filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        placeholder="Kategori ara…"
        autoComplete="off"
        className={sheetInputClass}
      />
      <ul className="mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-slate-200 py-1 dark:border-white/10">
        {rows.map((c) => (
          <li key={c.id}>
            <label
              className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5 ${
                c.parent_id === null ? "font-semibold text-slate-900 dark:text-zinc-100" : "pl-8 text-slate-700 dark:text-zinc-300"
              }`}
            >
              <input
                type="checkbox"
                checked={value.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="h-4 w-4 shrink-0 accent-red-600"
              />
              <span className="truncate">{c.name}</span>
              {!isLive(c) && <span className="text-[11px] font-normal text-slate-400">(pasif)</span>}
            </label>
          </li>
        ))}
        {rows.length === 0 && <li className="px-3 py-2 text-xs text-slate-400">Eşleşen kategori yok.</li>}
      </ul>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
        Ürün işaretlenen her kategoride listelenir. Yıldızlı olan ana kategoridir; ürün sayfasında o görünür.
      </p>
    </div>
  );
}
