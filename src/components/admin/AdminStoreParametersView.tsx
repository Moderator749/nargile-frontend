"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { CreditCard, Crown, Info, Plus, Save, TrendingUp, Trash2, Truck, type LucideIcon } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminGetStoreParameters, adminUpdateStoreParameters } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { parseDecimalInput } from "@/lib/format";
import { refreshStorefront } from "@/lib/revalidate";
import { transferDiscountHint } from "@/lib/storeParameters";
import type { CoalRuleBasis, LoyaltyParameters, ParameterTier, StoreParameters } from "@/types";
import { stepOnArrowKey } from "@/lib/numberStep";

const fieldClass =
  "block h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:outline-none focus:ring-4 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";
const okField = "border-slate-300 focus:border-red-500 focus:ring-red-500/15 dark:border-white/15";
const badField = "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-400";

// Mirrors the server's bounds (`app/services/store_parameters.py`).
const AMOUNT_MAX = 10_000_000;
const KG_MAX = 10_000;
const QUANTITY_MAX = 100_000;
const MAX_TIERS = 10;
const ISTANBUL_FREE_MIN_MAX = 1_000_000;
const CONVERSION_MIN = 0.01;
const CONVERSION_MAX = 100;
const BONUS_POINTS_MAX = 1_000_000;
const PERIOD_DAYS_MAX = 3650;

// ── Draft: what the admin is typing ──────────────────────────────────────────

interface TierDraft {
  key: number;
  threshold: string;
  /** Percent, as typed: "5" or "5,25". */
  rate: string;
}

interface Draft {
  free: string;
  /** "İstanbul içi B2B ücretsiz teslimat" limit, as typed. */
  istanbul: string;
  coalKg: string;
  /** "%50 Kuralı" minimum in units (adet), as typed. */
  coalQty: string;
  /** Which of the two minimums the rule applies. */
  coalBasis: CoalRuleBasis;
  /** Percent, as typed. */
  coalRatio: string;
  transfer: TierDraft[];
  volume: TierDraft[];
  loyalty: LoyaltyDraft;
}

/** The Sultan Puan card, as typed (percent for the rate). */
interface LoyaltyDraft {
  enabled: boolean;
  baseRate: string;
  bandMin: string;
  bandMax: string;
  conversion: string;
  annualTarget: string;
  annualBonus: string;
  annualDays: string;
  annualCeiling: string;
}

type Ladder = "transfer" | "volume";

let nextKey = 0;

/** "3000.00" → "3000", "1250.50" → "1250,5": a number as a Turkish admin types it. */
const typed = (value: number) => String(Number(value.toFixed(4))).replace(".", ",");
const percentOf = (fraction: string) => typed(Number(fraction) * 100);

function toDraft(p: StoreParameters): Draft {
  const ladder = (tiers: ParameterTier[]) =>
    tiers.map((t) => ({ key: nextKey++, threshold: typed(Number(t.threshold)), rate: percentOf(t.rate) }));
  return {
    free: typed(Number(p.free_shipping_threshold)),
    istanbul: typed(Number(p.istanbul_free_min_subtotal)),
    coalKg: typed(Number(p.coal_min_kg)),
    coalQty: String(p.coal_min_quantity),
    coalBasis: p.coal_rule_basis,
    coalRatio: percentOf(p.coal_max_ratio),
    transfer: ladder(p.bank_transfer_tiers),
    volume: ladder(p.volume_tiers),
    loyalty: {
      enabled: p.loyalty.enabled,
      baseRate: percentOf(p.loyalty.base_rate),
      bandMin: typed(Number(p.loyalty.band_min)),
      bandMax: typed(Number(p.loyalty.band_max)),
      conversion: typed(Number(p.loyalty.conversion_rate)),
      annualTarget: typed(Number(p.loyalty.annual_spend_threshold)),
      annualBonus: String(p.loyalty.annual_bonus_points),
      annualDays: String(p.loyalty.annual_period_days),
      annualCeiling: typed(Number(p.loyalty.annual_order_ceiling)),
    },
  };
}

