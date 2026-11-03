import { api } from "@/lib/api";
import type { DecimalString, PaymentMethod, SegmentType } from "@/types";

/**
 * Raporlar (backend app/api/v1/admin_reports.py). Money is TRY as Decimal
 * strings; percents are one-decimal Decimal strings ("44.8"). Revenue is what
 * the goods sold for: after discounts, VAT included, shipping left out.
 * Profit and margin are before VAT, on the lines whose cost is known.
 */

export interface ReportKpis {
  revenue: DecimalString;
  orders: number;
  average_order_value: DecimalString;
  revenue_excl_vat: DecimalString;
  gross_profit: DecimalString | null;
  margin_percent: DecimalString | null;
  costed_share_percent: DecimalString | null;
  estimated_cost_lines: number;
  recovered_revenue: DecimalString;
  recovered_orders: number;
}

export interface ReportSummary {
  period: { date_from: string; date_to: string };
  previous_period: { date_from: string; date_to: string };
  current: ReportKpis;
  previous: ReportKpis;
  /** Percent against the period before; the margin in points. Null: nothing to compare with. */
  changes: {
    revenue: DecimalString | null;
    orders: DecimalString | null;
    average_order_value: DecimalString | null;
    gross_profit: DecimalString | null;
    recovered_revenue: DecimalString | null;
    margin_points: DecimalString | null;
  };
}

export type Granularity = "hour" | "day" | "week";

export interface TrendPoint {
  /** Where the bucket begins, Turkey time (ISO with offset). */
  start: string;
  revenue: DecimalString;
  orders: number;
  average_order_value: DecimalString;
}

export interface ReportTrend {
  granularity: Granularity;
  points: TrendPoint[];
}

export interface SegmentRow {
  segment: SegmentType;
  label: string;
  revenue: DecimalString;
  orders: number;
  share_percent: DecimalString;
  gross_profit: DecimalString | null;
  margin_percent: DecimalString | null;
}

export type TopBy = "product" | "category" | "brand";
export type TopSort = "quantity" | "revenue";

export interface TopRow {
  key: string;
  name: string;
  code: string | null;
  quantity: number;
  revenue: DecimalString;
  orders: number;
}

export interface PaymentMethodRow {
  payment_method: Exclude<PaymentMethod, "QUOTE">;
  placed: number;
  paid: number;
  pending: number;
  cancelled: number;
  failed: number;
  returned: number;
  revenue: DecimalString;
  conversion_percent: DecimalString | null;
  cancellation_percent: DecimalString | null;
}

export interface SlowMoverRow {
  product_id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  is_published: boolean;
  stock: number;
  stock_value: DecimalString | null;
  last_sold_at: string | null;
}

export type ProfitBy = "product" | "category";
export type ProfitSort = "profit" | "margin" | "revenue";

export interface ProfitRow {
  key: string;
  name: string;
  code: string | null;
  quantity: number;
  revenue_excl_vat: DecimalString;
  cost: DecimalString | null;
  gross_profit: DecimalString | null;
  margin_percent: DecimalString | null;
  uncosted_quantity: number;
  estimated: boolean;
  below_threshold: boolean;
}

export interface TierMargin {
  segment: SegmentType;
  price_excl_vat: DecimalString | null;
  margin_percent: DecimalString | null;
  /** The ladder's highest havale rate, where this group's price takes it. */
  havale_rate_percent: DecimalString | null;
  havale_price_excl_vat: DecimalString | null;
  havale_margin_percent: DecimalString | null;
  below_threshold: boolean;
}

export interface TierMarginRow {
  product_id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  cost: DecimalString;
  tiers: TierMargin[];
  lowest_margin_percent: DecimalString | null;
  alert: boolean;
}

export interface MissingCostRow {
  product_id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  is_published: boolean;
  stock: number;
  sold_quantity_90d: number;
  revenue_90d: DecimalString;
}

export type ReportName =
  | "trend"
  | "segments"
  | "top"
  | "slow-movers"
  | "payment-methods"
  | "profitability"
  | "tier-margins"
  | "missing-costs";

type Params = Record<string, string | number | boolean>;

/** Reports can take a while on a long period; the default 15 s is the storefront's. */
const REPORT_TIMEOUT = 60_000;

async function get<T>(path: string, params: Params, signal?: AbortSignal): Promise<T> {
  const { data } = await api.get<T>(`/admin/reports/${path}`, { params, signal, timeout: REPORT_TIMEOUT });
  return data;
}

export const reportSummary = (params: Params, signal?: AbortSignal) => get<ReportSummary>("summary", params, signal);
export const reportTrend = (params: Params, signal?: AbortSignal) => get<ReportTrend>("trend", params, signal);
export const reportSegments = (params: Params, signal?: AbortSignal) => get<SegmentRow[]>("segments", params, signal);
export const reportTop = (params: Params, signal?: AbortSignal) => get<TopRow[]>("top", params, signal);
export const reportPaymentMethods = (params: Params, signal?: AbortSignal) =>
  get<PaymentMethodRow[]>("payment-methods", params, signal);
export const reportSlowMovers = (params: Params, signal?: AbortSignal) => get<SlowMoverRow[]>("slow-movers", params, signal);
export const reportProfitability = (params: Params, signal?: AbortSignal) => get<ProfitRow[]>("profitability", params, signal);
export const reportTierMargins = (params: Params, signal?: AbortSignal) => get<TierMarginRow[]>("tier-margins", params, signal);
export const reportMissingCosts = (params: Params, signal?: AbortSignal) => get<MissingCostRow[]>("missing-costs", params, signal);

/** The file name the server gave, from Content-Disposition. */
function fileName(disposition: string | undefined, fallback: string): string {
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : fallback;
}

/** "Excel'e Aktar": the report as an .xlsx, saved by the browser. */
export async function downloadReport(report: ReportName, params: Params): Promise<void> {
  const response = await api.get<Blob>(`/admin/reports/export/${report}`, {
    params,
    responseType: "blob",
    timeout: REPORT_TIMEOUT,
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(response.headers["content-disposition"] as string | undefined, `rapor-${report}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // After the click has handed the file over.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
