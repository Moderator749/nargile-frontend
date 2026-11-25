"use client";

import { useMemo, useState } from "react";
import { EyeOff, Lock, LockOpen, Plus, Search, X } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import {
  SUGGESTED_ROUTES,
  allBrands,
  allCategories,
  allRoutes,
  categoryTree,
  clearAll,
  normalizeRoute,
  restrictAll,
  type AccessOption,
  type TierRules,
} from "@/lib/accessRules";

const QUICK_ROUTES = SUGGESTED_ROUTES.map((r) => r.path);

const fold = (s: string) => s.toLocaleLowerCase("tr-TR");

/**
 * The three lists of a set of access rules — categories (a ticked one hides
 * its subcategories, shown ticked and locked), brands, storefront pages — for
 * a customer group or one customer ("Cari bazında"). Holds no state of its own
 * but the searches: the caller keeps the draft and saves it.
 *
 * "Tümünü Kısıtla" closes every category (by its roots: the rest go with
 * them), every brand and every quick-select page at once; "Tümünü Kaldır"
 * empties the set; each column's "Tümü / Temizle" does the same for that
 * column alone. A customer's group rules ("grubundan") are never part of
 * the set, so the bulk actions leave them as they are. Nothing is saved
 * until the caller's "Kaydet": `dirty` says so above the columns.
 */
