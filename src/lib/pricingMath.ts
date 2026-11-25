/*
 * "Fiyat Hesaplama Cetveli": the worksheet's arithmetic and number reading,
 * kept free of the API client so `npm test` reads it as is. It mirrors
 * `app/services/pricing_sheet.py` to the kuruş: half a kuruş rounds up, as the
 * server does since 2026-11-25, and retail TL is whole lira, rounded up, as
 * the server writes it to the site (Bayi, Toptan and Kafe keep their kuruş).
 */

export type PricingCurrency = "TRY" | "USD" | "EUR";
export type VatMode = "EXCL" | "INCL";

/** The KDV rates the shop uses; the calculator offers these only, as the server takes. */
export const VAT_RATES = [0, 1, 10, 20] as const;

/**
 * A figure as decimal arithmetic would have it: a float like 10.605 × 100 is
 * 1060.4999999999998, which must count as 1060.5. Twelve significant digits
 * are far beyond any price here and drop that noise.
 */
const clean = (n: number) => Number(n.toPrecision(12));

/** To the kuruş, half a kuruş up (10.605 → 10.61), as the server's ROUND_HALF_UP. */
export const round2 = (n: number) => Math.round(clean(n * 100)) / 100;

/** Up to the next whole lira; a whole amount stays (1904.40 → 1905, 1164 → 1164), as `whole_lira`. */
export const wholeLira = (n: number) => Math.ceil(clean(n));

/**
 * A number as a Turkish admin types it: "1250,5", "1.250,50", "49,3681", "-5".
 * Up to four decimals — exchange rates and costs need them — where the shared
 * money parser stops at kuruş. Null when empty or unusable; `unreadable` tells
 * the two apart.
 */
export function parseAmount(raw: string): number | null {
  let t = raw.trim().replace(/\s|₺|\$|€|%/g, "");
  if (!t) return null;
  const negative = t.startsWith("-");
  if (negative) t = t.slice(1);
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // "12.500": thousands
  if (!/^\d+(\.\d{1,4})?$/.test(t)) return null;
  return Number(t) * (negative ? -1 : 1);
}

/** Something was typed, but it is not a number this sheet can use ("12a", "1,2,3"). */
export const unreadable = (raw: string) => raw.trim() !== "" && parseAmount(raw) === null;

/** For the server: `places` decimals at most (prices 2, ERP prices, rates and percents 4). */
export function decimalText(raw: string, places = 4): string | null {
  const n = parseAmount(raw);
  return n === null ? null : String(Number(n.toFixed(places)));
}

/** A column's figures below its percent: calculated, its automatic "uygulanacak fiyat", and the price it sends (typed, else that). */
export interface ComputedPrice {
  computed: number | null;
  /** The base — the ERP fiyatı, else the calculated value — plus the sheet's uygulanacak oran. */
  auto: number | null;
  price: number | null;
}

export interface ComputedSheet {
  columns: ComputedPrice[];
  /** Between the classes and retail, each shown as retail is: after VAT, with its step before VAT. */
  extras: (ComputedPrice & { beforeVat: number | null })[];
  /** Retail after VAT ("KDV dahil perakende"), calculated and applied. */
  retail: ComputedPrice;
  /** The retail markup step before VAT is added (equal to `computed` on an after-VAT sheet). */
  retailBeforeVat: number | null;
  /**
   * A TL sheet: the retail price the site gets — `retail.price` in whole lira,
   * rounded up (1904.40 → 1905). Null on a USD/EUR sheet, whose retail goes as
   * entered (or as the "son karar").
   */
  retailShelf: number | null;
  /** USD/EUR sheets: retail × the typed rate, in whole lira rounded up, as the server stores it. */
  tryPrice: number | null;
}

type Typed = { percent: number | null; desired: number | null; erpPrice: number | null };

/**
 * A calculated value's own figures: the base (the ERP fiyatı typed, else the
 * calculated value) plus the uygulanacak oran (none or 0: as it is), a typed
 * price winning. The ERP fiyatı is in the column's own basis already and is
 * taken as it is — no VAT is added to it.
 */
