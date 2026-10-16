/**
 * The sheet as the form holds it: every number is a string while it is being
 * typed (so "1.250,50" and a half-typed "12," stay intact), and only becomes a
 * decimal when the form is submitted.
 */

import { parseDecimalInput } from "@/lib/format";
import { PRODUCT_SLUG } from "@/lib/slug";
import type {
  CrossSellCard,
  CurrencyType,
  ProductSheet,
  SavedProductSheet,
  SheetPriceRow,
  SheetSegment,
  SheetStock,
  SheetVariant,
  UUID,
} from "@/types";

/** Price-matrix rows, in sheet order. */
export const SHEET_CURRENCIES: CurrencyType[] = ["USD", "EUR", "TRY"];
/** Price-matrix and stock columns, in sheet order. */
export const SHEET_COLUMNS: { segment: SheetSegment; label: string; stockField: keyof StockDraft }[] = [
  { segment: "DEALER", label: "Bayi", stockField: "bayi" },
  { segment: "WHOLESALE", label: "Toptan", stockField: "toptan" },
  { segment: "CAFE", label: "Kafe", stockField: "kafe" },
  { segment: "RETAIL", label: "Perakende", stockField: "perakende" },
];

export const CURRENCY_LABEL: Record<CurrencyType, string> = { TRY: "TL", USD: "USD", EUR: "EUR" };

