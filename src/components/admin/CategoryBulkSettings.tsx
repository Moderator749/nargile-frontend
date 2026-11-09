"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import { erpTableClass } from "@/components/admin/products/ErpCatalogPrices";
import { GENERAL_RULES } from "@/components/admin/products/generalRules";
import { SHEET_COLUMNS } from "@/components/admin/products/sheetDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { adminCategoryBulkScope, adminCategoryBulkUpdate } from "@/lib/adminApi";
import {
  bulkBody,
  changeCount,
  emptyBulkDraft,
  type BulkDraft,
  type DisplayChoice,
  type QuantityChoice,
  type RuleChoice,
} from "@/lib/categoryBulk";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import type { AdminCategory } from "@/types";

const { th, rowHead, note } = erpTableClass;

const DISPLAY_CHOICES: { value: DisplayChoice; label: string }[] = [
  { value: "keep", label: "Değiştirme" },
  { value: "excl", label: "KDV hariç göster" },
  { value: "incl", label: "KDV dahil göster" },
  { value: "clear", label: "Seçimi kaldır" },
];
const RULE_CHOICES: { value: RuleChoice; label: string }[] = [
  { value: "keep", label: "Değiştirme" },
  { value: "yes", label: "Evet" },
  { value: "no", label: "Hayır" },
];

// A three-way switch: the radios hidden, their labels the segments.
const segments = "inline-flex shrink-0 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5";
const segment =
  "cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:text-slate-800 has-[:checked]:bg-white has-[:checked]:text-slate-900 has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-red-500 dark:text-zinc-400 dark:hover:text-zinc-100 dark:has-[:checked]:bg-zinc-700 dark:has-[:checked]:text-white";
// A row the bulk write will change.
const changedRow = "bg-amber-50/70 dark:bg-amber-500/[0.06]";

/**
 * "Tüm Ürünlere Toplu Ayar Uygula" for a category: the product sheet's "Genel
 * Kurallar" and the catalogue's "KDV gösterimi", written on all of its
 * products (with its subcategories', by default) in one go. Each field starts
 * at "Değiştirme", and only the ones changed are written; the rest stay as
 * each product has them.
 */
export function CategoryBulkSettingsDialog({
  category,
  hasSubcategories,
  onClose,
  onApplied,
}: {
  category: AdminCategory | null;
  hasSubcategories: boolean;
  onClose: () => void;
  /** Told the write went through, with what to say. */
  onApplied: (message: string) => void;
}) {
  return (
    <Dialog open={category !== null} onClose={onClose} title={`Tüm Ürünlere Toplu Ayar · ${category?.name ?? ""}`} size="lg">
      {/* Keyed on the category, so the next one starts at "Değiştirme". */}
      {category && (
        <BulkForm
          key={category.id}
          category={category}
          hasSubcategories={hasSubcategories}
          onClose={onClose}
          onApplied={onApplied}
        />
      )}
    </Dialog>
  );
}

