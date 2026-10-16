"use client";

import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { FolderTree, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { ImageField } from "@/components/admin/homepage/fields";
import {
  adminAssignProductCategory,
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminListProducts,
  adminUpdateCategory,
} from "@/lib/adminApi";
import { categoryTree } from "@/lib/categories";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import type { AdminCategory, AdminProduct } from "@/types";

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
  description: string;
}

const EMPTY: FormState = {
  name: "",
  slug: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
  imageUrl: null,
  description: "",
};

/**
 * The catalog's categories: the two-level tree (groups → sub-categories) with
 * add, rename, delete, on/off and cover image, and product → category moves.
 * Lives in "Ana Sayfa Düzenleme" › Katalog Kategorileri; `onChange` tells the
 * editor around it when the tree changed, so its pickers and link checks
 * see the new categories at once.
 */
export function AdminCategoriesView({ onChange }: { onChange?: () => void } = {}) {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const reload = () =>
    adminListCategories()
      .then((rows) => {
        setCategories(rows);
        onChange?.();
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

  const tree = useMemo(() => categoryTree(categories ?? []), [categories]);
  const byId = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);
  // Two levels: a parent must be top-level, and a group with children stays top-level.
  const editingHasChildren = !!editing && tree.some((g) => g.id === editing.id && g.children.length > 0);
  const parentOptions = tree.filter((g) => g.id !== editing?.id);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
  };

  function startEdit(c: AdminCategory) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id ? String(c.parent_id) : "",
      sortOrder: String(c.sort_order),
      isActive: c.is_active,
      imageUrl: c.image_url ?? null,
      description: c.description ?? "",
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
      description: form.description.trim() || null,
    };
    try {
      const saved = editing ? await adminUpdateCategory(editing.id, body) : await adminCreateCategory(body);
      await reload();
      void refreshStorefront();
      setEditing(null);
      setForm(EMPTY);
      setResult({ kind: "success", text: `Kaydedildi: ${saved.name}. Menü ve katalog güncellendi.` });
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

  const row = (c: AdminCategory, depth: 0 | 1) => (
    <li key={c.id} className={`flex items-center gap-3 py-2.5 ${depth ? "pl-8" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${depth ? "" : "font-semibold"} ${c.is_active ? "" : "text-slate-400 line-through dark:text-zinc-500"}`}>
          {c.name}
          {!c.is_active && (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 no-underline dark:bg-white/10 dark:text-zinc-400">
              Pasif
            </span>
          )}
        </p>
        <p className="font-mono text-xs text-slate-500 dark:text-zinc-400">/catalog/{c.slug}</p>
      </div>
      <span className="text-xs tabular-nums text-slate-500 dark:text-zinc-400" title="Doğrudan bu kategorideki ürünler">
        {c.product_count} ürün
      </span>
      <span className="w-10 text-right font-mono text-xs text-slate-400" title="Sıra">
        #{c.sort_order}
      </span>
      <div className="flex gap-1">
        {!depth && (
          <button type="button" onClick={() => startCreate(c.id)} aria-label={`${c.name} altına kategori ekle`} className={iconBtn}>
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => startEdit(c)} aria-label={`Düzenle: ${c.name}`} className={iconBtn}>
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => handleDelete(c)} aria-label={`Sil: ${c.name}`} className={iconBtn}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );

  return (
    <>
      <p className="mb-6 text-sm text-slate-600 dark:text-zinc-400">
        Katalogdaki gruplar ve alt kategoriler: ürün formundaki kategori listesi ve mağazadaki kategori sayfaları
        (/catalog/…) buradan gelir. Bir grup sayfası, alt kategorilerindeki ürünleri de listeler.
      </p>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <section aria-labelledby="tree-heading" className={`${panelClass} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="tree-heading" className="flex items-center gap-2 text-sm font-semibold">
              <FolderTree className="h-4 w-4 text-slate-400" aria-hidden /> Menü ağacı
            </h2>
            <button type="button" onClick={() => startCreate(null)} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
              <Plus className="h-4 w-4" aria-hidden /> Ana grup
            </button>
          </div>
          {loadError ? (
            <div className="mt-4">
              <Alert variant="error">{loadError}</Alert>
            </div>
          ) : categories === null ? (
            <div className="mt-4 h-64 motion-safe:animate-pulse" aria-busy />
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
              {tree.map((g) => (
                <li key={g.id}>
                  <ul>
                    {row(byId.get(g.id)!, 0)}
                    {g.children.map((c) => row(byId.get(c.id)!, 1))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={handleSubmit} className={`${panelClass} h-fit space-y-4 p-5 sm:p-6`}>
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
            hint="Sayfa adresi: /catalog/<slug>. Değiştirirseniz eski adres yeni adrese yönlendirilir."
          />
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
              placeholder="Kategori sayfasında başlığın altında görünür; uzun metin iki satırdan sonra “Devamını Oku” ile açılır."
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              İlk cümleler arama sonuçlarındaki açıklama olarak da kullanılır. Boş bırakılırsa hazır metin gösterilir.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cat-parent" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Üst grup
            </label>
            <select
              id="cat-parent"
              value={form.parentId}
              onChange={(e) => set("parentId", e.target.value)}
              disabled={editingHasChildren}
              className={selectClass}
            >
              <option value="">— Ana grup (menüde başlık)</option>
              {parentOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {editingHasChildren && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">Alt kategorisi olan bir grup ana grup olarak kalır.</p>
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
        </form>
      </div>

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

  const categoryOptions = tree.flatMap((g) => [
    <option key={g.id} value={g.id}>
      {g.name}
    </option>,
    ...g.children.map((c) => (
      <option key={c.id} value={c.id}>
        {"   "}↳ {c.name}
      </option>
    )),
  ]);

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
          {tree.flatMap((g) => [
            <option key={g.slug} value={g.slug}>
              {g.name}
            </option>,
            ...g.children.map((c) => (
              <option key={c.slug} value={c.slug}>
                {"   "}↳ {c.name}
              </option>
            )),
          ])}
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
