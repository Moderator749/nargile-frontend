"use client";

import { useState, type SubmitEvent } from "react";
import { Save } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminUpdatePricing, type PriceInput } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { excludeVat, formatMoney, parseDecimalInput } from "@/lib/format";
import type { AdminVariant, AdminVariantPrice, Segment } from "@/types";

interface PricingEditorProps {
  variant: AdminVariant;
  segments: Segment[];
  onSaved: (prices: AdminVariantPrice[]) => void;
}

const toField = (decimal: string | undefined) => (decimal ? decimal.replace(".", ",") : "");

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm tabular-nums text-slate-900 transition-[border-color,box-shadow] focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100";

/** Edit a variant's VAT-inclusive price for every customer segment. */
export function PricingEditor({ variant, segments, onSaved }: PricingEditorProps) {
  const existing = new Map(
    variant.prices.filter((p) => p.currency === "TRY").map((p) => [p.segment_id, p]),
  );
  const defaultVat = variant.prices[0]?.vat_rate ?? "20.00";

  const [rows, setRows] = useState(() =>
    Object.fromEntries(
      segments.map((s) => [
        s.id,
        { incl: toField(existing.get(s.id)?.price_incl_tax), vat: toField(existing.get(s.id)?.vat_rate ?? defaultVat) },
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const parsed = segments.map((s) => {
    const row = rows[s.id];
    const incl = parseDecimalInput(row.incl);
    const vat = parseDecimalInput(row.vat);
    const empty = row.incl.trim() === "";
    const invalid = !empty && (incl === null || vat === null || Number(vat) >= 100);
    return { segment: s, row, incl, vat, empty, invalid };
  });
  const hasInvalid = parsed.some((p) => p.invalid);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || hasInvalid) return;
    const prices: PriceInput[] = parsed
      .filter((p) => !p.empty && p.incl && p.vat)
      .map((p) => ({
        segment_id: p.segment.id,
        price_incl_tax: p.incl!,
        vat_rate: p.vat!,
        price_excl_tax: excludeVat(p.incl!, p.vat!),
      }));
    if (prices.length === 0) {
      setError("En az bir segment için fiyat girin.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await adminUpdatePricing(variant.id, prices);
      const updated = new Map(variant.prices.map((p) => [`${p.segment_id}:${p.currency}`, p]));
      for (const p of res.prices) updated.set(`${p.segment_id}:${res.currency}`, { ...p, currency: res.currency });
      onSaved([...updated.values()]);
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Fiyatlar kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {parsed.map(({ segment, row, incl, vat, invalid }) => (
          <fieldset
            key={segment.id}
            className={`rounded-xl border p-3 ${invalid ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-white/10"}`}
          >
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              {segment.label}
            </legend>
            <label className="block text-xs text-slate-600 dark:text-zinc-400" htmlFor={`incl-${variant.id}-${segment.id}`}>
              KDV dahil fiyat (₺)
            </label>
            <input
              id={`incl-${variant.id}-${segment.id}`}
              inputMode="decimal"
              value={row.incl}
              placeholder="—"
              onChange={(e) => {
                setSaved(false);
                setRows((r) => ({ ...r, [segment.id]: { ...r[segment.id], incl: e.target.value } }));
              }}
              className={`mt-1 ${fieldClass}`}
            />
            <div className="mt-2 flex items-end gap-2">
              <div className="w-20">
                <label className="block text-xs text-slate-600 dark:text-zinc-400" htmlFor={`vat-${variant.id}-${segment.id}`}>
                  KDV %
                </label>
                <input
                  id={`vat-${variant.id}-${segment.id}`}
                  inputMode="decimal"
                  value={row.vat}
                  onChange={(e) => {
                    setSaved(false);
                    setRows((r) => ({ ...r, [segment.id]: { ...r[segment.id], vat: e.target.value } }));
                  }}
                  className={`mt-1 ${fieldClass}`}
                />
              </div>
              <p className="pb-2 text-xs text-slate-500 dark:text-zinc-500">
                {invalid
                  ? "Geçersiz değer"
                  : incl && vat
                    ? `KDV hariç ${formatMoney(excludeVat(incl, vat))}`
                    : "Bu segmentte satılmaz"}
              </p>
            </div>
          </fieldset>
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Fiyatlar kaydedildi.</Alert>}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Fiyat girilmeyen segment bu ürünü satın alamaz. Sepet ve sipariş yeni fiyatı hemen kullanır; katalog sayfaları en geç 5 dakikada güncellenir.
        </p>
        <Button type="submit" loading={saving} disabled={hasInvalid} className="sm:w-auto!">
          <Save className="h-4 w-4" aria-hidden /> Fiyatları kaydet
        </Button>
      </div>
    </form>
  );
}
