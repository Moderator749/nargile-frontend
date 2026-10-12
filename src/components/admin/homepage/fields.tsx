"use client";

import { useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, X } from "lucide-react";

import { adminSelectClass, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { ImageDropZone } from "@/components/admin/ImageDropZone";
import { adminUploadImages } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { HOME_ICONS } from "@/lib/homeIcons";
import { brokenCategoryLink } from "@/lib/catalogLinks";
import type { Category, HomeIconKey } from "@/types";

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

/**
 * A link a tile or menu entry goes to: a site path (/catalog/luleler,
 * /#avantajlar) or an https:// address, flagged red as it is typed if it is
 * neither.
 */
export function LinkField({
  value,
  onChange,
  label = "Bağlantı",
  categories = [],
}: {
  value: string;
  onChange: (href: string) => void;
  label?: string;
  /** The live categories, to catch a /catalog/<slug> link to one that does not exist. */
  categories?: Category[];
}) {
  const id = useId();
  const bad = !isSiteOrHttpsLink(value);
  const broken = bad ? null : brokenCategoryLink(value, categories);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={300}
        placeholder="/catalog/luleler veya https://…"
        aria-invalid={bad || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} font-mono ${bad || broken ? "border-red-400 focus:border-red-500" : ""}`}
      />
      {bad && <p className="text-[11px] text-red-600 dark:text-red-400">/ ile ya da https:// ile başlamalı.</p>}
      <BrokenCategoryNote broken={broken} onFix={onChange} />
    </div>
  );
}

/** "No such category" under a link field, with the closest real one a click away. */
export function BrokenCategoryNote({
  broken,
  onFix,
}: {
  broken: ReturnType<typeof brokenCategoryLink>;
  onFix: (href: string) => void;
}) {
  if (!broken) return null;
  return (
    <p className="text-[11px] text-red-600 dark:text-red-400">
      “{broken.slug}” adında bir kategori yok; bu bağlantı 404 verir.
      {broken.suggestion && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => onFix(`/catalog/${broken.suggestion!.slug}`)}
            className="font-semibold underline underline-offset-2 hover:text-red-700"
          >
            /catalog/{broken.suggestion.slug} ({broken.suggestion.name}) kullan
          </button>
        </>
      )}
    </p>
  );
}
