"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, X } from "lucide-react";

import { adminSelectClass } from "@/components/admin/ContentEditor";
import { ImageDropZone } from "@/components/admin/ImageDropZone";
import { adminUploadImages } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { categoryTree } from "@/lib/categories";
import { HOME_ICONS } from "@/lib/homeIcons";
import type { Brand, Category, HomeIconKey, HomeNavItem } from "@/types";

export const inputClass =
  "block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-zinc-400";

/** A labelled one-line text input. */
export function TextField({
  label,
  value,
  onChange,
  max,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint && <p className="text-[11px] text-slate-500 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}

/** A labelled multi-line text input with a live character count. */
export function TextArea({
  label,
  value,
  onChange,
  max,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={`${labelClass} flex justify-between`}>
        {label}
        <span className="font-mono tabular-nums">
          {value.length}/{max}
        </span>
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={max}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} h-auto py-2 leading-relaxed`}
      />
    </div>
  );
}

/** A card that groups one section's fields, with an optional action on the right. */
export function Panel({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-none">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white";

/**
 * An ordered list of items: each one in its own card with move up/down and
 * remove, and an "add" button under the last until the limit is reached.
 */
export function ListEditor<T>({
  items,
  onChange,
  blank,
  max,
  addLabel,
  itemLabel,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  max: number;
  addLabel: string;
  itemLabel: (item: T, index: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <span className="mr-1.5 font-mono text-slate-400">{i + 1}.</span>
              {itemLabel(item, i)}
            </p>
            <div className="flex shrink-0 items-center">
              <button type="button" className={iconButton} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Yukarı taşı">
                <ArrowUp className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={iconButton}
                disabled={i === items.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label="Aşağı taşı"
              >
                <ArrowDown className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={`${iconButton} hover:text-red-600`}
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label="Kaldır"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          {render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))), i)}
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= max}
        onClick={() => onChange([...items, blank()])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-400 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 dark:border-white/15 dark:text-zinc-300"
      >
        <Plus className="h-4 w-4" aria-hidden /> {addLabel}
        <span className="text-xs text-slate-400">
          ({items.length}/{max})
        </span>
      </button>
    </div>
  );
}

/** A list of plain strings (brand names, trust badges), one input per line. */
export function StringList({
  items,
  onChange,
  max,
  maxLength,
  addLabel,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  maxLength: number;
  addLabel: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-6 shrink-0 text-right font-mono text-xs text-slate-400">{i + 1}.</span>
            <input
              value={item}
              maxLength={maxLength}
              placeholder={placeholder}
              aria-label={`${i + 1}. öğe`}
              onChange={(e) => onChange(items.map((it, j) => (j === i ? e.target.value : it)))}
              className={inputClass}
            />
            <button
              type="button"
              className={`${iconButton} hover:text-red-600`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`${i + 1}. öğeyi kaldır`}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={items.length >= max}
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-400 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40 dark:border-white/15 dark:text-zinc-300"
      >
        <Plus className="h-4 w-4" aria-hidden /> {addLabel}
        <span className="text-xs text-slate-400">
          ({items.length}/{max})
        </span>
      </button>
    </div>
  );
}

/** Pick one of the icons a card or tile falls back to while it has no photo. */
export function IconSelect({ value, onChange }: { value: HomeIconKey; onChange: (value: HomeIconKey) => void }) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>
        İkon (görsel yokken)
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as HomeIconKey)} className={adminSelectClass}>
        {(Object.keys(HOME_ICONS) as HomeIconKey[]).map((key) => (
          <option key={key} value={key}>
            {HOME_ICONS[key].label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * An image: upload a file (stored by the API, its URL kept here) or paste a
 * URL or a site path such as /images/foto.jpg. Empty means "none".
 */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const [saved] = await adminUploadImages([file]);
      onChange(saved.url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Görsel yüklenemedi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <ImageDropZone label={label} preview={value || null} busy={busy} onFile={(f) => void upload(f)} onReject={setError} />
      <div className="flex items-center gap-2">
        <input
          value={value ?? ""}
          maxLength={500}
          placeholder="/images/foto.jpg veya https://…"
          aria-label={`${label} adresi`}
          onChange={(e) => onChange(e.target.value || null)}
          className={inputClass}
        />
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />}
        {value && (
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600">
            Kaldır
          </button>
        )}
      </div>
      {hint && !error && <p className="text-[11px] text-slate-500 dark:text-zinc-500">{hint}</p>}
      {error && <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

type TargetKind = "category" | "brand" | "link" | "search";

const targetOf = (item: HomeNavItem): TargetKind =>
  item.href ? "link" : item.slug ? "category" : item.brand ? "brand" : "search";

/**
 * Where a menu entry (or a showcase tile) goes: a category, a brand, a link of
 * its own, or a catalog search. Switching kind clears the others, so an entry
 * always means exactly one thing.
 */
export function NavTargetFields({
  item,
  update,
  categories,
  brands,
}: {
  item: HomeNavItem;
  update: (patch: Partial<HomeNavItem>) => void;
  categories: Category[];
  brands: Brand[];
}) {
  const kind = targetOf(item);
  const id = useId();
  const cleared = { slug: null, brand: null, href: null, search: null };

  return (
    <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
      <div className="space-y-1">
        <label htmlFor={`${id}-kind`} className={labelClass}>
          Hedef
        </label>
        <select
          id={`${id}-kind`}
          value={kind}
          onChange={(e) => {
            const next = e.target.value as TargetKind;
            if (next === "category") update({ ...cleared, slug: categories[0]?.slug ?? "" });
            else if (next === "brand") update({ ...cleared, brand: brands[0]?.slug ?? "" });
            else if (next === "link") update({ ...cleared, href: "/" });
            else update({ ...cleared });
          }}
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
          <select id={`${id}-value`} value={item.slug ?? ""} onChange={(e) => update({ slug: e.target.value })} className={adminSelectClass}>
            {/* A slug the catalog no longer has stays selectable, so it is not lost silently. */}
            {item.slug && !categories.some((c) => c.slug === item.slug) && <option value={item.slug}>{item.slug} (bulunamadı)</option>}
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
          <select id={`${id}-value`} value={item.brand ?? ""} onChange={(e) => update({ brand: e.target.value })} className={adminSelectClass}>
            {item.brand && !brands.some((b) => b.slug === item.brand) && <option value={item.brand}>{item.brand} (bulunamadı)</option>}
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        ) : kind === "link" ? (
          <input
            id={`${id}-value`}
            value={item.href ?? ""}
            maxLength={300}
            placeholder="/catalog veya https://…"
            onChange={(e) => update({ href: e.target.value })}
            className={inputClass}
          />
        ) : (
          <input
            id={`${id}-value`}
            value={item.search ?? ""}
            maxLength={80}
            placeholder={`Boş bırakılırsa: “${item.label}”`}
            onChange={(e) => update({ search: e.target.value || null })}
            className={inputClass}
          />
        )}
      </div>
    </div>
  );
}