function priced(computed: number | null, { desired, erpPrice }: Typed, applied: number | null): ComputedPrice {
  const base = erpPrice ?? computed;
  const auto = base === null ? null : round2(applied ? base * (1 + applied / 100) : base);
  return { computed: computed === null ? null : round2(computed), auto, price: desired ?? auto };
}

/**
 * The calculated row is one unbroken chain: each column is the previous
 * *calculated* value plus its percent. A typed "uygulanacak fiyat" becomes that
 * column's price but never feeds the chain. Null propagates: a column after an
 * unusable one has nothing to stand on.
 *
 * After the classes come the extras ("Mağaza Fiyatı"), then retail, both shown
 * after VAT while the chain runs on before VAT, so VAT is added once: retail
 * builds on the extra's step before VAT. An extra left without a percent is
 * not sent, and is passed over here too: retail then builds on the step
 * before it — the last class, whichever it is. Each column's "uygulanacak
 * fiyat", when none is typed, is its ERP fiyatı (else its calculated value)
 * plus — for the classes only — the sheet's "uygulanacak oran"; the extras and
 * retail never take the rate. No VAT is ever added to an ERP fiyatı: the
 * classes' is in the sheet's basis (before VAT on Cetvel 1, after on Cetvel 2:
 * 115 + 5% is 120.75), and the extras' and retail's are shelf prices, after
 * VAT on both sheets — 250 typed is 250.00 to apply. Only an empty one leaves
 * the chain's own price, VAT included.
 */
export function computeSheet(input: {
  cost: number | null;
  columns: Typed[];
  extras?: Typed[];
  retail: Typed & { vatRate: number | null };
  appliedPercent?: number | null;
  vatMode: VatMode;
  currency: PricingCurrency;
  usdRate: number | null;
  eurRate: number | null;
}): ComputedSheet {
  const r = input.retail;
  const applied = input.appliedPercent ?? null;
  const factor = r.vatRate !== null ? 1 + r.vatRate / 100 : null;
  const withVat = (v: number | null) =>
    v === null ? null : input.vatMode === "INCL" ? v : factor === null ? null : v * factor;

  let previous = input.cost;
  const columns = input.columns.map((typed) => {
    const computed = previous !== null && typed.percent !== null ? previous * (1 + typed.percent / 100) : null;
    previous = computed;
    return priced(computed, typed, applied);
  });
  const extras = (input.extras ?? []).map((typed) => {
    if (typed.percent === null) return { computed: null, auto: null, price: null, beforeVat: null };
    const step = previous === null ? null : previous * (1 + typed.percent / 100);
    previous = step;
    // The rate is the classes' only: an extra's price is its base.
    return { ...priced(withVat(step), typed, null), beforeVat: step === null ? null : round2(step) };
  });
  // Retail is the shelf price, after VAT: VAT is added here when the sheet's
  // cost (and so its chain) is before VAT.
  const beforeVat = previous !== null && r.percent !== null ? previous * (1 + r.percent / 100) : null;
  const retail = priced(withVat(beforeVat), r, null); // retail never takes the rate
  const rate = input.currency === "USD" ? input.usdRate : input.currency === "EUR" ? input.eurRate : null;
  return {
    columns,
    extras,
    retail,
    retailBeforeVat: beforeVat === null ? null : round2(beforeVat),
    retailShelf: input.currency === "TRY" && retail.price !== null ? wholeLira(retail.price) : null,
    tryPrice: retail.price !== null && rate ? wholeLira(retail.price * rate) : null,
  };
}

// ── What a sheet must be before it is saved ──────────────────────────────────

/** The typed sheet, as text, as far as checking it needs. */
export interface TypedSheet {
  currency: PricingCurrency;
  cost: string;
  columns: { label: string; segment: string; percent: string; desired: string; erpPrice: string }[];
  extras: { label: string; percent: string; desired: string; erpPrice: string }[];
  retailPercent: string;
  vatRate: string;
  retailDesired: string;
  retailErpPrice: string;
  appliedPercent: string;
  usdRate: string;
  eurRate: string;
  finalTry: string;
}

