"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Pencil, Trash2, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useNow } from "@/hooks/useNow";
import {
  adminCreateFlashSale,
  adminDeleteFlashSale,
  adminListFlashSales,
  adminUpdateFlashSale,
} from "@/lib/adminApi";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/banner";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import { formatDate, formatMoney, parseDecimalInput } from "@/lib/format";
import type { AdminFlashSale } from "@/types";

const HOUR = 3_600_000;
const DURATIONS = [
  { label: "24 saat", ms: 24 * HOUR },
  { label: "3 gün", ms: 3 * 24 * HOUR },
  { label: "7 gün", ms: 7 * 24 * HOUR },
];

const chipClass =
  "rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300";

interface FormState {
  sku: string;
  price: string;
  starts: string;
  ends: string;
  active: boolean;
}

function emptyForm(): FormState {
  const now = Date.now();
  return {
    sku: "",
    price: "",
    starts: toLocalInputValue(new Date(now).toISOString()),
    ends: toLocalInputValue(new Date(now + 24 * HOUR).toISOString()),
    active: true,
  };
}

function status(sale: AdminFlashSale, now: number | null) {
  if (!sale.is_active) return { text: "Kapalı", className: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-zinc-400" };
  if (now !== null && sale.ends_at && Date.parse(sale.ends_at) <= now)
    return { text: "Süresi doldu", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" };
  if (now !== null && Date.parse(sale.starts_at) > now)
    return { text: "Planlandı", className: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" };
  return { text: "Yayında", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" };
}

/** Admin: create and manage flash sales ("Fırsat Ürünleri"). Checkout honours them. */
export function AdminFlashSalesView() {
  const [sales, setSales] = useState<AdminFlashSale[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<AdminFlashSale | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const now = useNow();

  useEffect(() => {
    const controller = new AbortController();
    adminListFlashSales(controller.signal)
      .then(setSales)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Fırsat ürünleri yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
  };

  const price = parseDecimalInput(form.price);
  const startsAt = fromLocalInputValue(form.starts);
  const endsAt = fromLocalInputValue(form.ends);
  const problem = !form.sku.trim()
    ? "Ürün kodunu (SKU) girin."
    : !price || Number(price) <= 0
      ? "Geçerli bir kampanya fiyatı girin (ör. 1.249,90)."
      : !startsAt
        ? "Başlangıç zamanını seçin."
        : endsAt && Date.parse(endsAt) <= Date.parse(startsAt)
          ? "Bitiş, başlangıçtan sonra olmalı."
          : null;

  function startEdit(sale: AdminFlashSale) {
    setEditing(sale);
    setForm({
      sku: sale.sku,
      price: sale.sale_price_incl_tax.replace(".", ","),
      starts: toLocalInputValue(sale.starts_at),
      ends: toLocalInputValue(sale.ends_at),
      active: sale.is_active,
    });
    setResult(null);
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm());
    setResult(null);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || problem || !price || !startsAt) return;
    setSaving(true);
    setResult(null);
    // No end: the offer runs until it is switched off (or its stock runs out).
    const body = { sku: form.sku.trim(), sale_price_incl_tax: price, starts_at: startsAt, ends_at: endsAt || null, is_active: form.active };
    try {
      const saved = editing ? await adminUpdateFlashSale(editing.id, body) : await adminCreateFlashSale(body);
      setSales((list) => [saved, ...(list ?? []).filter((s) => s.id !== saved.id)]);
      void refreshStorefront(); // catalog listings show the sale too
      setEditing(null);
      setForm(emptyForm());
      setResult({
        kind: "success",
        text: `Kaydedildi: ${saved.product_name}. Sepette bu fiyat ${saved.ends_at ? "bitiş zamanına kadar" : "kapatılana kadar"} uygulanır.`,
      });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Fırsat ürünü kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sale: AdminFlashSale) {
    if (!window.confirm(`"${sale.product_name}" fırsatı silinsin mi? Fiyat hemen normale döner.`)) return;
    try {
      await adminDeleteFlashSale(sale.id);
      setSales((list) => (list ?? []).filter((s) => s.id !== sale.id));
      void refreshStorefront();
      if (editing?.id === sale.id) cancelEdit();
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Silinemedi.") });
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Fırsat Ürünleri"
        description="Geri sayımlı şok fiyatlar. Bitişte fiyat sepette ve katalogda kendiliğinden normale döner."
      />

      <form onSubmit={handleSubmit} className={`${panelClass} space-y-5 p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{editing ? `Düzenle: ${editing.product_name}` : "Yeni fırsat"}</h2>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Vazgeç
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ürün kodu (SKU)"
            value={form.sku}
            onChange={(e) => set("sku", e.target.value)}
            placeholder="ör. KM01"
            autoComplete="off"
            hint="Ürünler & Stok sayfasındaki varyant kodu."
          />
          <Input
            label="Kampanya fiyatı (KDV dahil, ₺)"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            inputMode="decimal"
            placeholder="ör. 1.249,90"
            hint="Perakende fiyatından düşük olmalı; bayi fiyatı daha düşükse bayi kendi fiyatını öder."
          />
          <Input
            label="Başlangıç"
            type="datetime-local"
            value={form.starts}
            onChange={(e) => set("starts", e.target.value)}
          />
          <div className="space-y-2">
            <Input
              label="Bitiş (boş: süresiz)"
              type="datetime-local"
              value={form.ends}
              onChange={(e) => set("ends", e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  className={chipClass}
                  onClick={() => {
                    const from = startsAt ? Date.parse(startsAt) : Date.now();
                    set("ends", toLocalInputValue(new Date(from + d.ms).toISOString()));
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
          <div>
            <p id="flash-active-label" className="text-sm font-medium">
              Yayında
            </p>
            <p id="flash-active-hint" className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              Kapalıyken tarih aralığı içinde bile uygulanmaz.
            </p>
          </div>
          <Switch
            checked={form.active}
            onChange={(v) => set("active", v)}
            labelledBy="flash-active-label"
            describedBy="flash-active-hint"
          />
        </div>

        {result && <Alert variant={result.kind}>{result.text}</Alert>}
        {problem && (form.sku || form.price) && <p className="text-xs text-slate-500 dark:text-zinc-400">{problem}</p>}

        <div className="sm:w-48">
          <Button type="submit" loading={saving} disabled={!!problem}>
            {editing ? "Güncelle" : "Fırsatı kaydet"}
          </Button>
        </div>
      </form>

      <section aria-labelledby="flash-list" className={`${panelClass} mt-6 overflow-hidden`}>
        <h2 id="flash-list" className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-white/10">
          Kayıtlı fırsatlar
        </h2>
        {loadError ? (
          <div className="p-5">
            <Alert variant="error">{loadError}</Alert>
          </div>
        ) : sales === null ? (
          <div className="h-40 motion-safe:animate-pulse" aria-busy />
        ) : sales.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">Henüz fırsat ürünü yok.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {sales.map((sale) => {
              const st = status(sale, now);
              return (
                <li key={sale.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {sale.product_name}
                      {/* A coloured product has one offer per colour: say which. */}
                      {sale.color_name && (
                        <span className="font-normal text-slate-500 dark:text-zinc-400"> · {sale.color_name}</span>
                      )}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-zinc-400">{sale.sku}</p>
                  </div>
                  <div className="font-mono text-sm tabular-nums">
                    {formatMoney(sale.sale_price_incl_tax)}
                    {sale.regular_price_incl_tax && (
                      <span className="ml-2 text-xs text-slate-400 line-through">{formatMoney(sale.regular_price_incl_tax)}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {formatDate(sale.starts_at)} → {sale.ends_at ? formatDate(sale.ends_at) : "süresiz"}
                  </p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.className}`}>{st.text}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(sale)}
                      aria-label={`Düzenle: ${sale.product_name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sale)}
                      aria-label={`Sil: ${sale.product_name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
