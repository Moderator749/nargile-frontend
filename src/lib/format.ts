import type { CurrencyType, DecimalString } from "@/types";

const formatters = new Map<string, Intl.NumberFormat>();

/** Lira amounts, Turkish grouping, always with kuruş: "6.700,00". */
const TL_AMOUNT = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TL_WHOLE = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
/** "6.700,00 TL": the shop writes lira after the amount, never "₺6.700,00". Non-breaking, so "TL" never wraps alone. */
const tl = (formatted: string) => `${formatted}\u00a0TL`;

/**
 * Formats a backend Decimal string or number: "1200.00" TRY → "1.200,00 TL".
 * Another currency (the dollar or euro display) keeps its own sign: "$24,41".
 */
export function formatMoney(amount: DecimalString | number, currency: CurrencyType = "TRY"): string {
  if (currency === "TRY") return tl(TL_AMOUNT.format(Number(amount)));
  let fmt = formatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency });
    formatters.set(currency, fmt);
  }
  return fmt.format(Number(amount));
}

/**
 * The same, without the kuruş when there are none: "20.000 TL" rather than
 * "20.000,00 TL". For round figures the shop quotes as round figures — a free
 * delivery limit, a threshold on a card — where ",00" is just noise. An amount
 * with kuruş in it still shows them.
 */
export function formatMoneyCompact(
  amount: DecimalString | number,
  currency: CurrencyType = "TRY",
): string {
  const value = Number(amount);
  if (!Number.isInteger(value)) return formatMoney(value, currency);
  if (currency === "TRY") return tl(TL_WHOLE.format(value));
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** One formatter per language and style, built on first use. */
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(intlLocale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${intlLocale}|${JSON.stringify(options)}`;
  let fmt = dateFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(intlLocale, options);
    dateFormatters.set(key, fmt);
  }
  return fmt;
}

/**
 * A date and time as the page's language writes it; Turkish unless an Intl
 * locale is given (lib/i18n/messages INTL_LOCALE: "en-GB", "ar-u-nu-latn").
 */
export function formatDate(iso: string, intlLocale = "tr-TR"): string {
  return dateFormatter(intlLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

/** Date and time in separate cells, for the order sheet's TARİH | SAAT columns. */
export function formatDateParts(iso: string, intlLocale = "tr-TR"): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: dateFormatter(intlLocale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d),
    time: dateFormatter(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(d),
  };
}

/**
 * Parses a money/percent field typed by a Turkish user: "1.250,50", "1250,5",
 * "1250.50" or "1,250.50" → "1250.50"; ",5" → "0.50". A comma or a dot is the
 * decimal mark (with both, the last one is), and one still being typed — "400,"
 * — reads as "400.00". Returns null for anything that isn't a non-negative
 * number with at most two decimals.
 */
export function parseDecimalInput(raw: string): string | null {
  let s = raw.trim().replace(/\s|₺|TL|%/gi, "");
  if (!s) return null;
  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    // "1.250,50" or "1,250.50": the other mark groups the thousands.
    const [group, mark] = comma > dot ? [".", ","] : [",", "."];
    s = s.split(group).join("").replace(mark, ".");
  } else if (comma >= 0) s = s.replace(",", ".");
  // "1.250" / "12.500.000" are Turkish thousands separators, not decimals.
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(s)) return null;
  return Number(s).toFixed(2);
}

/** Whole kuruş (cents) of a parsed decimal string, exactly: "183.33" → 18333. */
const toKurus = (decimal: string) => Math.round(Number(decimal) * 100);

/** Kuruş back to a form value, with no float in between: 18333 → "183,33". */
export const kurusToInput = (kurus: number) => `${Math.floor(kurus / 100)},${String(kurus % 100).padStart(2, "0")}`;

/**
 * KDV dahil from KDV hariç (or, with `reverse`, the other way round), both as
 * typed in a form; "" when the input is not a price. Worked in whole kuruş and
 * rounded half up, so there is never a float artefact ("400,0000001").
 */
export function convertVat(raw: string, rate: number, reverse = false): string {
  const parsed = parseDecimalInput(raw);
  if (parsed === null) return "";
  const kurus = toKurus(parsed);
  return kurusToInput(Math.round(reverse ? (kurus * 100) / (100 + rate) : (kurus * (100 + rate)) / 100));
}

/** A price as typed, tidied for showing: "183.33" / "400," → "183,33" / "400,00"; unparsable text is left alone. */
export function tidyPriceInput(raw: string): string {
  const parsed = parseDecimalInput(raw);
  return parsed === null ? raw : kurusToInput(toKurus(parsed));
}

/** Price excluding VAT from a VAT-inclusive price, rounded to kuruş. */
export function excludeVat(inclTax: string, vatRate: string): string {
  return (Number(inclTax) / (1 + Number(vatRate) / 100)).toFixed(2);
}