type Errors = Record<string, string>;

/**
 * The draft as the API takes it, or the reason each field cannot be saved.
 * Error keys: "free", "istanbul", "coalKg", "coalQty", "coalRatio", "<ladder>" (the list as a whole),
 * "<ladder>.<key>.threshold" / ".rate" for one rung, and "loyalty.<field>".
 */
function fromDraft(d: Draft): { body: StoreParameters | null; errors: Errors } {
  const errors: Errors = {};

  function amount(key: string, raw: string, { positive = false, min = 0, max = AMOUNT_MAX } = {}): string {
    const v = parseDecimalInput(raw);
    if (v === null) errors[key] = "Sayı girin (örn. 3000 veya 2500,50).";
    else if (positive && Number(v) <= 0) errors[key] = "Sıfırdan büyük olmalı.";
    else if (Number(v) < min) errors[key] = `En az ${min.toLocaleString("tr-TR")} olabilir.`;
    else if (Number(v) > max) errors[key] = `En fazla ${max.toLocaleString("tr-TR")} olabilir.`;
    return v ?? "0";
  }
  function whole(key: string, raw: string, { min = 0, max }: { min?: number; max: number }): number {
    const v = raw.trim().replace(/\./g, "");
    if (!/^\d+$/.test(v) || Number(v) < min || Number(v) > max) {
      errors[key] = `${min.toLocaleString("tr-TR")} ile ${max.toLocaleString("tr-TR")} arasında bir tam sayı girin.`;
      return min;
    }
    return Number(v);
  }
  function percent(key: string, raw: string): string {
    const v = parseDecimalInput(raw);
    if (v === null || Number(v) > 100) {
      errors[key] = "0 ile 100 arasında bir yüzde girin.";
      return "0";
    }
    return (Number(v) / 100).toFixed(4);
  }
  function ladder(name: Ladder, tiers: TierDraft[]): ParameterTier[] {
    const out = tiers.map((t) => ({
      threshold: amount(`${name}.${t.key}.threshold`, t.threshold, { positive: true }),
      rate: percent(`${name}.${t.key}.rate`, t.rate),
    }));
    if (tiers.length > MAX_TIERS) errors[name] = `En fazla ${MAX_TIERS} barem tanımlanabilir.`;
    else if (new Set(out.map((t) => Number(t.threshold))).size !== out.length)
      errors[name] = "Aynı tutar sınırı iki kez girilmiş.";
    return out.sort((a, b) => Number(a.threshold) - Number(b.threshold));
  }

  const l = d.loyalty;
  const loyalty: LoyaltyParameters = {
    enabled: l.enabled,
    base_rate: percent("loyalty.baseRate", l.baseRate),
    band_min: amount("loyalty.bandMin", l.bandMin),
    band_max: amount("loyalty.bandMax", l.bandMax),
    conversion_rate: amount("loyalty.conversion", l.conversion, { min: CONVERSION_MIN, max: CONVERSION_MAX }),
    annual_spend_threshold: amount("loyalty.annualTarget", l.annualTarget, { positive: true }),
    annual_bonus_points: whole("loyalty.annualBonus", l.annualBonus, { max: BONUS_POINTS_MAX }),
    annual_period_days: whole("loyalty.annualDays", l.annualDays, { min: 1, max: PERIOD_DAYS_MAX }),
    annual_order_ceiling: amount("loyalty.annualCeiling", l.annualCeiling),
  };
  if (!errors["loyalty.bandMin"] && !errors["loyalty.bandMax"] && Number(loyalty.band_min) > Number(loyalty.band_max))
    errors["loyalty.bandMax"] = "Üst sınır alt sınırdan küçük olamaz.";

  const body: StoreParameters = {
    free_shipping_threshold: amount("free", d.free),
    coal_min_kg: amount("coalKg", d.coalKg, { max: KG_MAX }),
    coal_max_ratio: percent("coalRatio", d.coalRatio),
    coal_rule_basis: d.coalBasis,
    coal_min_quantity: whole("coalQty", d.coalQty, { max: QUANTITY_MAX }),
    bank_transfer_tiers: ladder("transfer", d.transfer),
    volume_tiers: ladder("volume", d.volume),
    loyalty,
    istanbul_free_min_subtotal: amount("istanbul", d.istanbul, { max: ISTANBUL_FREE_MIN_MAX }),
  };
  return { body: Object.keys(errors).length ? null : body, errors };
}