export function AccessRulesEditor({
  draft,
  categories,
  brands,
  onChange,
  inherited: fromGroup,
  dirty = false,
}: {
  draft: TierRules;
  categories: AccessOption[];
  brands: AccessOption[];
  onChange: (next: TierRules) => void;
  /** A customer's group's own set: shown as already closed, not editable here. */
  inherited?: TierRules;
  /** Unsaved changes: said above the columns, so a bulk action is not taken for saved. */
  dirty?: boolean;
}) {
  const [catQuery, setCatQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [route, setRoute] = useState("");
  const tree = useMemo(() => categoryTree(categories), [categories]);

  const edit = (patch: Partial<TierRules>) => onChange({ ...draft, ...patch });
  const toggle = (key: "category_ids" | "brand_ids", id: number) =>
    edit({ [key]: draft[key].includes(id) ? draft[key].filter((x) => x !== id) : [...draft[key], id] });

  const parents = new Map(categories.map((c) => [c.id, c.parent_id]));
  const closedAbove = (id: number, ids: number[]) => {
    let p = parents.get(id) ?? null;
    const seen = new Set<number>();
    while (p !== null && !seen.has(p)) {
      if (ids.includes(p)) return true;
      seen.add(p);
      p = parents.get(p) ?? null;
    }
    return false;
  };
  const groupCats = fromGroup?.category_ids ?? [];
  const groupBrands = fromGroup?.brand_ids ?? [];
  const groupRoutes = fromGroup?.routes ?? [];

  const addRoute = (raw: string) => {
    const path = normalizeRoute(raw);
    if (path === "/" || draft.routes.includes(path)) return;
    edit({ routes: [...draft.routes, path] });
    setRoute("");
  };

  const shownCats = tree.filter((c) => !catQuery.trim() || fold(c.name).includes(fold(catQuery.trim())));
  const shownBrands = brands.filter((b) => !brandQuery.trim() || fold(b.name).includes(fold(brandQuery.trim())));

  const bulkButton =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40";
  const restrictedAll = restrictAll(draft, categories, brands, QUICK_ROUTES, fromGroup);
  const isEverything =
    restrictedAll.category_ids.every((id) => draft.category_ids.includes(id)) &&
    restrictedAll.brand_ids.every((id) => draft.brand_ids.includes(id)) &&
    restrictedAll.routes.every((r) => draft.routes.includes(r));
  const isEmpty = draft.category_ids.length + draft.brand_ids.length + draft.routes.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(restrictedAll)}
          disabled={isEverything}
          className={`${bulkButton} bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400`}
          title="Tüm kategoriler, tüm markalar ve hızlı seçimdeki tüm sayfalar kapanır"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden /> Tümünü Kısıtla
        </button>
        <button
          type="button"
          onClick={() => onChange(clearAll())}
          disabled={isEmpty}
          className={`${bulkButton} text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5`}
          title={fromGroup ? "Bu carinin kendi kısıtlamaları kalkar; fiyat grubundan gelenler kalır" : "Bu grubun tüm kısıtlamaları kalkar"}
        >
          <LockOpen className="h-3.5 w-3.5" aria-hidden /> Tümünü Kaldır
        </button>
        {fromGroup && (
          <span className="text-xs text-slate-500 dark:text-zinc-400">“grubundan” olanlar burada değişmez.</span>
        )}
        {dirty && (
          <span role="status" className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            Kaydedilmemiş değişiklikler var — uygulamak için Kaydet’e basın
          </span>
        )}
      </div>
    <div className="grid gap-6 xl:grid-cols-3">
      <section className={`${panelClass} p-5`} aria-label="Kategoriler">
        <Header
          title="Kategoriler"
          note={`${draft.category_ids.length} kapalı · alt kategoriler de kapanır`}
          onAll={() => edit({ category_ids: allCategories(categories, groupCats) })}
          onClear={() => edit({ category_ids: [] })}
          clearDisabled={draft.category_ids.length === 0}
        />
        <SearchBox value={catQuery} onChange={setCatQuery} label="Kategori ara" />
        <ul className="mt-3 max-h-[28rem] space-y-0.5 overflow-y-auto pr-1">
          {shownCats.map((c) => {
            const byGroup = groupCats.includes(c.id) || closedAbove(c.id, groupCats);
            const locked = byGroup || closedAbove(c.id, draft.category_ids);
            return (
              <li key={c.id}>
                <Tick
                  checked={locked || draft.category_ids.includes(c.id)}
                  disabled={locked}
                  onChange={() => toggle("category_ids", c.id)}
                  label={c.name}
                  muted={!c.is_active}
                  indent={catQuery.trim() ? 0 : c.depth}
                  note={byGroup ? "grubundan" : locked ? "üst kategoriyle" : !c.is_active ? "pasif" : undefined}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${panelClass} p-5`} aria-label="Markalar">
        <Header
          title="Markalar"
          note={`${draft.brand_ids.length} kapalı`}
          onAll={() => edit({ brand_ids: allBrands(brands, groupBrands) })}
          onClear={() => edit({ brand_ids: [] })}
          clearDisabled={draft.brand_ids.length === 0}
        />
        <SearchBox value={brandQuery} onChange={setBrandQuery} label="Marka ara" />
        <ul className="mt-3 max-h-[28rem] space-y-0.5 overflow-y-auto pr-1">
          {shownBrands.map((b) => {
            const byGroup = groupBrands.includes(b.id);
            return (
              <li key={b.id}>
                <Tick
                  checked={byGroup || draft.brand_ids.includes(b.id)}
                  disabled={byGroup}
                  onChange={() => toggle("brand_ids", b.id)}
                  label={b.name}
                  muted={!b.is_active}
                  note={byGroup ? "grubundan" : !b.is_active ? "pasif" : undefined}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${panelClass} p-5`} aria-label="Sayfalar">
        <Header
          title="Sayfalar"
          note="Yol ve altındaki sayfalar kapanır"
          onAll={() => edit({ routes: allRoutes(draft.routes, QUICK_ROUTES, groupRoutes) })}
          onClear={() => edit({ routes: [] })}
          clearDisabled={draft.routes.length === 0}
          allTitle="Hızlı seçimdeki tüm sayfalar kapanır"
        />
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addRoute(route);
          }}
        >
          <input
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            placeholder="/firsat-urunleri"
            aria-label="Sayfa yolu"
            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm dark:border-white/15 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={normalizeRoute(route) === "/"}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors duration-200 hover:bg-slate-50 disabled:opacity-40 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
          >
            <Plus className="h-4 w-4" aria-hidden /> Ekle
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_ROUTES.filter((r) => !draft.routes.includes(r.path) && !groupRoutes.includes(r.path)).map((r) => (
            <button
              key={r.path}
              type="button"
              onClick={() => addRoute(r.path)}
              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 transition-colors duration-200 hover:bg-slate-50 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/5"
              title={r.path}
            >
              + {r.label}
            </button>
          ))}
        </div>
        <ul className="mt-4 space-y-1.5">
          {draft.routes.length === 0 && groupRoutes.length === 0 && (
            <li className="text-sm text-slate-500 dark:text-zinc-400">Kapalı sayfa yok.</li>
          )}
          {groupRoutes.map((r) => (
            <li key={`g-${r}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 opacity-70 dark:bg-white/[0.03]">
              <span className="flex items-center gap-2 font-mono text-sm">
                <EyeOff className="h-3.5 w-3.5 text-red-500" aria-hidden /> {r}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">grubundan</span>
            </li>
          ))}
          {draft.routes.map((r) => (
            <li key={r} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[0.03]">
              <span className="flex items-center gap-2 font-mono text-sm">
                <EyeOff className="h-3.5 w-3.5 text-red-500" aria-hidden /> {r}
              </span>
              <button
                type="button"
                onClick={() => edit({ routes: draft.routes.filter((x) => x !== r) })}
                aria-label={`${r} kısıtlamasını kaldır`}
                className="rounded p-1 text-slate-500 transition-colors duration-200 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500 dark:text-zinc-400">
          Ana sayfa kapatılamaz. Kategori, marka ve ürün sayfaları yukarıdaki seçimlerle kapanır; burası diğer sayfalar
          içindir (ör. /firsat-urunleri, /fiyat-katalogu).
        </p>
      </section>
    </div>
    </div>
  );
}

function Header({
  title,
  note,
  onAll,
  onClear,
  clearDisabled,
  allTitle,
}: {
  title: string;
  note: string;
  onAll: () => void;
  onClear: () => void;
  clearDisabled: boolean;
  allTitle?: string;
}) {
  const chip =
    "rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors duration-150 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10";
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">{title}</h2>
        <span className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={onAll} className={`${chip} text-red-700 dark:text-red-300`} title={allTitle ?? `${title}: tümü kapanır`}>
            Tümü
          </button>
          <span className="text-slate-300 dark:text-zinc-600" aria-hidden>/</span>
          <button type="button" onClick={onClear} disabled={clearDisabled} className={`${chip} text-slate-600 dark:text-zinc-300`} title={`${title}: kısıtlamalar kalkar`}>
            Temizle
          </button>
        </span>
      </div>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{note}</p>
    </div>
  );
}

function SearchBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative mt-3 block">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        aria-label={label}
        className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm dark:border-white/15 dark:bg-zinc-900"
      />
    </label>
  );
}

function Tick({
  checked,
  onChange,
  label,
  disabled,
  muted,
  indent = 0,
  note,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  muted?: boolean;
  indent?: number;
  note?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-white/5 ${
        disabled ? "cursor-default opacity-70" : ""
      }`}
      style={{ paddingInlineStart: `${0.5 + indent * 1.1}rem` }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 dark:border-white/20"
      />
      <span
        className={`min-w-0 flex-1 truncate ${
          checked ? "font-semibold text-red-700 dark:text-red-300" : muted ? "text-slate-400 dark:text-zinc-500" : "text-slate-800 dark:text-zinc-200"
        }`}
      >
        {label}
      </span>
      {note && <span className="shrink-0 text-[10px] text-slate-400 dark:text-zinc-500">{note}</span>}
    </label>
  );
}
