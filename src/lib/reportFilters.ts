import type { SegmentType } from "@/types";

/**
 * Raporlar's filters and their address (`?aralik=hafta&grup=DEALER`), so a
 * reload, the back button and a shared link open the reports as they were
 * left. Dates are Turkey's calendar days ("2026-11-03"), the same days the API
 * counts in, whatever zone the browser is in. Only what differs from the
 * default (this month, everything) is written; anything unreadable in an
 * address reads as no filter.
 */

export type QuickRange = "today" | "week" | "month" | "custom";
export type SaleMethod = "CREDIT_CARD" | "BANK_TRANSFER";

export interface ReportFilters {
  range: QuickRange;
  /** Both inclusive, YYYY-MM-DD. */
  from: string;
  to: string;
  segment: SegmentType | "";
  paymentMethod: SaleMethod | "";
  categoryId: number | null;
  brandId: number | null;
}

export const RANGE_LABELS: Record<QuickRange, string> = {
  today: "Bugün",
  week: "Bu Hafta",
  month: "Bu Ay",
  custom: "Özel",
};

/** The address's own names. */
export const REPORT_PARAMS = {
  range: "aralik",
  from: "baslangic",
  to: "bitis",
  segment: "grup",
  paymentMethod: "odeme",
  categoryId: "kategori",
  brandId: "marka",
} as const;

const RANGE_SLUGS: Record<QuickRange, string> = { today: "bugun", week: "hafta", month: "ay", custom: "ozel" };
const SEGMENTS: readonly SegmentType[] = ["RETAIL", "CAFE", "WHOLESALE", "DEALER"];
const METHODS: readonly SaleMethod[] = ["CREDIT_CARD", "BANK_TRANSFER"];
/** The API refuses longer: two years, give or take a leap day. */
export const MAX_DAYS = 731;

const TURKEY_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in Turkey: "2026-11-03". */
export function turkeyToday(now: Date = new Date()): string {
  return TURKEY_DAY.format(now);
}

/** A real calendar day written YYYY-MM-DD, or false. */
export function isDay(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** `day` moved by `days` (negative goes back). */
export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days from `from` to `to`, both counted: the same day is 1. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

/** The dates a quick range covers, up to today: the week starts on Monday. */
export function rangeDates(range: Exclude<QuickRange, "custom">, today: string): { from: string; to: string } {
  if (range === "today") return { from: today, to: today };
  if (range === "month") return { from: `${today.slice(0, 8)}01`, to: today };
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  return { from: addDays(today, -weekday), to: today };
}

/** Why a custom period cannot be asked for, or null when it can. */
export function periodProblem(from: string, to: string): string | null {
  if (!isDay(from) || !isDay(to)) return "Başlangıç ve bitiş tarihini seçin.";
  if (from > to) return "Başlangıç tarihi bitiş tarihinden sonra olamaz.";
  if (daysBetween(from, to) > MAX_DAYS) return "En fazla iki yıllık bir dönem seçilebilir.";
  return null;
}

function positiveInt(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return n > 0 && Number.isSafeInteger(n) ? n : null;
}

export function defaultFilters(today: string): ReportFilters {
  return { range: "month", ...rangeDates("month", today), segment: "", paymentMethod: "", categoryId: null, brandId: null };
}

export function filtersFromParams(params: URLSearchParams, today: string): ReportFilters {
  const p = REPORT_PARAMS;
  const slug = params.get(p.range);
  const range = (Object.keys(RANGE_SLUGS) as QuickRange[]).find((r) => RANGE_SLUGS[r] === slug) ?? "month";
  const from = params.get(p.from);
  const to = params.get(p.to);
  // A custom period that does not hold up falls back to this month.
  const dates =
    range === "custom"
      ? isDay(from) && isDay(to) && !periodProblem(from, to)
        ? { from, to }
        : null
      : rangeDates(range, today);
  const segment = params.get(p.segment);
  const method = params.get(p.paymentMethod);
  return {
    ...(dates ? { range, ...dates } : { range: "month" as const, ...rangeDates("month", today) }),
    segment: SEGMENTS.find((s) => s === segment) ?? "",
    paymentMethod: METHODS.find((m) => m === method) ?? "",
    categoryId: positiveInt(params.get(p.categoryId)),
    brandId: positiveInt(params.get(p.brandId)),
  };
}

/** Only what differs from the default, so this month's address stays bare. */
export function filtersToParams(f: ReportFilters): URLSearchParams {
  const p = REPORT_PARAMS;
  const out = new URLSearchParams();
  if (f.range !== "month") out.set(p.range, RANGE_SLUGS[f.range]);
  if (f.range === "custom") {
    out.set(p.from, f.from);
    out.set(p.to, f.to);
  }
  if (f.segment) out.set(p.segment, f.segment);
  if (f.paymentMethod) out.set(p.paymentMethod, f.paymentMethod);
  if (f.categoryId) out.set(p.categoryId, String(f.categoryId));
  if (f.brandId) out.set(p.brandId, String(f.brandId));
  return out;
}

/** The query every report endpoint takes. */
export function apiParams(f: ReportFilters): Record<string, string | number> {
  return {
    from: f.from,
    to: f.to,
    ...(f.segment && { segment: f.segment }),
    ...(f.paymentMethod && { payment_method: f.paymentMethod }),
    ...(f.categoryId && { category_id: f.categoryId }),
    ...(f.brandId && { brand_id: f.brandId }),
  };
}

/** Whether anything narrows the reports beyond the period. */
export function hasNarrowing(f: ReportFilters): boolean {
  return Boolean(f.segment || f.paymentMethod || f.categoryId || f.brandId);
}

/** "01.11.2026 – 03.11.2026", or one date for a single day. */
export function periodText(from: string, to: string): string {
  const tr = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
  return from === to ? tr(from) : `${tr(from)} – ${tr(to)}`;
}