/** Same rules, compared by value: "3000" and "3000.00" are no change. */
function sameRules(a: StoreParameters, b: StoreParameters): boolean {
  const n = (p: StoreParameters) =>
    JSON.stringify([
      Number(p.free_shipping_threshold),
      Number(p.istanbul_free_min_subtotal),
      Number(p.coal_min_kg),
      Number(p.coal_max_ratio),
      p.coal_rule_basis,
      p.coal_min_quantity,
      ...[p.bank_transfer_tiers, p.volume_tiers].map((l) => l.map((t) => [Number(t.threshold), Number(t.rate)])),
      p.loyalty.enabled,
      ...[
        p.loyalty.base_rate,
        p.loyalty.band_min,
        p.loyalty.band_max,
        p.loyalty.conversion_rate,
        p.loyalty.annual_spend_threshold,
        p.loyalty.annual_bonus_points,
        p.loyalty.annual_period_days,
        p.loyalty.annual_order_ceiling,
      ].map(Number),
    ]);
  return n(a) === n(b);
}

// ── Pieces ───────────────────────────────────────────────────────────────────

/**
 * A small (i) beside a title or label: the explanation an admin may want, kept
 * out of the page until hovered or focused (keyboard and screen readers get it
 * through the button's description).
 */
function InfoTip({ label, text }: { label: string; text: string }) {
  const id = useId();
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`${label}: açıklama`}
        aria-describedby={id}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-30 mt-1.5 w-72 max-w-[80vw] rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-5 text-white opacity-0 shadow-lg transition-opacity duration-150 group-focus-within/tip:visible group-focus-within/tip:opacity-100 group-hover/tip:visible group-hover/tip:opacity-100 dark:bg-zinc-800"
      >
        {text}
      </span>
    </span>
  );
}

function Card({ Icon, title, description, info, children }: {
  Icon: LucideIcon;
  title: string;
  /** A line under the title; leave it out for a card that explains itself, with `info` if anything is worth saying. */
  description?: string;
  info?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <h2 className="flex items-center gap-1.5 text-base font-semibold tracking-tight">
        <Icon className="mr-0.5 h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden />
        {title}
        {info && <InfoTip label={title} text={info} />}
      </h2>
      {description && <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-zinc-400">{description}</p>}
      <div className={description ? "mt-5" : "mt-4"}>{children}</div>
    </section>
  );
}

/** A labelled input with its unit inside the field and its error below. */
function Field({ label, unit, value, onChange, error, note, srLabel, info, disabled = false }: {
  label?: string;
  /** A tooltip beside the label, for what the label alone does not say. */
  info?: string;
  /** For a field whose visible label is a column header. */
  srLabel?: string;
  unit: "TL" | "%" | "kg" | "adet" | "puan" | "gün";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  note?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center gap-1">
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
            {label}
          </label>
          {info && <InfoTip label={label} text={info} />}
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          maxLength={14}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => stepOnArrowKey(e, (v) => onChange(v))}
          disabled={disabled}
          aria-label={srLabel}
          aria-invalid={!!error}
          aria-describedby={error || note ? `${id}-note` : undefined}
          className={`${fieldClass} pr-14 tabular-nums disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-white/5 dark:disabled:text-zinc-500 ${error ? badField : okField}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400 dark:text-zinc-500">
          {unit}
        </span>
      </div>
      {(error || note) && (
        <p
          id={`${id}-note`}
          className={`text-xs ${error ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"}`}
        >
          {error ?? note}
        </p>
      )}
    </div>
  );
}

