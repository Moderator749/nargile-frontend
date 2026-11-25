"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeOff, Loader2, Plus, Save, Search, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import {
  ACCESS_TIERS,
  SUGGESTED_ROUTES,
  categoryTree,
  fetchAccessRules,
  normalizeRoute,
  saveTierRules,
  type AccessRules,
  type AccessTier,
  type TierRules,
} from "@/lib/accessRules";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";

const fold = (s: string) => s.toLocaleLowerCase("tr-TR");
const same = (a: TierRules, b: TierRules) =>
  JSON.stringify([[...a.category_ids].sort(), [...a.brand_ids].sort(), [...a.routes].sort()]) ===
  JSON.stringify([[...b.category_ids].sort(), [...b.brand_ids].sort(), [...b.routes].sort()]);

/**
 * "Grup Erişim Kısıtlamaları": per customer group (and for visitors not
 * signed in), the categories, brands and storefront pages it may not see.
 * A ticked category hides its subcategories too. Saved per group; the API
 * enforces it from the next request on (lists, search, product pages, the
 * price catalogue, the cart), and the storefront shows a notice in place of
 * a closed page.
 */
export function AdminAccessRulesView() {
  const [data, setData] = useState<AccessRules | null>(null);
  const [tier, setTier] = useState<AccessTier>("WHOLESALE");
  const [drafts, setDrafts] = useState<Partial<Record<AccessTier, TierRules>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [catQuery, setCatQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [route, setRoute] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchAccessRules(controller.signal)
      .then(setData)
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Kısıtlamalar yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const tree = useMemo(() => (data ? categoryTree(data.categories) : []), [data]);

  if (!data) {
    return (
      <>
        <AdminPageHeader title="Grup Erişim Kısıtlamaları" />
        {loadError ? <Alert variant="error">{loadError}</Alert> : <div className={`${panelClass} h-96 motion-safe:animate-pulse`} />}
      </>
    );
  }

  const saved = data.tiers[tier];
  const draft = drafts[tier] ?? saved;
  const dirty = !same(draft, saved);
  const edit = (patch: Partial<TierRules>) => {
    setDrafts((d) => ({ ...d, [tier]: { ...draft, ...patch } }));
    setResult(null);
  };
  const toggle = (key: "category_ids" | "brand_ids", id: number) =>
    edit({ [key]: draft[key].includes(id) ? draft[key].filter((x) => x !== id) : [...draft[key], id] });

  // A ticked category's subcategories are hidden with it: shown ticked and locked.
  const parents = new Map(data.categories.map((c) => [c.id, c.parent_id]));
  const inherited = (id: number) => {
    let p = parents.get(id) ?? null;
    const seen = new Set<number>();
    while (p !== null && !seen.has(p)) {
      if (draft.category_ids.includes(p)) return true;
      seen.add(p);
      p = parents.get(p) ?? null;
    }
    return false;
  };

  const addRoute = (raw: string) => {
    const path = normalizeRoute(raw);
    if (path === "/" || draft.routes.includes(path)) return;
    edit({ routes: [...draft.routes, path] });
    setRoute("");
  };

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const next = await saveTierRules(tier, draft);
      setData(next);
      setDrafts((d) => ({ ...d, [tier]: undefined }));
      void refreshStorefront(); // a visitor's cached pages follow the new rules
      setResult({ kind: "success", text: `${ACCESS_TIERS.find((t) => t.tier === tier)!.label} kısıtlamaları kaydedildi; hemen uygulanır.` });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  const count = (t: AccessTier) => {
    const r = drafts[t] ?? data.tiers[t];
    return r.category_ids.length + r.brand_ids.length + r.routes.length;
  };
  const shownCats = tree.filter((c) => !catQuery.trim() || fold(c.name).includes(fold(catQuery.trim())));
  const shownBrands = data.brands.filter((b) => !brandQuery.trim() || fold(b.name).includes(fold(brandQuery.trim())));

  return (
    <>
      <AdminPageHeader
        title="Grup Erişim Kısıtlamaları"
        description="Seçtiğiniz müşteri grubunun göremeyeceği kategorileri, markaları ve sayfaları işaretleyin. Kapalı ürünler listelerde, aramada, ürün sayfalarında, fiyat kataloğunda ve sepette görünmez; doğrudan adresle girilince “Bu sayfa veya ürün grubu hesap türünüz için görüntülemeye kapalıdır” uyarısı çıkar. Yöneticiler her şeyi görür."
        actions={
          <button
            type="button"
            onClick={() => void save()}
            disabled={!dirty || saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Kaydet
          </button>
        }
      />

      <div role="tablist" aria-label="Müşteri grubu" className="mb-4 flex flex-wrap gap-2">
        {ACCESS_TIERS.map(({ tier: t, label, hint }) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tier === t}
            title={hint}
            onClick={() => {
              setTier(t);
              setResult(null);
            }}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 ${
              tier === t
                ? "bg-red-600 text-white dark:bg-red-500"
                : "text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
            }`}
          >
            {label}
            {count(t) > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] ${tier === t ? "bg-white/20" : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`}>
                {count(t)}
              </span>
            )}
            {drafts[t] && !same(drafts[t]!, data.tiers[t]) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="kaydedilmedi" />}
          </button>
        ))}
      </div>

      {result && (
        <div className="mb-4">
          <Alert variant={result.kind}>{result.text}</Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className={`${panelClass} p-5`} aria-labelledby="acc-cats">
          <Header id="acc-cats" title="Kategoriler" note={`${draft.category_ids.length} kapalı · alt kategoriler de kapanır`} />
          <SearchBox value={catQuery} onChange={setCatQuery} label="Kategori ara" />
          <ul className="mt-3 max-h-[28rem] space-y-0.5 overflow-y-auto pr-1">
            {shownCats.map((c) => {
              const locked = inherited(c.id);
              const on = locked || draft.category_ids.includes(c.id);
              return (
                <li key={c.id}>
                  <Tick
                    checked={on}
                    disabled={locked}
                    onChange={() => toggle("category_ids", c.id)}
                    label={c.name}
                    muted={!c.is_active}
                    indent={catQuery.trim() ? 0 : c.depth}
                    note={locked ? "üst kategoriyle" : !c.is_active ? "pasif" : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${panelClass} p-5`} aria-labelledby="acc-brands">
          <Header id="acc-brands" title="Markalar" note={`${draft.brand_ids.length} kapalı`} />
          <SearchBox value={brandQuery} onChange={setBrandQuery} label="Marka ara" />
          <ul className="mt-3 max-h-[28rem] space-y-0.5 overflow-y-auto pr-1">
            {shownBrands.map((b) => (
              <li key={b.id}>
                <Tick
                  checked={draft.brand_ids.includes(b.id)}
                  onChange={() => toggle("brand_ids", b.id)}
                  label={b.name}
                  muted={!b.is_active}
                  note={!b.is_active ? "pasif" : undefined}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className={`${panelClass} p-5`} aria-labelledby="acc-routes">
          <Header id="acc-routes" title="Sayfalar" note="Yol ve altındaki sayfalar kapanır" />
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
            {SUGGESTED_ROUTES.filter((r) => !draft.routes.includes(r.path)).map((r) => (
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
            {draft.routes.length === 0 && <li className="text-sm text-slate-500 dark:text-zinc-400">Kapalı sayfa yok.</li>}
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
    </>
  );
}

function Header({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 id={id} className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
        {title}
      </h2>
      <span className="text-xs text-slate-500 dark:text-zinc-400">{note}</span>
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
      <span className={`min-w-0 flex-1 truncate ${checked ? "font-semibold text-red-700 dark:text-red-300" : muted ? "text-slate-400 dark:text-zinc-500" : "text-slate-800 dark:text-zinc-200"}`}>
        {label}
      </span>
      {note && <span className="shrink-0 text-[10px] text-slate-400 dark:text-zinc-500">{note}</span>}
    </label>
  );
}
