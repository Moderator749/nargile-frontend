"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import Image from "next/image";
import { ImageUp, Pencil, Trash2, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { ImageDropZone } from "@/components/admin/ImageDropZone";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import {
  adminCreateBrand,
  adminDeleteBrand,
  adminDeleteBrandLogo,
  adminListBrands,
  adminUpdateBrand,
  adminUploadBrandLogo,
} from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import type { Brand, BrandWrite } from "@/types";

const MAX_LOGO_BYTES = 1024 * 1024;
const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100";

interface FormState {
  name: string;
  slug: string;
  searchTerm: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY: FormState = { name: "", slug: "", searchTerm: "", sortOrder: "0", active: true };

const toBody = (f: FormState): BrandWrite => ({
  name: f.name.trim(),
  slug: f.slug.trim() || null,
  search_term: f.searchTerm.trim() || null,
  is_active: f.active,
  sort_order: Math.max(0, Number.parseInt(f.sortOrder, 10) || 0),
});

const fromBrand = (b: Brand): FormState => ({
  name: b.name,
  slug: b.slug,
  searchTerm: b.search_term,
  sortOrder: String(b.sort_order),
  active: b.is_active,
});

/** Admin: brands for the "Markalar" menu and the homepage logo marquee. */
export function AdminBrandsView() {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadFor = useRef<Brand | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminListBrands(controller.signal)
      .then(setBrands)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Markalar yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  /** Replace one brand in the list (keeps order by sort_order, name). */
  const upsert = (b: Brand) => {
    setBrands((list) =>
      [...(list ?? []).filter((x) => x.id !== b.id), b].sort(
        (x, y) => x.sort_order - y.sort_order || x.name.localeCompare(y.name, "tr"),
      ),
    );
    setEditing((e) => (e?.id === b.id ? b : e)); // keeps the form's logo preview current
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
  };

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !form.name.trim()) return;
    setSaving(true);
    try {
      const saved = editing ? await adminUpdateBrand(editing.id, toBody(form)) : await adminCreateBrand(toBody(form));
      upsert(saved);
      void refreshStorefront();
      // Stay on the saved brand so its logo can be dropped in right away.
      setEditing(saved);
      setForm(fromBrand(saved));
      setResult({ kind: "success", text: `Kaydedildi: ${saved.name}.` });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Marka kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  async function run(brand: Brand, action: () => Promise<Brand | void>, fallback: string) {
    setBusyId(brand.id);
    setResult(null);
    try {
      const updated = await action();
      if (updated) upsert(updated);
      void refreshStorefront();
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, fallback) });
    } finally {
      setBusyId(null);
    }
  }

  const toggleActive = (b: Brand, active: boolean) =>
    run(b, () => adminUpdateBrand(b.id, toBody({ ...fromBrand(b), active })), "Durum değiştirilemedi.");

  function pickLogo(b: Brand) {
    uploadFor.current = b;
    fileInput.current?.click();
  }

  function onFile(file: File | undefined) {
    const brand = uploadFor.current;
    if (fileInput.current) fileInput.current.value = "";
    if (!file || !brand) return;
    if (file.size > MAX_LOGO_BYTES) {
      setResult({ kind: "error", text: "Logo en fazla 1 MB olabilir." });
      return;
    }
    void run(brand, () => adminUploadBrandLogo(brand.id, file), "Logo yüklenemedi (PNG, JPEG veya WebP).");
  }

  async function remove(b: Brand) {
    if (!window.confirm(`"${b.name}" markası silinsin mi?`)) return;
    await run(
      b,
      async () => {
        await adminDeleteBrand(b.id);
        setBrands((list) => (list ?? []).filter((x) => x.id !== b.id));
        if (editing?.id === b.id) {
          setEditing(null);
          setForm(EMPTY);
        }
      },
      "Silinemedi.",
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Markalar"
        description="Menüdeki “Markalar” ve ana sayfadaki kayan marka şeridi. Logosu olmayan marka adıyla gösterilir."
      />

      {/* One hidden picker shared by every row. */}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <section aria-labelledby="brands-heading" className={`${panelClass} overflow-hidden`}>
          <h2 id="brands-heading" className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">
            Marka listesi
          </h2>
          {loadError ? (
            <div className="p-5">
              <Alert variant="error">{loadError}</Alert>
            </div>
          ) : brands === null ? (
            <div className="h-48 motion-safe:animate-pulse" aria-busy />
          ) : brands.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">Henüz marka yok.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {brands.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-4" aria-busy={busyId === b.id || undefined}>
                  {/* Fixed preview box: matches how the marquee renders the logo. */}
                  <div className="flex h-14 w-32 shrink-0 items-center justify-center rounded-xl bg-slate-50 px-3 dark:bg-white/5">
                    {b.logo_url ? (
                      <Image src={b.logo_url} alt="" width={112} height={40} unoptimized className="h-9 w-auto max-w-full object-contain grayscale" />
                    ) : (
                      <span className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{b.name}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                      Arama: “{b.search_term}” · Sıra #{b.sort_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span id={`brand-${b.id}-active`} className="sr-only">
                      {b.name} yayında
                    </span>
                    <Switch
                      checked={b.is_active}
                      disabled={busyId === b.id}
                      onChange={(v) => void toggleActive(b, v)}
                      labelledBy={`brand-${b.id}-active`}
                    />
                    <button type="button" onClick={() => pickLogo(b)} disabled={busyId === b.id} aria-label={`Logo yükle: ${b.name}`} title="Logo yükle" className={iconBtn}>
                      <ImageUp className="h-4 w-4" aria-hidden />
                    </button>
                    {b.logo_url && (
                      <button
                        type="button"
                        onClick={() => void run(b, () => adminDeleteBrandLogo(b.id), "Logo kaldırılamadı.")}
                        disabled={busyId === b.id}
                        aria-label={`Logoyu kaldır: ${b.name}`}
                        title="Logoyu kaldır"
                        className={iconBtn}
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(b);
                        setForm(fromBrand(b));
                        setResult(null);
                      }}
                      aria-label={`Düzenle: ${b.name}`}
                      className={iconBtn}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button type="button" onClick={() => void remove(b)} aria-label={`Sil: ${b.name}`} className={iconBtn}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={handleSubmit} className={`${panelClass} h-fit space-y-4 p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editing ? `Düzenle: ${editing.name}` : "Yeni marka"}</h2>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400"
              >
                <X className="h-3.5 w-3.5" aria-hidden /> Vazgeç
              </button>
            )}
          </div>
          <Input label="Marka adı" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ör. Mr. Wood" />
          <Input
            label="Katalog araması"
            value={form.searchTerm}
            onChange={(e) => set("searchTerm", e.target.value)}
            placeholder="boş: marka adı"
            hint="Marka bağlantısı katalogda bu kelimeyi arar (ürün adlarında geçmeli)."
          />
          <Input label="Adres (slug)" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="boş: addan üretilir" />
          <Input label="Sıra" type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <p id="brand-form-active" className="text-sm font-medium">
              Menüde ve şeritte göster
            </p>
            <Switch checked={form.active} onChange={(v) => set("active", v)} labelledBy="brand-form-active" />
          </div>
          {editing ? (
            <ImageDropZone
              label="Logo"
              preview={editing.logo_url}
              busy={busyId === editing.id}
              onFile={(file) => void run(editing, () => adminUploadBrandLogo(editing.id, file), "Logo yüklenemedi (PNG, JPEG veya WebP).")}
              onReject={(text) => setResult({ kind: "error", text })}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-white/15 dark:text-zinc-400">
              Logo yüklemek için markayı kaydedin; ardından buraya sürükleyip bırakabilirsiniz.
            </p>
          )}
          {result && <Alert variant={result.kind}>{result.text}</Alert>}
          <Button type="submit" loading={saving} disabled={!form.name.trim()}>
            {editing ? "Güncelle" : "Marka ekle"}
          </Button>
        </form>
      </div>
    </>
  );
}