/** "%50 Kuralı" measure: the minimum counts kilograms or units — one or the other. */
function BasisPicker({ value, onChange }: { value: CoalRuleBasis; onChange: (value: CoalRuleBasis) => void }) {
  const id = useId();
  const options: { value: CoalRuleBasis; label: string }[] = [
    { value: "kg", label: "Ağırlık (kg)" },
    { value: "quantity", label: "Adet" },
  ];
  return (
    <div className="space-y-1.5">
      <p id={id} className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
        %50 Kuralı ölçüsü
      </p>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-slate-300 bg-slate-50 p-1 dark:border-white/15 dark:bg-zinc-950"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
              value === o.value
                ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-zinc-100"
                : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** An on/off switch with its label and a line saying what each state means. */
function Toggle({ label, checked, onChange, info }: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** What on and off mean, in a tooltip beside the label. */
  info?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-zinc-100">
          {label}
        </label>
        {info && <InfoTip label={label} text={info} />}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
          checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"
        }`}
      >
        <span
          aria-hidden
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/** The add/remove list of rungs: "from ₺X of cart, %Y off". */
function LadderEditor({ name, tiers, errors, onChange, emptyText, addLabel }: {
  name: Ladder;
  tiers: TierDraft[];
  errors: Errors;
  onChange: (tiers: TierDraft[]) => void;
  emptyText: string;
  addLabel: string;
}) {
  const patch = (key: number, change: Partial<TierDraft>) =>
    onChange(tiers.map((t) => (t.key === key ? { ...t, ...change } : t)));

  // Each rung runs up to the next one's threshold (the cart takes the highest
  // rung it reaches), so its upper limit is shown, not typed.
  const thresholds = tiers.map((t) => Number(parseDecimalInput(t.threshold) ?? NaN));
  const upperOf = (i: number): string => {
    const own = thresholds[i];
    if (Number.isNaN(own)) return "—";
    const above = thresholds.filter((v) => !Number.isNaN(v) && v > own);
    return above.length ? typed(Math.min(...above) - 0.01) : "Sınırsız";
  };
  const row = "grid grid-cols-[1.25rem_1fr_1fr_2.5rem] items-start gap-2 sm:grid-cols-[1.25rem_1fr_1fr_9rem_2.5rem] sm:gap-3";

  return (
    <div>
      {tiers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
          {emptyText}
        </p>
      ) : (
        <ol className="space-y-2">
          <li aria-hidden className={`${row} hidden text-xs font-medium text-slate-500 sm:grid dark:text-zinc-400`}>
            <span />
            <span>Alt Limit (₺)</span>
            <span>Üst Limit (₺)</span>
            <span>İndirim (%)</span>
            <span />
          </li>
          {tiers.map((tier, i) => (
            <li key={tier.key} className={row}>
              <span className="flex h-11 items-center text-xs font-semibold tabular-nums text-slate-400 dark:text-zinc-500">
                {i + 1}.
              </span>
              <Field
                srLabel={`${i + 1}. barem alt limiti`}
                unit="TL"
                value={tier.threshold}
                onChange={(threshold) => patch(tier.key, { threshold })}
                error={errors[`${name}.${tier.key}.threshold`]}
              />
              <div
                aria-label={`${i + 1}. barem üst limiti`}
                className="flex h-11 items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 text-sm tabular-nums text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
              >
                <span>{upperOf(i)}</span>
                {upperOf(i) !== "Sınırsız" && upperOf(i) !== "—" && <span className="text-xs">TL</span>}
              </div>
              <div className="col-span-2 col-start-2 sm:col-span-1 sm:col-start-4 sm:row-start-1">
                <Field
                  srLabel={`${i + 1}. barem indirim yüzdesi`}
                  unit="%"
                  value={tier.rate}
                  onChange={(rate) => patch(tier.key, { rate })}
                  error={errors[`${name}.${tier.key}.rate`]}
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(tiers.filter((t) => t.key !== tier.key))}
                aria-label={`${i + 1}. baremi sil`}
                title="Baremi sil"
                className="col-start-4 row-start-1 flex h-11 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600 sm:col-start-5 dark:text-zinc-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}

      {errors[name] && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {errors[name]}
        </p>
      )}

      <button
        type="button"
        disabled={tiers.length >= MAX_TIERS}
        onClick={() => {
          const top = Math.max(0, ...tiers.map((t) => Number(parseDecimalInput(t.threshold) ?? 0)));
          onChange([...tiers, { key: nextKey++, threshold: top ? typed(top + 10000) : "", rate: "" }]);
        }}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-200 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
      >
        <Plus className="h-4 w-4" aria-hidden /> {addLabel}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * Parametreler: the checkout's commercial rules — free shipping, the coal rule,
 * the havale/EFT ladder and the automatic ciro ladder.
 *
 * Saved as a whole, and read live by both ends: the cart engine prices the very
 * next cart with what is saved here, and the storefront quotes the same figures
 * (the free-shipping note, the havale hint, the product page's perks).
 */
export function AdminStoreParametersView() {
  // Null while it loads: the panel never shows rules that are not the live ones.
  const [saved, setSaved] = useState<StoreParameters | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminGetStoreParameters(controller.signal)
      .then((p) => {
        setSaved(p);
        setDraft(toDraft(p));
      })
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Parametreler yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const { body, errors } = draft ? fromDraft(draft) : { body: null, errors: {} as Errors };
  const unchanged = !!body && !!saved && sameRules(body, saved);

  function update(change: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...change } : d));
    setResult(null);
  }
  function updateLoyalty(change: Partial<LoyaltyDraft>) {
    setDraft((d) => (d ? { ...d, loyalty: { ...d.loyalty, ...change } } : d));
    setResult(null);
  }

  async function save() {
    if (!body || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const next = await adminUpdateStoreParameters(body);
      setSaved(next);
      setDraft(toDraft(next));
      // The homepage's Sultan Puan row lists the products in the band: a new
      // band (or the programme switched off) must show there now, not in minutes.
      void refreshStorefront();
      setResult({ kind: "success", text: "Kaydedildi. Yeni parametreler bir sonraki sepet hesaplamasından itibaren geçerli." });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  const saveBar = (
    <Button
      type="button"
      onClick={save}
      loading={saving}
      disabled={!body || unchanged}
      className="sm:w-auto"
    >
      <Save className="h-4 w-4" aria-hidden /> Kaydet
    </Button>
  );

  return (
    <>
      <AdminPageHeader
        title="Parametreler"
        description="Ücretsiz kargo, kömür kuralı, İstanbul içi B2B teslimat, havale/EFT ve ciro indirimleri, Sultan Puan. Kaydettiğiniz değerler sepette ve siparişte anında uygulanır; indirimler, ücretsiz kargo ve Sultan Puan yalnızca bireysel (perakende) hesaplar içindir."
        actions={draft ? saveBar : undefined}
      />

      {loadError && <Alert variant="error">{loadError}</Alert>}

      {!draft ? (
        !loadError && (
          <div className="space-y-6" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`${panelClass} h-56 motion-safe:animate-pulse`} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <Card
            Icon={Truck}
            title="Kargo Kuralları"
            info="Ücretsiz kargo baremi altındaki siparişler karşı ödemeli gönderilir. %50 Kuralı: ürün formunda Sepet Kuralı açık ürünler ara toplamın bu oranından fazlasını tutuyorsa, sepet seçilen ölçüdeki minimuma ulaşmadan ücretsiz kargo almaz. Ağırlığı tanımsız ürün 0 kg sayılır."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Ücretsiz kargo baremi"
                unit="TL"
                value={draft.free}
                onChange={(free) => update({ free })}
                error={errors.free}
              />
              <Field
                label="%50 Kuralı sepet oranı"
                unit="%"
                value={draft.coalRatio}
                onChange={(coalRatio) => update({ coalRatio })}
                error={errors.coalRatio}
              />
              <BasisPicker value={draft.coalBasis} onChange={(coalBasis) => update({ coalBasis })} />
              {/* Only the minimum the chosen measure uses; the other keeps its value, unseen. */}
              {draft.coalBasis === "kg" ? (
                <Field
                  label="Minimum ağırlık"
                  unit="kg"
                  value={draft.coalKg}
                  onChange={(coalKg) => update({ coalKg })}
                  error={errors.coalKg}
                />
              ) : (
                <Field
                  label="Minimum adet"
                  unit="adet"
                  value={draft.coalQty}
                  onChange={(coalQty) => update({ coalQty })}
                  error={errors.coalQty}
                />
              )}
            </div>

            {/* Moved here from the old "Teslimat Ayarları" page: one hub for
                every threshold the checkout applies. */}
            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
              <h3 className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                İstanbul içi B2B teslimat
                <InfoTip
                  label="İstanbul içi B2B teslimat"
                  text="Kafe, toptan ve diğer kurumsal hesaplar için: fatura adresi İstanbul’da olan firmanın sepeti bu tutara ulaşınca teslimat kendi aracımızla ücretsiz yapılır. Altında kalırsa seçenek sepette kapalı görünür ve ne kadar eksik olduğu yazar."
                />
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Ücretsiz teslimat alt limiti"
                  unit="TL"
                  value={draft.istanbul}
                  onChange={(istanbul) => update({ istanbul })}
                  error={errors.istanbul}
                />
              </div>
            </div>
          </Card>

          <Card
            Icon={CreditCard}
            title="Ödeme Yöntemi Kampanyaları"
            info={`Havale / EFT ile ödemede uygulanan nakit indirimi. Barem ara toplama göre belirlenir; indirim, varsa ciro indiriminden sonra kalan tutara uygulanır. Sepetin her tutarda indirim alması için ilk baremi 1 TL yapın.${
              body ? ` Sepette görünen: ${transferDiscountHint(body) ?? "Banka hesabımıza ödeme (indirim yok)"}.` : ""
            }`}
          >
            <LadderEditor
              name="transfer"
              tiers={draft.transfer}
              errors={errors}
              onChange={(transfer) => update({ transfer })}
              emptyText="Barem yok: havale ile ödemede indirim uygulanmaz."
              addLabel="Havale baremi ekle"
            />
          </Card>

          <Card
            Icon={TrendingUp}
            title="Otomatik Ciro İndirimleri"
            info="Ara toplam bir baremi geçtiğinde o baremin indirimi otomatik uygulanır; birden fazla baremi geçen sepete en yüksek baremin oranı uygulanır. Sepet bir sonraki bareme yaklaştığında müşteriye ne kadar eklemesi gerektiği gösterilir."
          >
            <LadderEditor
              name="volume"
              tiers={draft.volume}
              errors={errors}
              onChange={(volume) => update({ volume })}
              emptyText="Barem yok: hiçbir sepete ciro indirimi uygulanmaz."
              addLabel="Ciro baremi ekle"
            />
          </Card>

          <Card
            Icon={Crown}
            title="Sultan Puan & Sadakat Sistemi"
            info="Puanlar sipariş ödendi olarak onaylandığında tanımlanır, 1 yıl geçerlidir ve sepette kargo hariç tutara uygulanır. Kayıtlı bakiyeler sistem kapatıldığında silinmez; yeniden açıldığında kullanılabilir."
          >
            <Toggle
              label="Sadakat sistemi aktif"
              checked={draft.loyalty.enabled}
              onChange={(enabled) => updateLoyalty({ enabled })}
              info="Açık: siparişler puan kazandırır, müşteriler sepette puan kullanabilir. Kapalı: puan kazanılmaz ve kullanılamaz; sepette ve hesap sayfasında puan alanları gizlenir."
            />

            <fieldset disabled={!draft.loyalty.enabled} className="mt-4 space-y-4 disabled:opacity-60">
              <div>
                <h3 className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Standart puan kazanımı
                  <InfoTip
                    label="Standart puan kazanımı"
                    text="Alt ve üst sınır arasındaki tek bir siparişin ara toplamı üzerinden, kazanım oranı kadar Sultan Puan verilir; aralık dışındaki siparişler standart puan kazanmaz. Puanın parasal değeri: 1 Sultan Puan sepette bu kadar indirim sağlar."
                  />
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="Kazanım oranı"
                    unit="%"
                    value={draft.loyalty.baseRate}
                    onChange={(baseRate) => updateLoyalty({ baseRate })}
                    error={errors["loyalty.baseRate"]}
                  />
                  <Field
                    label="Sipariş alt sınırı"
                    unit="TL"
                    value={draft.loyalty.bandMin}
                    onChange={(bandMin) => updateLoyalty({ bandMin })}
                    error={errors["loyalty.bandMin"]}
                  />
                  <Field
                    label="Sipariş üst sınırı"
                    unit="TL"
                    value={draft.loyalty.bandMax}
                    onChange={(bandMax) => updateLoyalty({ bandMax })}
                    error={errors["loyalty.bandMax"]}
                  />
                  <Field
                    label="Puanın parasal değeri"
                    unit="TL"
                    value={draft.loyalty.conversion}
                    onChange={(conversion) => updateLoyalty({ conversion })}
                    error={errors["loyalty.conversion"]}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 dark:border-white/10">
                <h3 className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Yıllık sadakat eşiği
                  <InfoTip
                    label="Yıllık sadakat eşiği"
                    text="Ödenmiş siparişler hesaplama süresi içinde harcama hedefine ulaştığında bonus puan tanımlanır. Bonus bir kez verilir; sonraki bonus için sayım bonusun verildiği andan yeniden başlar."
                  />
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="Yıllık harcama hedefi"
                    unit="TL"
                    value={draft.loyalty.annualTarget}
                    onChange={(annualTarget) => updateLoyalty({ annualTarget })}
                    error={errors["loyalty.annualTarget"]}
                  />
                  <Field
                    label="Bonus puan"
                    unit="puan"
                    value={draft.loyalty.annualBonus}
                    onChange={(annualBonus) => updateLoyalty({ annualBonus })}
                    error={errors["loyalty.annualBonus"]}
                    info="0 girilirse bonus verilmez."
                  />
                  <Field
                    label="Hesaplama süresi"
                    unit="gün"
                    value={draft.loyalty.annualDays}
                    onChange={(annualDays) => updateLoyalty({ annualDays })}
                    error={errors["loyalty.annualDays"]}
                  />
                  <Field
                    label="Sayılan sipariş üst sınırı"
                    unit="TL"
                    value={draft.loyalty.annualCeiling}
                    onChange={(annualCeiling) => updateLoyalty({ annualCeiling })}
                    error={errors["loyalty.annualCeiling"]}
                    info="Bu tutarın altındaki siparişler hedefe sayılır. 0 girilirse tüm siparişler sayılır."
                  />
                </div>
              </div>
            </fieldset>
          </Card>

          {result && <Alert variant={result.kind === "success" ? "success" : "error"}>{result.text}</Alert>}

          <div className="flex justify-end">{saveBar}</div>
        </div>
      )}
    </>
  );
}
