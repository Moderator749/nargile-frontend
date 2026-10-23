// Mirrors the FastAPI Pydantic schemas in saas_backend/app/schemas.
// Over JSON, Pydantic v2 serializes UUID, datetime and Decimal as strings.

export type UUID = string;
export type ISODateTime = string;
/** Decimal serialized as a string (e.g. "149.90") to avoid float rounding. */
export type DecimalString = string;

// ---- Enums ----

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
/**
 * Who the customer is, as the four sign-up cards put it: bireysel, a kafe, a
 * tobacco shop, or a customer outside Turkey. It is a line of business, not a
 * legal form — whether a firm is a şahıs firması or a şirket is `BillingEntity`,
 * asked in its invoice section.
 *
 * "SOLE_PROPRIETOR" and "COMPANY" are the two cards this replaced; accounts
 * created under them keep saying so, and the form never offers them again.
 */
export type AccountType =
  | "INDIVIDUAL"
  | "CAFE"
  | "TOBACCO_SHOP"
  | "INTERNATIONAL"
  | "SOLE_PROPRIETOR"
  | "COMPANY";
/**
 * What an international customer buys for — the counterpart of the two domestic
 * business cards. Both are businesses; there is no private export customer.
 */
export type InternationalKind = "WHOLESALER" | "CAFE";
/** Which kind of firm an invoice is made out to; mirrors the account type for a business account. */
export type BillingEntity = "SOLE_PROPRIETOR" | "COMPANY";
export type SegmentType = "RETAIL" | "CAFE" | "WHOLESALE" | "DEALER";
export type CurrencyType = "TRY" | "USD" | "EUR";
export type WarehouseType = "RETAIL_STOCK" | "B2B_STOCK";
/** QUOTE: an export order request — nothing was charged; see `lib/exportAccount`. */
export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER" | "QUOTE";
/** How an export shipment leaves the country; quoted after the order. */
export type TransportMode = "ROAD" | "AIR" | "SEA";
/**
 * AWAITING_TRANSFER = "Havale Bekliyor": a bank-transfer order waiting for the money.
 * AWAITING_PAYMENT = "Ödeme Bekliyor": a card order waiting for PayTR to confirm it.
 * PAYMENT_FAILED: the card payment failed or was never completed; what the
 * order held went back, as on a cancellation.
 */
export type OrderStatus =
  | "PENDING_APPROVAL"
  | "AWAITING_TRANSFER"
  | "AWAITING_PAYMENT"
  | "APPROVED"
  | "SHIPPED"
  | "CANCELLED"
  | "PAYMENT_FAILED";
/**
 * How an order travels. Which of these a customer may pick depends on what kind
 * of account they have — see `src/lib/shipping.ts`, which mirrors the server's
 * `METHODS_BY_ACCOUNT_TYPE`.
 *
 * YURTICI_DOOR: Yurtiçi Kargo, to the address.
 * YURTICI_BRANCH: Yurtiçi Kargo, collected from a branch (bireysel only).
 * NAKLIYE_AMBARI: a freight depot delivers and collects its own fee.
 * ISTANBUL_FREE: the shop's own İstanbul run — free, and only for a firm
 * registered there.
 * INTERNATIONAL_FREIGHT: export; freight and customs are quoted after the order.
 */
/** Who took the parcel ("Kargola"): Yurtiçi, another carrier or ambar by name, or the shop's own van. */
export type Carrier = "YURTICI" | "OTHER" | "OWN";

export type ShippingMethod =
  | "YURTICI_DOOR"
  | "YURTICI_BRANCH"
  | "NAKLIYE_AMBARI"
  | "ISTANBUL_FREE"
  | "INTERNATIONAL_FREIGHT";
/** Who pays the carriage: the shop (free shipping) or the buyer on delivery. */
export type ShippingPayer = "SHOP" | "RECEIVER";

/**
 * A Turkish address field by field, as sign-up asks for it. District and
 * province are required (nothing ships without them), and one of neighbourhood
 * or street — villages have no street names, new districts no neighbourhood.
 */
export interface StructuredAddress {
  neighbourhood?: string | null;
  street?: string | null;
  building_no?: string | null;
  building_name?: string | null;
  door_no?: string | null;
  district: string;
  city: string;
}

/**
 * An address outside Turkey: two lines, a city (or state, or province — one
 * field, since which of them a country uses is its own business), an optional
 * postal code and an ISO 3166-1 alpha-2 country. No national format is
 * checked; the country is, because it decides carrier, duty and paperwork.
 */
export interface InternationalAddress {
  country: string;
  city: string;
  postal_code?: string | null;
  address_line1: string;
  address_line2?: string | null;
}

/**
 * Where one order goes, frozen onto the order itself.
 *
 * Turkish by default, and then `city` is one of the 81 provinces and `district`
 * is required. For an export order the country changes, `city` is whatever
 * subdivision that country uses, and there is no ilçe.
 */
export interface ShippingAddress {
  full_name: string;
  phone: string;
  /** ISO 3166-1 alpha-2; "TR" unless the order is an export. */
  country: string;
  /** One of the 81 provinces at home (canonical spelling, e.g. "İstanbul"). */
  city: string;
  district: string | null;
  postal_code: string | null;
  line: string;
}

/** An address from sign-up, offered at checkout as somewhere to ship to. */
export interface SavedAddress {
  kind: AddressKind;
  label: string;
  full_name: string | null;
  phone: string | null;
  country: string;
  city: string;
  district: string | null;
  postal_code: string | null;
  line: string;
}

// ---- User / Auth ----

export interface User {
  id: UUID;
  email: string;
  full_name: string | null;
  phone: string | null;
  account_type: AccountType;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: ISODateTime;
  /** Returned by GET /auth/me (UserMe); absent from other user responses. */
  segment_code?: SegmentType | null;
  /** Usable Sultan Puan (each worth `loyalty.conversion_rate` TRY). Returned by GET /auth/me only. */
  loyalty_balance?: number;
}

/** Whoever the invoice is made out to — the account's own firm, or another one. */
export interface CompanyIdentityInput {
  /** Required when an individual asks for a corporate invoice; set from the account type otherwise. */
  entity_type?: BillingEntity | null;
  title: string;
  /** The name on the tax plate. Required for a Turkish business account, never sent otherwise. */
  tax_plate_name?: string | null;
  /** Vergi dairesi — Turkish accounts only. */
  tax_office?: string | null;
  /**
   * Where the firm is. Required when the firm is somebody else's — an
   * individual asking for a corporate invoice — and never sent by a business
   * account, whose own `billing_address` is its firm's.
   */
  address?: StructuredAddress | null;
  /** VKN (10) or TC (11) for a Turkish firm; an international VAT/EIN number in any shape. */
  tax_number?: string | null;
}

/**
 * The sign-up payload. What is required depends on `account_type`:
 * an individual gives a name, a mobile number and an e-mail; a firm gives its
 * tax identity, a contact person and a billing address.
 *
 * Nothing about delivery, which is settled at checkout on the order, and
 * nothing about pricing: every self-service account is RETAIL until an admin
 * grants a segment, from an application the customer makes once signed in.
 */