/** The rates the shop actually uses. */
export const VAT_RATES = [0, 1, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

/** KDV dahil from KDV hariç, as the form fills the read-only box. */
export function withVat(excl: string, rate: VatRate): string {
  const net = parseDecimalInput(excl);
  if (net === null) return "";
  return (Number(net) * (1 + rate / 100)).toFixed(2).replace(".", ",");
}

/** The rate a saved sheet was priced at, for the select. */
function savedVatRate(sheet: SavedProductSheet): VatRate {
  for (const row of sheet.prices) {
    for (const cell of Object.values(row.cells)) {
      const rate = Number(cell?.vat_rate);
      if (Number.isFinite(rate)) {
        const match = VAT_RATES.find((r) => r === Math.round(rate));
        if (match !== undefined) return match;
      }
    }
  }
  return 20;
}

export interface StockDraft {
  bayi: string;
  toptan: string;
  kafe: string;
  perakende: string;
}

const emptyStock = (): StockDraft => ({ bayi: "", toptan: "", kafe: "", perakende: "" });

/**
 * One colour pill and the stock row it owns — the same object, so the "STOK"
 * table cannot drift out of step with the pills in "Ürün Bilgileri".
 *
 * `id` is the saved variant this row is, so renaming a colour keeps its stock;
 * a colour the admin has just added has none yet. `key` is for React, because a
 * brand-new row has no id and a label is not stable while it is being typed.
 */
export interface ColorDraft {
  key: string;
  id: UUID | null;
  label: string;
  sku: string | null;
  stock: StockDraft;
}

let colorKeySeed = 0;

export function newColor(label: string): ColorDraft {
  colorKeySeed += 1;
  return { key: `c${colorKeySeed}`, id: null, label, sku: null, stock: emptyStock() };
}

/** How two colour labels are compared: trimmed, collapsed, Turkish-insensitive. */
export const foldColor = (label: string) => label.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");

export interface CellDraft {
  excl: string;
  incl: string;
}

export interface SheetDraft {
  base_code: string;
  name: string;
  brand: string;
  /** Ticked categories, in the order ticked; the first is the primary one. */
  category_ids: number[];
  /** "Renk" as pills, each owning its own stock row; typed one at a time. */
  colors: ColorDraft[];
  /** One row per image input; blanks are dropped on save. */
  image_urls: string[];
  youtube_video_url: string;
  /** "Açıklama ve SEO". */
  description: string;
  metaTitle: string;
  metaDescription: string;
  /** The page's address, /product/<slug>; blank = keep it (or derive it, on a new product). */
  slug: string;
  /** "KDV Oranı" for the whole sheet; KDV dahil is computed from it. */
  vatRate: VatRate;
  /** "Birlikte satılanlar", as cards so the grid can draw them without a lookup. */
  crossSells: CrossSellCard[];
  isPublished: boolean;
  /** The quotas of a product with no colours; ignored once `colors` is non-empty. */
  stock: StockDraft;
  /** [currency][segment] → the two sides of one cell. */
  prices: Record<CurrencyType, Record<SheetSegment, CellDraft>>;
  rules: ProductSheet["rules"];
  opportunity: {
    is_opportunity: boolean;
    price: string;
    stock: string;
    /** `datetime-local` value (the admin's own clock). */
    endsAt: string;
    color: string;
    opp_is_free_shipping: boolean;
    opp_free_shipping_min_quantity: number | null;
    opp_has_havale_discount: boolean;
    opp_has_volume_discount: boolean;
    opp_gives_points: boolean;
    opp_can_use_points: boolean;
  };
}

const emptyCell = (): CellDraft => ({ excl: "", incl: "" });

function emptyMatrix(): SheetDraft["prices"] {
  return Object.fromEntries(
    SHEET_CURRENCIES.map((currency) => [
      currency,
      Object.fromEntries(SHEET_COLUMNS.map(({ segment }) => [segment, emptyCell()])),
    ]),
  ) as SheetDraft["prices"];
}

export function emptyDraft(): SheetDraft {
  return {
    base_code: "",
    name: "",
    brand: "",
    category_ids: [],
    colors: [],
    image_urls: [],
    youtube_video_url: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    slug: "",
    vatRate: 20,
    crossSells: [],
    isPublished: true,
    stock: emptyStock(),
    prices: emptyMatrix(),
    rules: {
      is_free_shipping: false,
      free_shipping_min_quantity: null,
      has_havale_discount: true,
      has_volume_discount: true,
      gives_points: true,
      can_use_points: true,
      is_cart_rule_applied: false,
    },
    opportunity: {
      is_opportunity: false,
      price: "",
      stock: "",
      endsAt: "",
      color: "#FFD400",
      opp_is_free_shipping: false,
      opp_free_shipping_min_quantity: null,
      opp_has_havale_discount: true,
      opp_has_volume_discount: true,
      opp_gives_points: true,
      opp_can_use_points: true,
    },
  };
}

const stockDraft = (stock: SheetStock | undefined): StockDraft =>
  stock
    ? {
        bayi: String(stock.bayi),
        toptan: String(stock.toptan),
        kafe: String(stock.kafe),
        perakende: String(stock.perakende),
      }
    : emptyStock();

/** An ISO instant as a `datetime-local` value in the admin's own timezone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function draftFromSheet(sheet: SavedProductSheet): SheetDraft {
  const draft = emptyDraft();
  const money = (v: string | null | undefined) => (v == null ? "" : String(Number(v)).replace(".", ","));
  for (const row of sheet.prices) {
    for (const { segment } of SHEET_COLUMNS) {
      const cell = row.cells[segment];
      if (!cell) continue;
      draft.prices[row.currency][segment] = { excl: money(cell.price_excl_tax), incl: money(cell.price_incl_tax) };
    }
  }
  // The server always sends one entry per colour (and one unnamed entry when
  // there are none), so the pills and the stock rows come from the same list.
  const saved = sheet.variants ?? [];
  const standard = saved.find((v) => v.color == null);
  return {
    ...draft,
    base_code: sheet.base_code,
    name: sheet.name,
    brand: sheet.brand ?? "",
    category_ids: sheet.category_ids ?? (sheet.category_id == null ? [] : [sheet.category_id]),
    colors: saved
      .filter((v) => v.color != null)
      .map((v) => ({ ...newColor(v.color as string), id: v.id ?? null, sku: v.sku ?? null, stock: stockDraft(v.stock) })),
    image_urls: sheet.image_urls,
    youtube_video_url: sheet.youtube_video_url ?? "",
    description: sheet.description ?? "",
    metaTitle: sheet.meta_title ?? "",
    metaDescription: sheet.meta_description ?? "",
    slug: sheet.slug ?? "",
    vatRate: savedVatRate(sheet),
    crossSells: sheet.related_products,
    isPublished: sheet.is_published,
    // On a coloured product the colours hold the stock and this is only the
    // total the server computed, so it is not carried into the form.
    stock: stockDraft(standard?.stock ?? sheet.stock),
    rules: { ...sheet.rules },
    opportunity: {
      is_opportunity: sheet.opportunity.is_opportunity,
      price: money(sheet.opportunity.opportunity_price),
      stock: sheet.opportunity.opportunity_stock == null ? "" : String(sheet.opportunity.opportunity_stock),
      endsAt: toLocalInput(sheet.opportunity.opportunity_end_date),
      color: sheet.opportunity.opportunity_color || "#FFD400",
      opp_is_free_shipping: sheet.opportunity.opp_is_free_shipping,
      opp_free_shipping_min_quantity: sheet.opportunity.opp_free_shipping_min_quantity ?? null,
      opp_has_havale_discount: sheet.opportunity.opp_has_havale_discount,
      opp_has_volume_discount: sheet.opportunity.opp_has_volume_discount,
      opp_gives_points: sheet.opportunity.opp_gives_points,
      opp_can_use_points: sheet.opportunity.opp_can_use_points,
    },
  };
}

const toStock = (stock: StockDraft): SheetStock => ({
  bayi: count(stock.bayi),
  toptan: count(stock.toptan),
  kafe: count(stock.kafe),
  perakende: count(stock.perakende),
});

const count = (raw: string) => {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const stockTotal = (stock: StockDraft) =>
  count(stock.bayi) + count(stock.toptan) + count(stock.kafe) + count(stock.perakende);

/** "Toplam Stok": every quota of every colour, or of the one standard row. */
export const draftStockTotal = (draft: SheetDraft) =>
  draft.colors.length > 0
    ? draft.colors.reduce((sum, color) => sum + stockTotal(color.stock), 0)
    : stockTotal(draft.stock);

/** Client-side check mirroring the server's; null = ready to save. */
export function draftProblem(draft: SheetDraft): string | null {
  if (!draft.base_code.trim()) return "Ürün kodu girin.";
  if (draft.name.trim().length < 2) return "Ürün adı girin.";
  if (draft.colors.some((c) => !c.label.trim())) return "Renk adı boş olamaz.";
  if (draft.metaTitle.length > 70) return "SEO başlığı en fazla 70 karakter olabilir.";
  if (draft.metaDescription.length > 160) return "SEO açıklaması en fazla 160 karakter olabilir.";
  const slug = draft.slug.trim().toLowerCase();
  if (slug && !PRODUCT_SLUG.test(slug))
    return "Sayfa adresi yalnızca küçük harf, rakam, tire ve nokta içerebilir (ör. sultan-nargile-takimi).";
  const anyPrice = SHEET_CURRENCIES.some((c) =>
    SHEET_COLUMNS.some(({ segment }) => cellFilled(draft.prices[c][segment])),
  );
  if (!anyPrice) return "En az bir fiyat girin.";
  if (draft.opportunity.is_opportunity) {
    if (!parseDecimalInput(draft.opportunity.price)) return "Fırsat fiyatı girin.";
    // No deadline is fine: the offer then runs until its stock runs out.
    if (draft.opportunity.endsAt && new Date(draft.opportunity.endsAt).getTime() <= Date.now())
      return "Fırsat bitiş tarihi gelecekte olmalı.";
  }
  return null;
}

export const cellFilled = (cell: CellDraft) => !!parseDecimalInput(cell.excl) || !!parseDecimalInput(cell.incl);

/** The payload: only the cells that were filled in, prices as decimal strings. */
export function toPayload(draft: SheetDraft): ProductSheet {
  const prices: SheetPriceRow[] = SHEET_CURRENCIES.map((currency) => {
    const cells: SheetPriceRow["cells"] = {};
    for (const { segment } of SHEET_COLUMNS) {
      const cell = draft.prices[currency][segment];
      // Always send the cell, so one the admin cleared is removed server-side.
      cells[segment] = {
        price_excl_tax: parseDecimalInput(cell.excl),
        price_incl_tax: parseDecimalInput(cell.incl),
        vat_rate: draft.vatRate.toFixed(2),
      };
    }
    return { currency, cells };
  });

  const opp = draft.opportunity;
  const colors = draft.colors.map((c) => c.label.trim()).filter(Boolean);
  // One stock block per colour, in pill order; a colourless product sends the
  // single standard block instead. The server reconciles the two lists either way.
  const variants: SheetVariant[] =
    draft.colors.length > 0
      ? draft.colors
          .filter((c) => c.label.trim())
          .map((c) => ({ id: c.id, color: c.label.trim(), stock: toStock(c.stock) }))
      : [{ id: null, color: null, stock: toStock(draft.stock) }];

  return {
    base_code: draft.base_code.trim(),
    name: draft.name.trim(),
    brand: draft.brand.trim() || null,
    category_ids: draft.category_ids,
    color_names: colors,
    image_urls: draft.image_urls.map((u) => u.trim()).filter(Boolean),
    youtube_video_url: draft.youtube_video_url.trim() || null,
    description: draft.description.trim() || null,
    meta_title: draft.metaTitle.trim() || null,
    meta_description: draft.metaDescription.trim() || null,
    slug: draft.slug.trim().toLowerCase() || null,
    stock: toStock(draft.stock),
    variants,
    prices,
    rules: { ...draft.rules },
    related_product_ids: draft.crossSells.map((c) => c.id),
    is_published: draft.isPublished,
    opportunity: {
      is_opportunity: opp.is_opportunity,
      opportunity_price: opp.is_opportunity ? parseDecimalInput(opp.price) : null,
      opportunity_stock: opp.stock.trim() ? count(opp.stock) : null,
      opportunity_end_date: opp.is_opportunity && opp.endsAt ? new Date(opp.endsAt).toISOString() : null,
      opportunity_color: opp.color || null,
      opp_is_free_shipping: opp.opp_is_free_shipping,
      opp_free_shipping_min_quantity: opp.opp_free_shipping_min_quantity,
      opp_has_havale_discount: opp.opp_has_havale_discount,
      opp_has_volume_discount: opp.opp_has_volume_discount,
      opp_gives_points: opp.opp_gives_points,
      opp_can_use_points: opp.opp_can_use_points,
    },
  };
}
