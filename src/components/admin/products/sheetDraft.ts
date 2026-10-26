/**
 * The sheet as the form holds it: every number is a string while it is being
 * typed (so "1.250,50" and a half-typed "12," stay intact), and only becomes a
 * decimal when the form is submitted.
 */

import { convertVat, kurusToInput, parseDecimalInput } from "@/lib/format";
import { PRODUCT_SLUG } from "@/lib/slug";
import type {
  TranslatedLocale,
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
/** Price-matrix columns, in sheet order. Stock is one number for all of them. */
export const SHEET_COLUMNS: { segment: SheetSegment; label: string }[] = [
  { segment: "DEALER", label: "Bayi" },
  { segment: "WHOLESALE", label: "Toptan" },
  { segment: "CAFE", label: "Kafe" },
  { segment: "RETAIL", label: "Perakende" },
];

export const CURRENCY_LABEL: Record<CurrencyType, string> = { TRY: "TL", USD: "USD", EUR: "EUR" };

/** The rates the shop actually uses. */
export const VAT_RATES = [0, 1, 10, 20] as const;
export type VatRate = (typeof VAT_RATES)[number];

/** KDV dahil from KDV hariç, as the form fills the other box. */
export function withVat(excl: string, rate: VatRate): string {
  return convertVat(excl, rate);
}

/** KDV hariç from KDV dahil, rounded to kuruş — the reverse of `withVat`. */
export function withoutVat(incl: string, rate: VatRate): string {
  return convertVat(incl, rate, true);
}

/**
 * A cell after the admin typed `raw` into one of its boxes: the other box follows
 * at `rate`. "12," already counts as 12; an entry that is not a price (yet) leaves
 * the other box as it was rather than blanking it; clearing one box clears both.
 */
export function typedCell(cell: CellDraft, side: "excl" | "incl", raw: string, rate: VatRate): CellDraft {
  const other = side === "excl" ? cell.incl : cell.excl;
  const derived = !raw.trim()
    ? ""
    : parseDecimalInput(raw) === null
      ? other
      : side === "excl"
        ? withVat(raw, rate)
        : withoutVat(raw, rate);
  return side === "excl" ? { excl: raw, incl: derived } : { excl: derived, incl: raw, basis: "incl" };
}

/** A cell re-derived at a new rate, from whichever price the admin typed. */
export function atRate(cell: CellDraft, rate: VatRate): CellDraft {
  return cell.basis === "incl"
    ? { ...cell, excl: withoutVat(cell.incl, rate) }
    : { ...cell, incl: withVat(cell.excl, rate) };
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

/** "Mevcut Stok Adedi" as typed: the one stock every buyer draws from. */
export interface StockDraft {
  quantity: string;
}

const emptyStock = (): StockDraft => ({ quantity: "" });

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
  /** "incl" once the admin typed the KDV dahil price: a new rate keeps it and
   * re-derives the net one. Otherwise the net price is the one kept. */
  basis?: "incl";
}

/** "Çeviriler": one language's fields as typed; blank = Turkish shows there. */
export interface TranslationDraft {
  name: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  /** Written by Claude, not yet approved: shown on /en and /ar, not indexed. */
  draft: boolean;
  /** The draft's source fingerprint, kept so a save does not have it rewritten. */
  source: string | null;
}

export const TRANSLATED_LOCALES: TranslatedLocale[] = ["en", "ar"];
export const LOCALE_LABEL: Record<TranslatedLocale, string> = { en: "İngilizce (EN)", ar: "Arapça (AR)" };

const emptyTranslation = (): TranslationDraft => ({ name: "", description: "", metaTitle: "", metaDescription: "", draft: false, source: null });

/** Rich text with no words in it ("<p></p>", a lone <br>) is blank. */
const blankHtml = (html: string) => !html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

/** Whether a language has anything typed in it at all. */
export function translationStarted(t: TranslationDraft): boolean {
  return !!(t.name.trim() || !blankHtml(t.description) || t.metaTitle.trim() || t.metaDescription.trim());
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
  /** "Çeviriler": English and Arabic. A language with no name is not saved. */
  translations: Record<TranslatedLocale, TranslationDraft>;
  /** The page's address, /product/<slug>; blank = keep it (or derive it, on a new product). */
  slug: string;
  /** "KDV Oranı" for the whole sheet; KDV dahil is computed from it. */
  vatRate: VatRate;
  /** "Birlikte satılanlar", as cards so the grid can draw them without a lookup. */
  crossSells: CrossSellCard[];
  isPublished: boolean;
  /** The stock of a product with no colours; ignored once `colors` is non-empty. */
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
    translations: { en: emptyTranslation(), ar: emptyTranslation() },
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
      has_dealer_havale_discount: false,
      has_toptan_havale_discount: false,
      has_cafe_havale_discount: false,
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
  stock ? { quantity: String(stock.quantity) } : emptyStock();

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
  const money = (v: string | null | undefined) => (v == null ? "" : kurusToInput(Math.round(Number(v) * 100)));
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
    translations: Object.fromEntries(
      TRANSLATED_LOCALES.map((l) => {
        const t = sheet.translations?.[l];
        return [
          l,
          t
            ? {
                name: t.name,
                description: t.description ?? "",
                metaTitle: t.meta_title ?? "",
                metaDescription: t.meta_description ?? "",
                draft: !!t.draft,
                source: t.source ?? null,
              }
            : emptyTranslation(),
        ];
      }),
    ) as Record<TranslatedLocale, TranslationDraft>,
    slug: sheet.slug ?? "",
    vatRate: savedVatRate(sheet),
    crossSells: sheet.related_products,
    isPublished: sheet.is_published,
    // On a coloured product the colours hold the stock and this is only the
    // total the server computed, so it is not carried into the form.
    stock: stockDraft(standard?.stock ?? sheet.stock),
    // A sheet saved before the B2B havale switches existed reads them as off.
    rules: {
      ...sheet.rules,
      has_dealer_havale_discount: sheet.rules.has_dealer_havale_discount ?? false,
      has_toptan_havale_discount: sheet.rules.has_toptan_havale_discount ?? false,
      has_cafe_havale_discount: sheet.rules.has_cafe_havale_discount ?? false,
    },
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

const toStock = (stock: StockDraft): SheetStock => ({ quantity: count(stock.quantity) });

const count = (raw: string) => {
  const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const stockTotal = (stock: StockDraft) => count(stock.quantity);

/** "Toplam Stok": every colour's stock, or the one standard row's. */
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
  for (const l of TRANSLATED_LOCALES) {
    const t = draft.translations[l];
    if (translationStarted(t) && !t.name.trim()) return `${LOCALE_LABEL[l]} çeviri için ürün adını girin (ya da alanları boşaltın).`;
    if (t.metaTitle.length > 70) return `${LOCALE_LABEL[l]} SEO başlığı en fazla 70 karakter olabilir.`;
    if (t.metaDescription.length > 160) return `${LOCALE_LABEL[l]} SEO açıklaması en fazla 160 karakter olabilir.`;
  }
  const slug = draft.slug.trim().toLowerCase();
  if (slug && !PRODUCT_SLUG.test(slug))
    return "Sayfa adresi yalnızca küçük harf, rakam, tire ve nokta içerebilir (ör. sultan-nargile-takimi).";
  const anyPrice = SHEET_CURRENCIES.some((c) =>
    SHEET_COLUMNS.some(({ segment }) => cellFilled(draft.prices[c][segment])),
  );
  if (!anyPrice) return "En az bir fiyat girin.";
  // A box that is not a price would otherwise be dropped on save without a word.
  for (const currency of SHEET_CURRENCIES)
    for (const { segment, label } of SHEET_COLUMNS) {
      const cell = draft.prices[currency][segment];
      if ([cell.excl, cell.incl].some((v) => v.trim() && parseDecimalInput(v) === null))
        return `Fiyat tablosu: ${label} ${CURRENCY_LABEL[currency]} fiyatı geçerli değil (en fazla 2 ondalık, ör. 183,33).`;
    }
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
    // Only the languages with a name: one emptied here is removed.
    translations: Object.fromEntries(
      TRANSLATED_LOCALES.filter((l) => draft.translations[l].name.trim()).map((l) => {
        const t = draft.translations[l];
        return [
          l,
          {
            name: t.name.trim(),
            description: blankHtml(t.description) ? null : t.description.trim(),
            meta_title: t.metaTitle.trim() || null,
            meta_description: t.metaDescription.trim() || null,
            // A draft stays one until "Onayla": saving the sheet approves nothing.
            ...(t.draft ? { draft: true, source: t.source } : {}),
          },
        ];
      }),
    ),
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