export interface RegistrationCreate {
  account_type: AccountType;
  email: string;
  password: string;
  /** Kullanıcı adı: optional, and a second way to log in once chosen. */
  username?: string | null;
  /** İsim soyisim (bireysel). */
  full_name?: string | null;
  /** Yetkili kişi (firma); becomes the account's display name. */
  contact_name?: string | null;
  /** Cep tel — required for every account type. */
  phone: string;
  landline_phone?: string | null;
  /** TC kimlik no, individuals only. */
  national_id?: string | null;
  /** Wholesaler or kafe; asked of international accounts only. */
  international_kind?: InternationalKind | null;
  company?: CompanyIdentityInput | null;
  /** Turkish accounts send the structured Turkish shape, international ones the global one. */
  billing_address?: StructuredAddress | InternationalAddress | null;
  /** Ticari elektronik ileti onayı: optional, off by default; true turns on both campaign e-mail and SMS. */
  marketing_consent?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ---- Catalog ----

export interface Category {
  id: number;
  /** In the page's language (the API answers with ?lang=); Turkish where it has none. */
  name: string;
  slug: string;
  /** The languages it is translated into, Turkish first. */
  locales?: string[];
  /** Two-level menu: null = top-level group. */
  parent_id: number | null;
  /** Order among siblings (ascending). */
  sort_order?: number;
  /** Cover photo for its showcase tile; null = a product photo is borrowed. */
  image_url?: string | null;
  /** The page's introduction as the admin wrote it; null = the built-in copy, if any. */
  description?: string | null;
  /** The passage closing its page (heading, HTML), in place of the shop's "Alt SEO Metni"; Turkish only. */
  seo_title?: string | null;
  seo_text?: string | null;
  /** `GET /categories/` only: published products its page lists, subcategories included. */
  product_count?: number;
  /** `GET /categories/` only: the newest last edit among them (the sitemap's <lastmod>). */
  updated_at?: string | null;
}

/** A top-level category with its subcategories (menu, tabs). */
export interface CategoryNode extends Category {
  children: Category[];
}

/** "Markalar" menu and homepage marquee. Links to a catalog name search. */
export interface Brand {
  id: number;
  name: string;
  slug: string;
  search_term: string;
  /** Absolute URL of the uploaded logo; null = show the name as a wordmark. */
  logo_url: string | null;
  /** A line or two for the brand's page (/marka/<slug>); null = none. */
  description?: string | null;
  is_active: boolean;
  sort_order: number;
}

/** One product of a category page, as the order editor ("Ürün Sıralaması") lists it. */
export interface CategoryProductOrderRow {
  product_id: UUID;
  name: string;
  base_code: string;
  brand: string | null;
  image_url: string | null;
  is_published: boolean;
  /** Its place in the admin's order; null when not ranked (it follows the ranked, by name). */
  position: number | null;
}

/** The languages a product or category is translated into besides Turkish. */
export type TranslatedLocale = "en" | "ar";

/**
 * A product in one more language; blank fields fall back to Turkish. A
 * `draft` was written by Claude and awaits review: shown on the storefront,
 * kept out of the index until an admin approves it ("Onayla").
 */
export interface ProductTranslation {
  draft?: boolean;
  /** For a draft: which Turkish it was written from (sent back unchanged). */
  source?: string | null;
  name: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface CategoryTranslation {
  draft?: boolean;
  source?: string | null;
  name: string;
  description?: string | null;
}

export interface AdminCategory extends Category {
  /** English and Arabic, where translated. */
  translations?: Partial<Record<TranslatedLocale, CategoryTranslation>> | null;
  sort_order: number;
  /** Off = hidden from the storefront (with its subcategories); products stay. */
  is_active: boolean;
  /** Products assigned directly (not via subcategories). */
  product_count: number;
}

export interface CategoryWrite {
  name: string;
  slug?: string | null;
  description?: string | null;
  seo_title?: string | null;
  seo_text?: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
  /** Sent: replaces the category's translations (a language left out is dropped). Omitted: kept. */
  translations?: Partial<Record<TranslatedLocale, CategoryTranslation>> | null;
}

export interface BrandWrite {
  name: string;
  slug?: string | null;
  search_term?: string | null;
  description?: string | null;
  /** Only `null` means anything: it takes the logo off. A logo is put on by its own upload. */
  logo_url?: null;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: UUID;
  /** The page's address, /product/<slug>; given once and kept through renames. */
  slug: string;
  base_code: string;
  name: string;
  brand: string | null;
  description: string | null;
  /** "Açıklama ve SEO": overrides the page <title>; null falls back to the name. */
  meta_title?: string | null;
  /** Overrides the page meta description; null falls back to `description`. */
  meta_description?: string | null;
  category_id: number | null;
  tags: string[] | null;
  /** The cover photo (the first of `image_urls`); null when there is none. */
  image_url: string | null;
  /**
   * The whole gallery, cover first; contains the cover when there is one. Optional
   * because a response cached before galleries existed simply has no such field.
   */
  image_urls?: string[];
  youtube_video_url: string | null;
  /**
   * "Renk" labels, in the order the admin added them. Each one is a variant with
   * its own stock: `variants[].color_name` is what the picker chooses between.
   */
  color_names?: string[];
  /**
   * On the "Fırsat Ürünleri" list while true — even once the deal is over, when
   * it shows as "Fırsat Kaçtı". A claimable deal also has `variants[].flash_sale`.
   */
  is_opportunity: boolean;
  /** "Fırsat rengi": the badge colour for a product on offer, "#rrggbb". */
  opportunity_color: string | null;
  /** Last edit of the product itself (ISO); the sitemap's <lastmod>. */
  updated_at?: string | null;
}

// Catalog listing (GET /products/): prices resolved for the caller's segment.
export interface CatalogPrice {
  currency: CurrencyType;
  price_excl_tax: DecimalString;
  price_incl_tax: DecimalString;
  vat_rate: DecimalString;
}

/** A live flash sale ("Fırsat Ürünleri"): checkout charges `price` until `ends_at`. */
export interface FlashSaleInfo {
  price: CatalogPrice;
  /** Null when the offer has no deadline: it runs until its stock or the admin ends it. */
  ends_at: ISODateTime | null;
}

/**
 * One buyable colour of a product: the thing stock and the cart are keyed on.
 * A product with colour pills has one per colour, in the admin's order; a
 * colourless one has a single entry whose `color_name` is null.
 */
export interface CatalogVariant {
  id: UUID;
  sku: string;
  /** The "Renk" this variant is; null/absent on a product with no colour axis. */
  color_name?: string | null;
  attributes: Record<string, unknown> | null;
  /**
   * Price for the caller's segment, always in TRY (what the cart charges); null
   * if not sold to that segment, or if a foreign price could not be converted.
   */
  price: CatalogPrice | null;
  /**
   * Set only when that segment's price was entered in USD/EUR: the amount as the
   * admin typed it. `price` is this converted at the day's TCMB rate.
   */
  origin_price?: CatalogPrice | null;
  /** Public RETAIL price. */
  list_price: CatalogPrice | null;
  /** Live sale that beats `price` for this caller; null/absent when none. */
  flash_sale?: FlashSaleInfo | null;
  /**
   * Whether the caller can buy it: stock in their own list's quota (a B2B list
   * never draws on the retail stock). Absent (older API) means unknown → treated as in stock.
   */
  in_stock?: boolean;
  /** How many of it the caller may order — sent to a signed-in caller only; absent or null = no limit to show. */
  available_quantity?: number | null;
}

/** GET /products/sultanpuan: the homepage's Sultan Puan row. */
export interface SultanPuanShowcase {
  enabled: boolean;
  /** The earn rate in percent ("10.00"); the band is one order's subtotal, TRY, bounds included. */
  rate_percent: DecimalString;
  band_min: DecimalString;
  band_max: DecimalString;
  /** Every published product whose current retail price is in the band, cheapest first. */
  products: CatalogProduct[];
}

export interface CatalogProduct extends Product {
  variants: CatalogVariant[];
  /**
   * The languages it is translated into, Turkish first: an English or Arabic
   * page is indexed and linked only where one exists. Its text fields are
   * already in the page's language (the API answers with ?lang=).
   */
  locales?: string[];
}

/** `GET /products/{id}`: the product plus its "birlikte satılanlar". */
export interface CatalogProductDetail extends CatalogProduct {
  /** Priced for the same caller as the product itself; empty when none are pinned. */
  cross_sells?: CatalogProduct[];
  /** Every category it is listed under, the primary one first. */
  category_ids?: number[];
}

// ---- Cart ----

export interface CartItem {
  variant_id: UUID;
  quantity: number;
}

/**
 * Client-side cart line, persisted in the browser. Prices are display-only
 * snapshots; the server re-prices everything in calculate-cart/checkout.
 */
/** A cart colour before a quote (`GET /products/cart-lines`): its page, its code, whether any is left. */
export interface CartLineInfo {
  variant_id: string;
  product_id: string;
  product_slug: string | null;
  sku: string;
  in_stock: boolean;
}

/** A quantity held to the stock (`POST /products/stock-check`): as asked, or the most there is (`capped`). */
export interface StockCheckLine {
  variant_id: string;
  quantity: number;
  capped: boolean;
}

/** The header search's suggestions (`GET /products/suggest`). */
export interface SearchSuggestions {
  /** How many products the full search finds. */
  total: number;
  products: CatalogProduct[];
  categories: { name: string; slug: string }[];
}

export interface CartLineItem extends CartItem {
  product_name: string;
  /** The colour that was added; null/absent on a colourless product. */
  color_name?: string | null;
  /** Snapshot for the cart thumbnail (the server quote's image wins when present). */
  image_url?: string | null;
  price: DecimalString;
  segment_price: DecimalString | null;
}

/**
 * The official billing address of the firm an order is invoiced to.
 *
 * Only what an invoice has to print, and Turkish: a personal order invoiced to
 * a firm is a Turkish tax document. Where the parcel goes is a separate
 * question — see `ShippingAddress`.
 */
export interface InvoiceAddress {
  city: string;
  district: string;
  line: string;
}

/**
 * The firm a retail customer keeps on file to be invoiced instead.
 *
 * Saved from the cart's "Düzenle", so the next order starts filled in. Placing
 * an order does not write it: one order's invoice is not a decision about the
 * account, which is why the order keeps its own frozen copy.
 */
export interface CorporateInvoiceDetails {
  /** Firma Ünvanı: the registered trade name on the tax certificate. */
  company_title: string;
  /** Firma Adı: what it is called day to day; null when that is the ünvan. */
  trade_name: string | null;
  /** Şirket resmi adresi, with its il and ilçe. */
  address: InvoiceAddress;
  tax_office: string;
  /** VKN (10 digits) or a sole proprietor's TCKN (11). */
  tax_number: string;
}

/** The customer is always the authenticated user (from the token), never the body. */
export interface CartCalculateRequest {
  payment_method: PaymentMethod;
  items: CartItem[];
  points_to_redeem?: number;
  shipping_method?: ShippingMethod;
  /** Required to place an order; optional for price previews. */
  shipping_address?: ShippingAddress | null;
  /**
   * "Gönderim ücreti teslimat sırasında alıcı tarafından ödenecektir. Okudum,
   * onayladım." Required to check out whenever the shop does not cover carriage.
   */
  shipping_consent?: boolean;
  /** "Başka biri teslim alacak": both or neither. */
  receiver_name?: string | null;
  receiver_phone?: string | null;
  /** The buyer's own Yurtiçi Kargo agreement; only with a Yurtiçi method. */
  shipping_contract_no?: string | null;
  /** The nakliye ambarı to hand the goods to; only with NAKLIYE_AMBARI. */
  freight_company_name?: string | null;
  freight_phone?: string | null;
  /** "Şubeme istiyorum": the firm's own branch this order is for. It is what
      lets the delivery address be somewhere other than the registered one. */
  shipping_branch_name?: string | null;
  /** "Faturayı firmaya/şirkete istiyorum", and who to make it out to. */
  invoice_to_company?: boolean;
  invoice_company_title?: string | null;
  /** "Firma Adı": what the firm trades under, when that is not its ünvan. */
  invoice_trade_name?: string | null;
  invoice_tax_office?: string | null;
  invoice_tax_number?: string | null;
  /** The firm's official billing address — what the invoice prints. Separate
      from `shipping_address`, even when they name the same place. */
  invoice_address?: InvoiceAddress | null;
  /** "Kart bilgilerimi sonraki alışverişlerim için güvenle kaydet". */
  save_card?: boolean;
  /** "Sipariş Notu" (opsiyonel): the customer's message about this order. */
  order_note?: string | null;
  /** Road, air or sea: required of an export order request, refused of any
      other account. The server decides both (`is_quote_account`). */
  transport_mode?: TransportMode | null;
  /** Both are required to place an order; a price preview needs neither. */
  distance_sales_accepted?: boolean;
  terms_accepted?: boolean;
}

export interface CartItemBreakdown {
  variant_id: UUID;
  product_id?: UUID | null;
  /** For the link to the product's page. */
  product_slug?: string | null;
  sku: string;
  product_name: string;
  /** The colour in the cart; null on a colourless product. */
  color_name?: string | null;
  quantity: number;
  unit_price: DecimalString;
  line_total: DecimalString;
  tags: string[];
  image_url?: string | null;
  /** Percent; `unit_price` and `line_total` include it. */
  vat_rate?: DecimalString;
  /** A B2B line (bayi, toptan, kafe) whose product has that list's havale switch on (whatever the payment). */
  havale_eligible?: boolean;
  /** The havale discount on this line (VAT-inclusive); "0.00" unless paid by transfer. */
  havale_discount?: DecimalString;
  /** How many the buyer may have (their own list's quota) — a firm's account only; null for a bireysel buyer. */
  available_quantity?: number | null;
  /** More in the cart than can be had; the cart says so before checkout. */
  stock_short?: boolean;
}

/** What the "%50 Kuralı" minimum counts: kilograms of coal, or units (adet). */
export type CoalRuleBasis = "kg" | "quantity";

/** Server-priced cart, returned by POST /orders/calculate-cart. */
/** Why shipping is (or isn't) free — lets the cart explain the coal rules. */
export interface ShippingBreakdown {
  /** The shop pays the carrier: nothing is collected from the buyer. */
  free: boolean;
  /** "Karşı ödemeli": the buyer pays the carrier (or courier) on delivery. */
  receiver_pays: boolean;
  /**
   * coal_weight: the "%50 Kuralı" — coal (products with "Sepet Kuralı" on) is
   * over coal_max_ratio of the cart and under the minimum: coal_min_kg, or
   * coal_min_quantity when coal_rule_basis is "quantity".
   * freight: a nakliye ambarı, which collects its own fee from the receiver.
   * international: freight and customs, quoted after the order.
   * tier_price: a B2B account, whose price list does not include carriage, so
   * the free-shipping threshold never applies to it.
   */
  reason: "free" | "below_threshold" | "coal_weight" | "freight" | "international" | "tier_price";
  free_threshold: DecimalString;
  coal_total: DecimalString;
  /** Coal share of the subtotal, 0..1. */
  coal_ratio: DecimalString;
  coal_max_ratio: DecimalString;
  coal_weight_kg: DecimalString;
  coal_min_kg: DecimalString;
  /** Some coal in the cart has no recorded weight (counts as 0 kg). */
  coal_weight_unknown: boolean;
  /** Which minimum the rule applies: kilograms or units (adet). */
  coal_rule_basis: CoalRuleBasis;
  /** Units of coal in the cart. */
  coal_quantity: number;
  coal_min_quantity: number;
}

export interface Cart {
  subtotal: DecimalString;
  /**
   * Whether this account gets the retail promotions (Sultan Puan, the ciro and
   * havale discounts). False means every discount below is zero by rule: a B2B
   * account pays its tier price net.
   */
  perks_eligible: boolean;
  cargo_cost: DecimalString;
  shipping: ShippingBreakdown;
  /** Volume ("ciro") discount, on the subtotal. */
  volume_discount_rate: DecimalString;
  volume_discount_amount: DecimalString;
  /** The next volume tier not yet reached; null at the top tier. */
  volume_next_tier: { threshold: DecimalString; rate: DecimalString } | null;
  /** Bank transfer (havale/EFT) discount, after the volume discount. */
  discount_rate: DecimalString;
  discount_amount: DecimalString;
  points_discount: DecimalString;
  net_total: DecimalString;
  /**
   * The VAT inside the merchandise, for a business invoice: the lines before
   * VAT, the VAT on them, and the rates involved. Exact for a B2B cart, which
   * carries no promotional discounts.
   */
  subtotal_excl_tax?: DecimalString;
  /** A B2B account's line discounts (havale) before VAT; subtotal_excl_tax − this + vat_total = the lines' total. */
  line_discount_excl_tax?: DecimalString;
  vat_total?: DecimalString;
  vat_rates?: DecimalString[];
  loyalty_points_to_earn: number;
  payment_method: PaymentMethod;
  items: CartItemBreakdown[];
}

// ---- Orders ----

export type CheckoutRequest = CartCalculateRequest;

export interface OrderItem {
  id: number;
  variant_id: UUID;
  quantity: number;
  unit_price: DecimalString;
  line_total: DecimalString;
}

export interface Order {
  id: UUID;
  order_number: string;
  user_id: UUID;
  total_amount: DecimalString;
  shipping_cost: DecimalString;
  discount_amount: DecimalString;
  payment_method: PaymentMethod;
  status: OrderStatus;
  tracking_code: string | null;
  /** The shipment, once it has left ("Kargola"). Null on orders shipped before these were kept. */
  carrier?: Carrier | null;
  carrier_name?: string | null;
  /** The carrier's own page for the tracking code. */
  tracking_url?: string | null;
  shipped_at?: ISODateTime | null;
  /** Yurtiçi web service: our reference (the label's barcode) and its last word on the parcel. */
  cargo_key?: string | null;
  carrier_status?: string | null;
  carrier_status_text?: string | null;
  carrier_synced_at?: ISODateTime | null;
  shipping_method: ShippingMethod;
  /** Who pays the carriage. `shipping_cost` is always "0.00": it is never charged. */
  shipping_payer: ShippingPayer;
  /** When the buyer accepted paying the carrier; null when the shop pays. */
  shipping_consent_at: ISODateTime | null;
  /** Null on orders from before addresses were collected. */
  shipping_address: ShippingAddress | null;
  /** "Başka biri teslim alacak": who signs for the parcel, when not the buyer. */
  receiver_name: string | null;
  receiver_phone: string | null;
  /** What the buyer asked for: their Yurtiçi agreement, or the ambar to use. */
  shipping_contract_no: string | null;
  freight_company_name: string | null;
  freight_phone: string | null;
  /** The firm's own branch this order went to, when not the invoice address. */
  shipping_branch_name: string | null;
  /** Who the invoice is made out to, when it is not the customer themselves. */
  invoice_to_company: boolean;
  invoice_company_title: string | null;
  invoice_trade_name: string | null;
  invoice_tax_office: string | null;
  invoice_tax_number: string | null;
  /** The firm's registered address, as this order recorded it. */
  invoice_address: InvoiceAddress | null;
  save_card: boolean;
  /** "Sipariş Notu": what the customer wrote at checkout, as they wrote it. */
  order_note: string | null;
  /** An export order request: priced at export rates, charged nothing, and no
      stock taken until someone agrees a freight price with the customer. */
  is_quote?: boolean;
  transport_mode?: TransportMode | null;
  /** When the two agreements were accepted; no order is placed without them. */
  agreements_accepted_at: ISODateTime | null;
  paid_at: ISODateTime | null;
  cancelled_at: ISODateTime | null;
  cancel_reason: string | null;
  created_at: ISODateTime;
  items: OrderItem[];
}

// ---- Errors ----

/** FastAPI error body: `detail` is a string, or a list for 422 validation errors. */
export interface ApiError {
  detail:
    | string
    | { loc: (string | number)[]; msg: string; type: string }[];
}

// ---- Site / admin ----

/** A preset name, or a custom "#rrggbb" colour. */
export type BannerBackgroundStyle = "crimson_gradient" | "dark_luxury" | "festive_red" | (string & {});
/** Mood icon beside the banner text. */
export type BannerIcon = "celebration" | "memorial" | "campaign" | "none";

export interface Announcement {
  message: string;
  is_active: boolean;
  /** The banner hides itself once this passes; null = no expiry. */
  expires_at: ISODateTime | null;
  show_countdown: boolean;
  background_style: BannerBackgroundStyle;
  bg_image_url: string | null;
  icon_type: BannerIcon;
  updated_at: ISODateTime | null;
}

export type AnnouncementUpdate = Omit<Announcement, "updated_at">;

/**
 * A "Hazır metin" for the special-day banner. With `is_scheduled` on, the
 * banner shows it by itself from `starts_at` until `ends_at`.
 */
export interface BannerPreset {
  id: number;
  message: string;
  icon_type: BannerIcon;
  starts_at: ISODateTime | null;
  ends_at: ISODateTime | null;
  is_scheduled: boolean;
  sort_order: number;
  updated_at: ISODateTime | null;
}

export type BannerPresetWrite = Omit<BannerPreset, "id" | "updated_at">;

export type MessageChannel = "email" | "sms";
/** "all", a segment code, or "manual" (addresses typed in). */
export type CampaignAudience = "all" | "RETAIL" | "CAFE" | "WHOLESALE" | "DEALER" | "manual";

/** A bulk e-mail / SMS from "SMS & Mail". */
export interface Campaign {
  id: number;
  channel: MessageChannel;
  audience: CampaignAudience;
  subject: string | null;
  body: string;
  body_format: "text" | "html";
  sms_segments: number | null;
  /** queued → sending → done, or failed when nothing could be sent. */
  status: "queued" | "sending" | "done" | "failed";
  total: number;
  sent: number;
  failed: number;
  created_at: ISODateTime;
  finished_at: ISODateTime | null;
}

export interface CampaignCreate {
  channel: MessageChannel;
  audience: CampaignAudience;
  manual_recipients: string[];
  consent_confirmed: boolean;
  subject: string | null;
  body: string;
  body_format: "text" | "html";
}

/** One e-mail or SMS sent, whatever sent it. */
export interface NotificationLogEntry {
  id: number;
  channel: MessageChannel;
  recipient: string;
  purpose: string;
  campaign_id: number | null;
  subject: string | null;
  /** The driver: "smtp", "resend", "netgsm"…, or "mock" (not actually sent). */
  provider: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  created_at: ISODateTime;
  sent_at: ISODateTime | null;
}

export interface AudienceCount {
  key: CampaignAudience;
  label: string;
  /** Customers in the group. */
  total: number;
  /** Of them: consent given and reachable on the channel. */
  eligible: number;
}

export interface CommunicationDrivers {
  email: string;
  sms: string;
  sms_opt_out_text: string;
}

// ── SMS Ayarları (mirrors app/schemas/communication.py) ──────────────────────

export type OrderSmsEvent = "order_placed" | "order_shipped";

export interface SmsTemplate {
  enabled: boolean;
  text: string;
}

export interface SmsSettings {
  usercode: string;
  header: string;
  /** The password itself never comes back. */
  password_set: boolean;
  /** What the server's .env supplies for a field left blank here. */
  env_usercode: string;
  env_header: string;
  env_password_set: boolean;
  /** The driver that sends now: "netgsm", or "mock" when nothing leaves. */
  provider: string;
  order_placed: SmsTemplate;
  order_shipped: SmsTemplate;
  placeholders: Record<OrderSmsEvent, string[]>;
}

export interface SmsSettingsWrite {
  usercode: string;
  header: string;
  /** Omitted / null keeps the stored password. */
  password?: string | null;
  clear_password?: boolean;
  order_placed: SmsTemplate;
  order_shipped: SmsTemplate;
}

export interface SmsTestResult {
  ok: boolean;
  provider: string;
  error: string | null;
}

/** A note in the admin's "Not Defteri"; only its author sees it. */
export interface AdminNote {
  id: number;
  title: string;
  body: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type AdminNoteWrite = Pick<AdminNote, "title" | "body">;

/** "Açılış duyurusu": the card shown once when a visitor lands on the storefront. */
export interface PopupAnnouncement {
  title: string;
  message: string;
  is_active: boolean;
  /** Shown from here; null = at once. */
  starts_at: ISODateTime | null;
  /** Hidden from here; null = no end. */
  ends_at: ISODateTime | null;
  /** A visitor's dismissal is remembered against this, so an edited popup shows again. */
  updated_at: ISODateTime | null;
}

export type PopupAnnouncementUpdate = Omit<PopupAnnouncement, "updated_at">;

export interface Segment {
  id: number;
  code: SegmentType;
  label: string;
}

export interface AdminVariantPrice {
  segment_id: number;
  currency: CurrencyType;
  price_excl_tax: DecimalString;
  price_incl_tax: DecimalString;
  vat_rate: DecimalString;
}

export interface AdminVariant {
  id: UUID;
  sku: string;
  /** The "Renk" this variant is; null on a product with no colour axis. */
  color_name?: string | null;
  attributes: Record<string, unknown> | null;
  cost_price: DecimalString | null;
  /** kg per unit (coal's 20 kg free-shipping rule); null = unknown. */
  weight_kg: DecimalString | null;
  prices: AdminVariantPrice[];
  inventory: { id: number; warehouse_type: WarehouseType; quantity: number }[];
}

// ── Product sheet ("Ürün Ekle / Düzenle") ────────────────────────────────────

/** Sheet column order: Bayi, Toptan, Kafe, Perakende. */
export type SheetSegment = "DEALER" | "WHOLESALE" | "CAFE" | "RETAIL";

export interface SheetStock {
  bayi: number;
  toptan: number;
  kafe: number;
  perakende: number;
}

/**
 * One colour of the product, with the four quotas that colour sells from.
 *
 * `color` is null on the single "Standart" variant a colourless product has.
 * `id` names a variant that already exists, which is how renaming a colour keeps
 * its stock instead of starting a new one; it is absent on a colour just added.
 */
export interface SheetVariant {
  id?: UUID | null;
  color: string | null;
  /** Derived server-side from the product code; read-only. */
  sku?: string | null;
  stock: SheetStock;
}

/** One cell of the price matrix; both sides empty means "not sold at this price". */
export interface SheetPriceCell {
  price_excl_tax?: DecimalString | null;
  price_incl_tax?: DecimalString | null;
  /** The KDV rate the form applied; the server derives it when absent. */
  vat_rate?: DecimalString | null;
}

export interface SheetPriceRow {
  currency: CurrencyType;
  cells: Partial<Record<SheetSegment, SheetPriceCell>>;
}

export interface SheetRules {
  is_free_shipping: boolean;
  /** "Adet şartı": free carriage only from this many units; null = no condition. */
  free_shipping_min_quantity?: number | null;
  has_havale_discount: boolean;
  /** "Bayide / Toptanda / Kafede Havale / EFT İndirimi": the havale/EFT discount for that B2B list too, line by line; off by default. */
  has_dealer_havale_discount: boolean;
  has_toptan_havale_discount: boolean;
  has_cafe_havale_discount: boolean;
  /** "Ciro indirimi": counts towards, and is discounted by, the volume tiers. */
  has_volume_discount: boolean;
  gives_points: boolean;
  can_use_points: boolean;
  /** "Sepet Kuralı": the product counts as coal for the cargo rule (its category plays no part). */
  is_cart_rule_applied: boolean;
}

export interface SheetOpportunity {
  is_opportunity: boolean;
  opportunity_price?: DecimalString | null;
  opportunity_stock?: number | null;
  /** ISO datetime, in the future. Null: the offer runs until its stock runs out. */
  opportunity_end_date?: ISODateTime | null;
  opportunity_color?: string | null;
  /** The same rules, as they apply while the deal runs. */
  opp_is_free_shipping: boolean;
  opp_free_shipping_min_quantity?: number | null;
  opp_has_havale_discount: boolean;
  opp_has_volume_discount: boolean;
  opp_gives_points: boolean;
  opp_can_use_points: boolean;
}

/** Sortable columns of the admin products table. */
export type ProductSort = "code" | "name" | "stock" | "price";
export type SortDirection = "asc" | "desc";

/** What a bulk delete managed; `refused` maps a product id to why it was kept. */
export interface ProductDeleteResult {
  deleted: UUID[];
  refused: Record<UUID, string>;
}

/** A pinned "birlikte satılan" product, as the form's preview card shows it. */
export interface CrossSellCard {
  id: UUID;
  base_code: string;
  name: string;
  image_url: string | null;
  /** The public (RETAIL) price as entered; null when the product has no price. */
  price_incl_tax: DecimalString | null;
  currency: CurrencyType | null;
}

export interface ProductSheet {
  base_code: string;
  name: string;
  brand?: string | null;
  /** Every category the product is listed under, the primary (breadcrumb) one first. */
  category_ids?: number[];
  /** The primary category: the first of `category_ids`, kept in step by the server. */
  category_id?: number | null;
  /** "Renk" labels, in the order the admin added them; one buyable colour each. */
  color_names: string[];
  description?: string | null;
  /** Overrides the product page <title>; blank falls back to the product name. */
  meta_title?: string | null;
  /** Overrides its meta description; blank falls back to `description`. */
  meta_description?: string | null;
  /**
   * "Çeviriler": the product in English and Arabic (/en/…, /ar/…). Sent, it
   * replaces what is stored — a language left out is removed; omitted, kept.
   */
  translations?: Partial<Record<TranslatedLocale, ProductTranslation>> | null;
  /** The page's address, /product/<slug>; blank keeps the current one (a new product's comes from its name). */
  slug?: string | null;
  /** Gallery in order; the server mirrors the first one into `image_url`. */
  image_urls: string[];
  youtube_video_url?: string | null;
  /** Defaults to `base_code` on the server. */
  sku?: string | null;
  /** Unit weight in kg (the coal free-shipping rule); null = not recorded. */
  weight_kg?: DecimalString | null;
  is_published: boolean;
  /**
   * The four quotas as one block. On a colourless product it *is* the stock; on a
   * coloured one the server reads it back as the total across the colours, and
   * `variants` is what a save sets.
   */
  stock: SheetStock;
  /** One block of quotas per colour, in `color_names` order. */
  variants: SheetVariant[];
  prices: SheetPriceRow[];
  rules: SheetRules;
  opportunity: SheetOpportunity;
  /** "Birlikte satılanlar", in the admin's order; at most four. */
  related_product_ids: UUID[];
}

export interface SavedProductSheet extends ProductSheet {
  id: UUID;
  /** The first colour's variant (the only one on a colourless product). */
  variant_id: UUID;
  sku: string;
  stock_total: number;
  /** The pinned products themselves, same order as `related_product_ids`. */
  related_products: CrossSellCard[];
}

/** What `POST /admin/uploads` gives back for each stored file. */
export interface UploadedImage {
  url: string;
  path: string;
}

export interface AdminProduct {
  id: UUID;
  base_code: string;
  name: string;
  brand: string | null;
  category_id: number | null;
  tags: string[] | null;
  image_url: string | null;
  /** Off the storefront while false; toggled per row in the products list. */
  is_published: boolean;
  variants: AdminVariant[];
}

/** An order line with the catalogue data the admin order sheet prints. */
export interface AdminOrderItem extends OrderItem {
  /** Null when the variant (or its price row) was deleted after the order. */
  sku: string | null;
  product_code: string | null;
  product_name: string | null;
  /** The colour that was sold; null on a colourless product. */
  color_name?: string | null;
  /** Percent, e.g. "18.00"; `unit_price` already includes it. */
  vat_rate: DecimalString | null;
}

export interface AdminOrder extends Omit<Order, "items"> {
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  /** From the customer's company profile (B2B); null for retail buyers. */
  company_title: string | null;
  /** Free-form on the server, so every field is optional here. */
  billing_address: (Partial<ShippingAddress> & { country?: string | null }) | null;
  items: AdminOrderItem[];
}

export interface OrderApproveResponse {
  order_id: UUID;
  order_number: string;
  new_status: OrderStatus;
  loyalty_points_awarded: number;
  message: string;
  paid_at: ISODateTime | null;
}

/** Display-only TCMB rates: TRY per 1 unit (an amount in TRY / rate = amount in that currency). */
export interface ExchangeRates {
  base: "TRY";
  source: "TCMB";
  bulletin_date: string;
  rates: Record<"USD" | "EUR", DecimalString>;
}

export interface AdminFlashSale {
  id: number;
  variant_id: UUID;
  sku: string;
  product_name: string;
  /** Which colour is on offer; null on a colourless product. */
  color_name?: string | null;
  sale_price_incl_tax: DecimalString;
  regular_price_incl_tax: DecimalString | null;
  starts_at: ISODateTime;
  /** None: no deadline (runs until switched off). */
  ends_at: ISODateTime | null;
  is_active: boolean;
  is_live: boolean;
}

export interface AdminFlashSaleWrite {
  sku: string;
  sale_price_incl_tax: DecimalString;
  starts_at: ISODateTime;
  ends_at: ISODateTime | null;
  is_active: boolean;
}

// ── Homepage CMS (/home/content, /admin/hero-slides|promo-boxes) ──────────────

/** Content shown only while something exists (e.g. a live flash sale). */
export type ContentRequirement = "flash_sales";

/** The named sizes the editor's first version saved (sm 14px … 7xl 72px); read as their pixels. */
export type HeroFontSize = "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

/**
 * Per text, its size in px on the widest slider (8–160), set by dragging the
 * text's corner in the editor; one left out (null) keeps the slide's own.
 */
export interface HeroTextSizes {
  eyebrow?: number | null;
  title?: number | null;
  subtitle?: number | null;
}

/** Per text, "#rrggbb"; one left out (null) keeps the slide's own. */
export interface HeroTextColors {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
}

/** The photo's crop on a phone: focal point (0–100 %) and zoom (100 = fills the slide). */
export interface HeroBgPosition {
  x: number;
  y: number;
  zoom: number;
}

export interface HeroSlideContent {
  id: number;
  eyebrow: string;
  /** May run over several lines ("\n"), as may the subtitle. */
  title: string;
  subtitle: string;
  /** Empty: the slide has no button. */
  cta_label: string;
  cta_href: string;
  guest_cta_label: string | null;
  guest_cta_href: string | null;
  /** Resolved image: uploaded file URL, else external URL, else null. */
  image: string | null;
  image_url: string | null;
  has_upload: boolean;
  requires: ContentRequirement | null;
  /** The text block's alignment over the slide. */
  text_align: HeroTextAlign;
  /** The photo's focal point, 0–100 % across and down. */
  image_focus_x: number;
  image_focus_y: number;
  /** 100 = fills the slide; up to 200 crops in. */
  image_zoom: number;
  /** Free positions of the four parts on a wide screen; null = centred stack. */
  layout: HeroLayout | null;
  /** The dark wash (30%) over the photo; off, the photo shows as it is. */
  enable_overlay: boolean;
  font_sizes: HeroTextSizes | null;
  text_colors: HeroTextColors | null;
  /**
   * A phone's own design (below 768px), apart from the wide screen's: the
   * parts' positions on a 4:5 stage, the texts' sizes (px on a 375px-wide
   * stage), the photo's crop. Null: as a phone has always shown the slide.
   */
  mobile_layout: HeroLayout | null;
  mobile_font_sizes: HeroTextSizes | null;
  mobile_bg_position: HeroBgPosition | null;
  /** The portrait photo phones show in place of the wide one; null: the wide one, cropped. */
  mobile_image: string | null;
  /** Its buttons' size from a tablet up, and on a phone; "md" = the shop's own. */
  button_size_desktop: HeroButtonSize;
  button_size_mobile: HeroButtonSize;
  is_active: boolean;
  sort_order: number;
}

export type HeroTextAlign = "left" | "center" | "right";

export type HeroPart = "eyebrow" | "title" | "subtitle" | "button";

/** Each part's centre, in % of the slide's width (x) and height (y). */
export type HeroLayout = Record<HeroPart, { x: number; y: number }>;

/** The "social" card's channels (left half) and its jump button's text (right half, linking to `href`). */
export interface SocialWidget {
  instagram_href: string | null;
  instagram_label: string;
  youtube_href: string | null;
  youtube_label: string;
  anchor_label: string;
}

/** The promo box beside the hero ("Sosyal & Avantaj"): its top band jumps to `href`, its bottom band lists the channels. */
export interface PromoBoxContent {
  id: number;
  eyebrow: string;
  title: string;
  text: string | null;
  href: string;
  requires: ContentRequirement | null;
  widget: SocialWidget | null;
  /** The community card's photo (a site path or an http(s) URL); null = the shop's own. */
  top_card_image_url: string | null;
  /** Where its crop centres across it, 0–100 (0 = its left edge). */
  top_card_focus_x: number;
  /** The advantages card's photo; null = the shop's own. */
  bottom_card_image_url: string | null;
  bottom_card_focus_x: number;
  is_active: boolean;
  sort_order: number;
}

export interface HomeContent {
  slides: HeroSlideContent[];
  promos: PromoBoxContent[];
}

export type HeroSlideWrite = Omit<HeroSlideContent, "id" | "image" | "has_upload">;
export type PromoBoxWrite = Omit<PromoBoxContent, "id"> & { widget: SocialWidget };

// ── Wallet (Sultan Puan), bank accounts, admin customers ─────────────────────

/**
 * Where a ledger row came from. The names predate the "Sultan Puan" rename and
 * are kept so old rows read the same: PARAPUAN is a standard Sultan Puan award,
 * KUMBARA the annual bonus (formerly Kumbarapuan).
 */
export type PointSource = "PARAPUAN" | "KUMBARA" | "CHECKOUT" | "ADMIN";

export interface WalletLot {
  source: PointSource | null;
  amount: number;
  remaining: number;
  earned_at: ISODateTime;
  expires_at: ISODateTime | null;
}

export interface WalletEntry {
  id: UUID;
  created_at: ISODateTime;
  /** Signed: + earned / added, − spent / removed. */
  points: number;
  kind: "EARNED" | "SPENT" | "ADJUSTMENT" | "EXPIRED";
  source: PointSource | null;
  note: string | null;
  order_number: string | null;
  expires_at: ISODateTime | null;
  /** Spending on an order that was later cancelled: the points came back. */
  void: boolean;
}

export interface Wallet {
  balance: number;
  /** Points expiring within 30 days. */
  expiring_soon: number;
  /** The program's switch: off means nothing is earned or spent (the balance is kept). */
  enabled: boolean;
  /** TRY per point. */
  conversion_rate: DecimalString;
  lots: WalletLot[];
  milestone: LoyaltyMilestone;
  history: WalletEntry[];
}

/** Progress toward the annual Sultan Puan bonus. */
export interface LoyaltyMilestone {
  /** Paid spending counted so far: within the window, after the last bonus. */
  spent: DecimalString;
  target: DecimalString;
  remaining: DecimalString;
  bonus_points: number;
  period_days: number;
  /** Orders of this subtotal or more do not count; "0" = every order counts. */
  order_ceiling: DecimalString;
  counting_since: ISODateTime;
  /** The count restarted at a bonus inside the window, not at its start. */
  restarted: boolean;
}

export interface BankAccount {
  id: number;
  bank_name: string;
  account_holder: string;
  /** "TR" + 24 digits, no spaces. */
  iban: string;
  branch: string | null;
  is_active: boolean;
  sort_order: number;
}

export type BankAccountWrite = Omit<BankAccount, "id">;

/** Which kind of address a stored row is; both are invoice addresses. */
export type AddressKind = "BILLING" | "CORPORATE_BILLING";
/** Sortable columns of the admin customers grid. */
export type CustomerSort = "name" | "created" | "orders";

/** One row of the customers grid. */
export interface AdminCustomer {
  id: UUID;
  email: string;
  full_name: string | null;
  /** Ünvan, when the account is a firm's or is invoiced as one. */
  company_title: string | null;
  account_type: AccountType;
  phone: string | null;
  segment: SegmentType | null;
  order_count: number;
  created_at: ISODateTime;
  /** From their invoice address: şehir and ilçe at home, the country abroad. */
  city: string | null;
  district: string | null;
  /** ISO 3166-1 alpha-2; "TR" for a domestic address. */
  country: string | null;
}

/**
 * A stored address, in whichever shape it was given: the Turkish fields or the
 * international ones are filled, never both.
 */
export interface AdminCustomerAddress {
  kind: AddressKind;
  /** ISO 3166-1 alpha-2; "TR" for a domestic address. */
  country: string;
  city: string;
  neighbourhood: string | null;
  street: string | null;
  building_no: string | null;
  building_name: string | null;
  door_no: string | null;
  district: string | null;
  postal_code: string | null;
  address_line1: string | null;
  address_line2: string | null;
}

/** Everything sign-up asked beyond the login. */
export interface AdminCustomerProfile {
  national_id: string | null;
  billing_entity_type: BillingEntity | null;
  company_title: string | null;
  tax_plate_name: string | null;
  tax_office: string | null;
  tax_number: string | null;
  international_kind: InternationalKind | null;
  contact_name: string | null;
}

/** One customer in full, for their admin page. */
export interface AdminCustomerDetail {
  id: UUID;
  email: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  landline_phone: string | null;
  account_type: AccountType;
  is_active: boolean;
  is_verified: boolean;
  created_at: ISODateTime;
  segment: SegmentType | null;
  order_count: number;
  loyalty_balance: number;
  profile: AdminCustomerProfile | null;
  addresses: AdminCustomerAddress[];
  /** Their standing Kafe/Toptan/Bayi request, decided from the applications queue. */
  application_status: string | null;
  requested_segment: SegmentType | null;
}

// ── B2B applications & admin dashboard ───────────────────────────────────────

export type B2BSegment = "CAFE" | "WHOLESALE" | "DEALER";

export interface B2BApplicationInput {
  segment: B2BSegment;
  company_title: string;
  /** VKN (10 digits) or TCKN (11). */
  tax_number: string;
  tax_office?: string | null;
}

export interface B2BApplication {
  id: number;
  user_id: UUID;
  email: string;
  full_name: string | null;
  requested_segment: SegmentType;
  company_title: string;
  tax_number: string;
  tax_office: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_note: string | null;
  created_at: ISODateTime;
  decided_at: ISODateTime | null;
}

export interface PeriodTotals {
  order_count: number;
  order_total: DecimalString;
  card_total: DecimalString;
  transfer_total: DecimalString;
}

/** Genel Bakış: paid orders only, by payment date, Turkey time. */
export interface AdminDashboardData {
  usd_try: DecimalString | null;
  eur_try: DecimalString | null;
  rates_date: string | null;
  member_count: number;
  pending_applications: number;
  /** Today since 00:00 (Turkey time). */
  daily: PeriodTotals;
  weekly: PeriodTotals;
  monthly: PeriodTotals;
  yearly: PeriodTotals;
}

/**
 * The shipping numbers the admin panel sets, read by the cart without a login.
 *
 * The limit is a Decimal string like every other amount: the server is the
 * authority on money, and the cart formats what it is given.
 */
export interface ShippingSettings {
  /** "İstanbul İçi B2B Ücretsiz Teslimat Alt Limiti (TL)"; ₺20.000 by default. */
  istanbul_free_min_subtotal: DecimalString;
}

/** One rung of a discount ladder: from `threshold` TRY of subtotal, `rate` (0..1) off. */
export interface ParameterTier {
  threshold: DecimalString;
  rate: DecimalString;
}

/**
 * "Parametreler": the checkout's commercial rules, set in the admin panel and
 * read by the storefront without a login. Rates are fractions, as the cart
 * reports them ("0.05" is %5).
 */
export interface StoreParameters {
  /** Retail carts from this subtotal ship on the shop. */
  free_shipping_threshold: DecimalString;
  /** "%50 Kuralı": a coal-dominant cart ships free only from this much coal (kg), when it counts kilograms. */
  coal_min_kg: DecimalString;
  /** Coal worth more than this share (0..1) of the subtotal makes a cart coal-dominant. */
  coal_max_ratio: DecimalString;
  /** Which minimum the rule applies — only that one: coal_min_kg or coal_min_quantity. */
  coal_rule_basis: CoalRuleBasis;
  /** The minimum in units (adet), when the rule counts units. */
  coal_min_quantity: number;
  /** Havale/EFT: judged on the subtotal, applied after the ciro discount. Ascending. */
  bank_transfer_tiers: ParameterTier[];
  /** "Ciro indirimi", on the subtotal. Ascending. */
  volume_tiers: ParameterTier[];
  loyalty: LoyaltyParameters;
  /** "İstanbul İçi B2B Ücretsiz Teslimat Alt Limiti (TL)"; "0" = every İstanbul order. */
  istanbul_free_min_subtotal: DecimalString;
}

/** Sultan Puan: how points are earned, what they are worth, the annual bonus. */
export interface LoyaltyParameters {
  enabled: boolean;
  /** Standard award: this fraction of a single paid order's subtotal… */
  base_rate: DecimalString;
  /** …for orders from band_min to band_max TRY inclusive. */
  band_min: DecimalString;
  band_max: DecimalString;
  /** 1 Sultan Puan = this many TRY. */
  conversion_rate: DecimalString;
  annual_spend_threshold: DecimalString;
  annual_bonus_points: number;
  annual_period_days: number;
  /** Orders of this subtotal or more don't count toward the annual target; "0" = all count. */
  annual_order_ceiling: DecimalString;
}

/** Which legal text. PRIVACY_NOTICE is the short framed notice in the cart. */
export type LegalKey = "PRIVACY_NOTICE" | "PRIVACY" | "DISTANCE_SALES" | "TERMS" | "COOKIES";

export interface LegalDocument {
  key: LegalKey;
  title: string;
  /** Plain text with `## ` headings and blank-line paragraphs. */
  body: string;
  updated_at: ISODateTime | null;
  /** False while this is still the text the shop was set up with. */
  edited: boolean;
}

// ── Ana Sayfa Düzenleme (homepage editor document) ───────────────────────────
// Mirrors app/schemas/homepage.py. The API returns only the sections the admin
// has saved; `lib/homepage` fills the rest from the storefront's defaults.

export type HomeIconKey =
  | "wind" | "wrench" | "flame" | "layers" | "sparkles" | "shield" | "package" | "gamepad"
  | "truck" | "bike" | "credit-card" | "landmark" | "trending-up" | "badge-check" | "headset" | "store"
  | "shopping-cart" | "trending-down";

export interface HomeSections {
  hero: boolean;
  perks: boolean;
  brands_top: boolean;
  picks: boolean;
  lules: boolean;
  sultanpuan: boolean;
  kumbara: boolean;
  /** "Görsel Vitrin": two tabs of photo boxes over the deals. */
  bento: boolean;
  deals: boolean;
  campaigns: boolean;
  /** "Sektörde Referans Noktası" (the key is older than the section). */
  promos: boolean;
  brands: boolean;
  brand_showcase: boolean;
  kozlukler: boolean;
  games: boolean;
  showcase: boolean;
  /** Retired: the "Hacim büyür" grid is on no page now. */
  advantages: boolean;
  about: boolean;
  footer: boolean;
}

/** A homepage section the admin can move ("Bölümler"); see lib/homeBlocks. */
export type HomeBlock =
  | "perks"
  | "brands_top"
  | "picks"
  | "lules"
  | "sultanpuan"
  | "kumbara"
  | "bento"
  | "deals"
  | "campaigns"
  | "promos"
  | "brands"
  | "brand_showcase"
  | "kozlukler"
  | "games"
  | "showcase"
  | "about";

/** A menu entry: a category (`slug`), a brand, or a link of its own; else a search for its label. */
export interface HomeNavItem {
  label: string;
  slug?: string | null;
  brand?: string | null;
  search?: string | null;
  href?: string | null;
  accent?: boolean;
  /** false = kept in the list but not shown on the storefront. */
  enabled?: boolean;
}

export interface HomeShowcaseTile extends HomeNavItem {
  eyebrow: string;
  wide: boolean;
  icon: HomeIconKey;
  /** Overrides the product photo the tile otherwise borrows from its category. */
  image?: string | null;
}

export interface HomeAdvantageCard {
  badge: string;
  title: string;
  description: string;
  note: string;
  image?: string | null;
  icon: HomeIconKey;
}

export interface HomeFooterLink {
  label: string;
  href: string;
}

export interface HomeFooterColumn {
  title: string;
  links: HomeFooterLink[];
  cta_label: string;
  cta_href?: string | null;
}

export type HomeSocialKind = "youtube" | "instagram" | "facebook" | "tiktok" | "x" | "link";

export interface HomeFooter {
  brand_name: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp_href: string;
  branches: { name: string; address: string }[];
  hours: string;
  social: { label: string; href: string; kind: HomeSocialKind }[];
  blog: HomeFooterColumn;
  info: HomeFooterColumn;
  faq: HomeFooterColumn;
  copyright: string;
  price_note: string;
  warning: string;
}

/**
 * The sections' own copy in "Ana Sayfa Düzenleme" (app/schemas/homepage.py).
 * A text may hold a placeholder the storefront fills with a live figure:
 * {tutar} (an amount), {oran} (a rate), {bant} (the SultanPuan band).
 */
export interface HomePerk {
  icon: HomeIconKey;
  label: string;
  note: string;
}

/** "Avantaj Çubuğu": the installments' figure is typed; the two discounts' are live from "Parametreler". */
export interface HomePerks {
  installments: HomePerk & { value: string };
  volume: HomePerk;
  transfer: HomePerk;
}

export interface HomePicks {
  title: string;
  subtitle: string;
  bestsellers: string;
  newest: string;
  shipping_eyebrow: string;
  /** {tutar}: the free-shipping threshold. */
  shipping_text: string;
}

export interface HomeLules {
  title: string;
  kinds: string[];
  closing: string;
  more: string;
  href: string;
  courier_eyebrow: string;
  courier_text: string;
}

export interface HomeLoyaltyCopy {
  subtitle: string;
  note: string;
  call: string;
}

export interface HomeCampaignBox {
  title: string;
  subtitle: string;
  href: string;
  /** A photo behind the words; without one, the box keeps its gradient. */
  image?: string | null;
}

export interface HomeCampaigns {
  lead: HomeCampaignBox & { eyebrow: string; cta: string };
  /** Always three: two side by side, one across both. */
  minis: HomeCampaignBox[];
}

/** A text on a "Görsel Vitrin" box, as on a hero slide. */
export type HomeBoxText = "eyebrow" | "title" | "subtitle";

/** One box of "Görsel Vitrin": a photo with words on it, placed and styled as a hero slide's. */
export interface HomeBentoBox {
  image: string;
  href: string;
  /** For screen readers and search engines; the words on the box may not name the photo. */
  alt: string;
  /** The photo's focal point, 0–100 (0 = its left / top edge). */
  focus_x: number;
  focus_y: number;
  /** Each optional; line breaks kept. */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Each text's centre in % of the box; null = stacked at the bottom. */
  layout: Record<HomeBoxText, { x: number; y: number }> | null;
  /** Px on a 400px-wide box; the box keeps its 3:2 shape, so they scale with it. */
  font_sizes: Partial<Record<HomeBoxText, number | null>> | null;
  text_colors: Partial<Record<HomeBoxText, string | null>> | null;
  /** A dark wash from the bottom, at `overlay_strength` % at its darkest. */
  overlay: boolean;
  overlay_strength: number;
}

export interface HomeBento {
  /** Always three, side by side. */
  boxes: HomeBentoBox[];
}

export interface HomeStatement {
  heading: string;
  lead: string;
  rest: string;
}

export interface HomeBrandBlurb {
  description: string;
  /** In place of the shop's own logo file. */
  logo?: string | null;
}

export interface HomeBrandShowcase {
  heading: string;
  collection: string;
  sultan: HomeBrandBlurb;
  oduman: HomeBrandBlurb;
  legend: HomeBrandBlurb;
}

export interface HomeProductRowCopy {
  title: string;
  subtitle: string;
  more: string;
}

/** The hero slider's buttons: a size down, the shop's own, a size up. */
export type HeroButtonSize = "sm" | "md" | "lg";

export interface Homepage {
  sections: HomeSections;
  /** The sections' order between the hero and the footer. */
  order: HomeBlock[];
  navigation: { top: HomeNavItem[]; sidebar: HomeNavItem[] };
  deals: { title: string; subtitle: string };
  brands: { items: string[] };
  showcase: { title: string; subtitle: string; tiles: HomeShowcaseTile[] };
  advantages: { eyebrow: string; title: string; subtitle: string; cards: HomeAdvantageCard[] };
  /** "Alt SEO Metni": the passage closing the homepage and catalog pages; an empty field means the default's. */
  seo_intro: HomeSeoIntro;
  footer: HomeFooter;
  /** "Mobil Yönetim": what a phone shows differently. */
  mobile: HomeMobile;
  perks: HomePerks;
  picks: HomePicks;
  lules: HomeLules;
  sultanpuan: HomeLoyaltyCopy;
  kumbara: HomeLoyaltyCopy;
  campaigns: HomeCampaigns;
  bento: HomeBento;
  /** "Sektörde Referans Noktası" (the `promos` switch). */
  statement: HomeStatement;
  brand_showcase: HomeBrandShowcase;
  kozlukler: HomeProductRowCopy;
  games: HomeProductRowCopy;
}

/** Homepage sections a phone can go without (hidden below `md` only). */
export type HomeMobileSection =
  | "perks"
  | "promos"
  | "brand_ticker"
  | "lules"
  | "sultanpuan"
  | "kumbara"
  | "bento"
  | "campaigns"
  | "brand_statement"
  | "brand_showcase"
  | "kozlukler"
  | "games"
  | "showcase";

export interface HomeMobile {
  /** A hero slide's portrait photo for phones (2:3 to 4:5), in place of its wide one. */
  hero_images: { slide_id: number; image: string }[];
  hidden: HomeMobileSection[];
}

export interface HomeSeoIntro {
  title: string;
  /** The paragraph always shown. */
  summary: string;
  /** What "Devamını Oku" opens; a blank line starts a new paragraph. */
  content: string;
}

export interface HomepageSettingsResponse {
  data: Partial<Homepage>;
  updated_at?: string | null;
}

// ── Toplu fiyat (Excel) ─────────────────────────────────────────────────────────

/** One block of the pricing workbook: where it is, and its four prices (TL, VAT included). */
export interface PriceImportRow {
  sheet: string;
  /** 1-based Excel row of the product's name; its prices are two rows below. */
  row: number;
  side: "sol" | "sağ";
  section: string | null;
  name: string;
  prices: Record<SegmentType, DecimalString | null>;
}

export interface PriceImportMatched extends PriceImportRow {
  product_id: string;
  product_code: string;
  product_name: string;
  /** "alias": tied to the product by the admin on an earlier upload (`alias_id`). */
  matched_by: "alias" | "code" | "sku" | "name";
  alias_id: number | null;
  variants: number;
  old_prices: Partial<Record<SegmentType, { currency: CurrencyType; price_incl_tax: DecimalString }>>;
  image_url: string | null;
}

/** A product a row may mean; priced only once the admin confirms it. */
export interface PriceImportCandidate {
  product_id: string;
  code: string;
  name: string;
  /** 0–1. */
  score: number;
  /** "abbreviation": a word spelled the other way (GOLD/G); "similar": a code like it, same model; "same_code": one of several sharing the name. */
  basis: "abbreviation" | "similar" | "same_code";
  retail: { currency: CurrencyType; price_incl_tax: DecimalString } | null;
  image_url: string | null;
}

export interface PriceImportSuggested extends PriceImportRow {
  candidates: PriceImportCandidate[];
  /** The one candidate safe to accept in bulk (the name spelled the other way, or close and already at this retail price); null when it is the admin's choice. */
  recommended_id: string | null;
}

export interface PriceImportUnmatched extends PriceImportRow {
  reason: "unnamed" | "incomplete" | "not_found" | "conflict" | "no_variants";
}

export interface PriceImportSkipped {
  sheet: string;
  row: number;
  side: "sol" | "sağ";
  name: string;
  reason: "foreign_currency" | "vat_excluded" | "no_dealer_price";
}

export interface PriceImportResult {
  dry_run: boolean;
  matched: PriceImportMatched[];
  suggested: PriceImportSuggested[];
  unmatched: PriceImportUnmatched[];
  skipped: PriceImportSkipped[];
  updated_products: number;
  updated_variants: number;
}

/** A workbook name the admin tied to a product by confirming a suggestion. */
export interface PriceImportAlias {
  id: number;
  excel_name: string;
  product_id: string;
  product_code: string;
  product_name: string;
  image_url: string | null;
  created_at: string;
}