function BulkForm({
  category,
  hasSubcategories,
  onClose,
  onApplied,
}: {
  category: AdminCategory;
  hasSubcategories: boolean;
  onClose: () => void;
  onApplied: (message: string) => void;
}) {
  const name = useId();
  const [draft, setDraft] = useState<BulkDraft>(emptyBulkDraft);
  const [scope, setScope] = useState<{ products: number; with_subcategories: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    adminCategoryBulkScope(category.id, controller.signal)
      .then(setScope)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Ürün sayısı alınamadı."));
      });
    return () => controller.abort();
  }, [category.id]);

  const update = (patch: Partial<BulkDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };
  const reach = scope && (draft.includeSubcategories ? scope.with_subcategories : scope.products);
  const changes = changeCount(draft);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const built = bulkBody(draft);
    if ("error" in built) return setError(built.error);
    const where = draft.includeSubcategories && hasSubcategories ? "ve alt kategorilerindeki" : "kategorisindeki";
    if (!window.confirm(`“${category.name}” ${where} ${reach ?? "tüm"} ürünün ${changes} ayarı değişecek. Bu işlem geri alınamaz. Devam edilsin mi?`))
      return;
    setSaving(true);
    try {
      const updated = await adminCategoryBulkUpdate(category.id, built.body);
      void refreshStorefront();
      onApplied(`“${category.name}”: ${updated} ürünün ayarları güncellendi.`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Ayarlar uygulanamadı."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Seçtiğiniz ayarlar bu kategorideki bütün ürünlere tek seferde yazılır. “Değiştirme” olarak kalan alanlara
          dokunulmaz; her ürün kendi değerini korur.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-white/10">
          {hasSubcategories ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.includeSubcategories}
                onChange={(e) => update({ includeSubcategories: e.target.checked })}
                className="h-4 w-4 accent-red-600"
              />
              Alt kategorilerdeki ürünler de dahil
            </label>
          ) : (
            <span className="text-sm font-medium">Kategorideki ürünler</span>
          )}
          {/* The figure's room held while it loads, so the line does not jump. */}
          <span className="min-w-[5rem] text-right text-sm font-semibold tabular-nums" aria-live="polite">
            {reach === null ? <span className="text-slate-400">…</span> : `${reach} ürün`}
          </span>
        </div>
      </div>

      <section aria-labelledby={`${name}-kdv`} className="space-y-2">
        <h3 id={`${name}-kdv`} className="text-sm font-semibold">
          KDV gösterimi <span className="font-normal text-slate-500 dark:text-zinc-400">· yalnızca PDF fiyat kataloğu</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
            <caption className="sr-only">Müşteri grubuna göre fiyat kataloğunda KDV gösterimi</caption>
            <thead>
              <tr>
                <th scope="col" className={`${th} w-40 text-left`}>
                  Grup
                </th>
                {SHEET_COLUMNS.map(({ segment, label }) => (
                  <th key={segment} scope="col" className={`${th} text-center`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${rowHead} w-40`}>
                  KDV gösterimi
                  <span className={note}>Seçimi kaldır: KDV hariç, KDV ve toplam birlikte</span>
                </th>
                {SHEET_COLUMNS.map(({ segment, label }) => (
                  <td
                    key={segment}
                    className={`border border-slate-300 px-3 py-2 transition-colors duration-200 dark:border-white/15 ${
                      draft.display[segment] === "keep" ? "" : changedRow
                    }`}
                  >
                    <div role="radiogroup" aria-label={`${label} KDV gösterimi`} className="flex flex-col gap-1.5">
                      {DISPLAY_CHOICES.map(({ value, label: choice }) => (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-wide ${
                            value === "keep" ? "text-slate-500 dark:text-zinc-400" : "text-slate-700 dark:text-zinc-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${name}-${segment}`}
                            checked={draft.display[segment] === value}
                            onChange={() => update({ display: { ...draft.display, [segment]: value } })}
                            className="h-3.5 w-3.5 accent-red-600"
                          />
                          {choice}
                        </label>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby={`${name}-rules`} className="space-y-2">
        <h3 id={`${name}-rules`} className="text-sm font-semibold">
          Genel Kurallar
        </h3>
        <ul className="divide-y divide-dashed divide-slate-200 rounded-lg border border-slate-200 dark:divide-white/10 dark:border-white/10">
          {GENERAL_RULES.map(({ field, id, label, hint }) => (
            <li key={field}>
              <RuleRow
                id={`${name}-${id}`}
                label={label}
                hint={hint}
                changed={draft.rules[field] !== "keep"}
                choices={RULE_CHOICES}
                value={draft.rules[field]}
                onChange={(value) => update({ rules: { ...draft.rules, [field]: value } })}
              />
              {field === "is_free_shipping" && (
                <QuantityRow
                  id={`${name}-qty`}
                  value={draft.minQuantity}
                  onChange={(minQuantity) => update({ minQuantity })}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Held at the foot while the form scrolls; on a phone the two buttons share a line. */}
      <div className="sticky bottom-0 -mx-5 -mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-200 bg-white px-5 py-3 dark:border-white/10 dark:bg-zinc-900">
        <p className="basis-full text-xs text-slate-500 sm:me-auto sm:basis-auto dark:text-zinc-400" aria-live="polite">
          {changes === 0 ? "Henüz bir ayar seçilmedi." : `${changes} ayar değişecek.`}
        </p>
        <Button type="button" variant="secondary" onClick={onClose} className="w-auto! flex-1 sm:flex-none">
          Vazgeç
        </Button>
        <Button type="submit" loading={saving} disabled={changes === 0 || reach === 0} className="w-auto! flex-[2] sm:flex-none">
          {reach ? `${reach} ürüne uygula` : "Uygula"}
        </Button>
      </div>
    </form>
  );
}

function RuleRow<T extends string>({
  id,
  label,
  hint,
  changed,
  choices,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  changed: boolean;
  choices: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5 transition-colors duration-200 ${changed ? changedRow : ""}`}
    >
      <span className="min-w-0 flex-1 basis-56">
        <span id={id} className="block text-sm font-medium">
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-zinc-400">{hint}</span>}
      </span>
      <span role="radiogroup" aria-labelledby={id} className={segments}>
        {choices.map((c) => (
          <label key={c.value} className={segment}>
            <input type="radio" name={id} checked={value === c.value} onChange={() => onChange(c.value)} className="sr-only" />
            {c.label}
          </label>
        ))}
      </span>
    </div>
  );
}

/** "Adet Şartı": left, dropped ("Şart yok"), or a number of units. */
function QuantityRow({ id, value, onChange }: { id: string; value: QuantityChoice; onChange: (value: QuantityChoice) => void }) {
  const typed = value.mode === "set" ? value.value : "";
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-dashed border-slate-200 px-3 py-2.5 ps-7 transition-colors duration-200 dark:border-white/10 ${
        value.mode === "keep" ? "" : changedRow
      }`}
    >
      <span className="min-w-0 flex-1 basis-56">
        <span id={id} className="block text-sm font-medium">
          Adet Şartı
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
          Ücretsiz kargo bu adetten itibaren geçerli.
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span role="radiogroup" aria-labelledby={id} className={segments}>
          {(
            [
              { mode: "keep", label: "Değiştirme" },
              { mode: "none", label: "Şart yok" },
              { mode: "set", label: "Adet" },
            ] as const
          ).map((c) => (
            <label key={c.mode} className={segment}>
              <input
                type="radio"
                name={id}
                checked={value.mode === c.mode}
                onChange={() => onChange(c.mode === "set" ? { mode: "set", value: typed } : { mode: c.mode })}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </span>
        {/* Typing a number picks "Adet". */}
        <input
          type="text"
          inputMode="numeric"
          value={typed}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onChange(digits ? { mode: "set", value: digits } : value.mode === "set" ? { mode: "set", value: "" } : value);
          }}
          aria-label="Adet şartı (adet)"
          placeholder="—"
          className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-right text-sm font-semibold tabular-nums focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900"
        />
      </span>
    </div>
  );
}