/** A price as typed: more than two decimals is not a price ("12,345" would be sent as 12,35). */
const fine = (raw: string) => /[.,]\d{3,}$/.test(raw.trim()) && !/^\d{1,3}(\.\d{3})+$/.test(raw.trim());
/** Empty, or a usable price: a number above zero, to the kuruş. */
const priceOk = (raw: string) => !raw.trim() || (!fine(raw) && (parseAmount(raw) ?? 0) > 0);
/** Empty, or a usable ERP price / rate: a number above zero, up to four decimals. */
const positiveOk = (raw: string) => !raw.trim() || (parseAmount(raw) ?? 0) > 0;
/** A percent the server takes: above -100 (a price can't fall to nothing), at most 10000. */
const percentOk = (raw: string) => {
  const n = parseAmount(raw);
  return n !== null && n > -100 && n <= 10000;
};

/**
 * Why the sheet can't be saved yet, in the admin's words — or null when it
 * can. Every field that holds something unreadable is refused, never dropped:
 * a typo in "son karar" used to be sent as empty, and retail then went to the
 * site in dollars instead of the TL decided on.
 */
export function sheetProblem(d: TypedSheet): string | null {
  const foreign = d.currency !== "TRY";
  const sentExtras = d.extras.filter((c) => parseAmount(c.percent) !== null);
  const strayExtra = d.extras.some(
    (c) => parseAmount(c.percent) === null && (c.percent.trim() || c.desired.trim() || c.erpPrice.trim()),
  );
  const used = d.columns.map((c) => c.segment).filter(Boolean);
  const cost = parseAmount(d.cost);
  const vat = parseAmount(d.vatRate);
  const rateField = d.currency === "USD" ? d.usdRate : d.eurRate;

  if (cost === null || cost <= 0) return "Maliyeti sıfırdan büyük bir sayı olarak girin.";
  if ([...d.columns, ...sentExtras].some((c) => !c.label.trim())) return "Her fiyat sınıfına bir ad verin.";
  if (d.columns.some((c) => parseAmount(c.percent) === null) || parseAmount(d.retailPercent) === null)
    return "Her sütunun kâr oranını girin (0 da olabilir).";
  if (strayExtra) return "Mağaza fiyatına önce kâr oranını girin (boşsa kaydedilmez).";
  if (![...d.columns.map((c) => c.percent), ...sentExtras.map((c) => c.percent), d.retailPercent].every(percentOk))
    return "Kâr oranları -100’den büyük, 10.000’den küçük olmalı.";
  if (d.appliedPercent.trim() && !percentOk(d.appliedPercent))
    return "Uygulanacak oranı -100’den büyük bir sayı olarak girin (ya da boş bırakın).";
  if (![...d.columns, ...d.extras].every((c) => positiveOk(c.erpPrice)) || !positiveOk(d.retailErpPrice))
    return "ERP fiyatlarını sıfırdan büyük bir sayı olarak girin (ya da boş bırakın).";
  if (![...d.columns, ...d.extras].every((c) => priceOk(c.desired)) || !priceOk(d.retailDesired))
    return "Yeşil satırdaki fiyatları sıfırdan büyük, en çok iki kuruş haneli bir sayı olarak girin (ya da boş bırakın).";
  if (vat === null || !(VAT_RATES as readonly number[]).includes(vat)) return "KDV oranını seçin: %0, %1, %10 ya da %20.";
  if (new Set(used).size !== used.length) return "Bir müşteri grubu yalnızca bir sütuna bağlanabilir.";
  if (foreign) {
    if (!positiveOk(d.usdRate) || !positiveOk(d.eurRate) || parseAmount(rateField) === null)
      return `${d.currency === "USD" ? "Dolar" : "Euro"} kurunu sıfırdan büyük bir sayı olarak girin.`;
    if (!priceOk(d.finalTry)) return "Son kararı (TL) sıfırdan büyük bir sayı olarak girin (ya da boş bırakın).";
  }
  return null;
}
