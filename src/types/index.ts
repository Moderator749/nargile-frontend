// Mirrors the FastAPI Pydantic schemas in saas_backend/app/schemas.
// Over JSON, Pydantic v2 serializes UUID, datetime and Decimal as strings.

export type UUID = string;
export type ISODateTime = string;
/** Decimal serialized as a string (e.g. "149.90") to avoid float rounding. */
export type DecimalString = string;

// ---- Enums ----

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
export type SegmentType = "RETAIL" | "CAFE" | "WHOLESALE" | "DEALER";
export type CurrencyType = "TRY" | "USD" | "EUR";
export type WarehouseType = "RETAIL_STOCK" | "B2B_STOCK";
export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER";
/** AWAITING_TRANSFER = "Havale Bekliyor": a bank-transfer order waiting for the money. */
export type OrderStatus = "PENDING_APPROVAL" | "AWAITING_TRANSFER" | "APPROVED" | "SHIPPED" | "CANCELLED";
/** COURIER_ISTANBUL: same-day courier, 10:00–20:00, paid to the courier on delivery. */
export type ShippingMethod = "CARGO" | "COURIER_ISTANBUL";
/** Who pays the carriage: the shop (free shipping) or the buyer on delivery. */
export type ShippingPayer = "SHOP" | "RECEIVER";

export interface ShippingAddress {
  full_name: string;
  phone: string;
  /** One of the 81 provinces (canonical spelling, e.g. "İstanbul"). */
  city: string;
  district: string;
  line: string;
}

// ---- User / Auth ----

export interface User {
  id: UUID;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: ISODateTime;
  /** Returned by GET /auth/me (UserMe); absent from other user responses. */
  segment_code?: SegmentType | null;
  /** Usable ParaPuan (1 point = 1 TRY). Returned by GET /auth/me only. */
  loyalty_balance?: number;
}

export const B2B_SEGMENTS: readonly SegmentType[] = ["WHOLESALE", "DEALER"];

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
  phone?: string | null;
  // No segment_code: the backend always assigns RETAIL on self-registration.
  /** Optional Kafe / Toptan / Bayi application, approved (or not) by an admin. */
  b2b_application?: B2BApplicationInput | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface CompanyProfile {
  id: number;
  company_title: string;
  tax_number: string | null;
  tax_office: string | null;
  billing_address: Record<string, unknown> | null;
  delivery_address: Record<string, unknown> | null;
}

// ---- Catalog ----

export interface Category {
  id: number;
  name: string;
  slug: string;
  /** Two-level menu: null = top-level group. */
  parent_id: number | null;
  /** Order among siblings (ascending). */
  sort_order?: number;
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
  is_active: boolean;
  sort_order: number;
}

export interface AdminCategory extends Category {
  sort_order: number;
  /** Products assigned directly (not via subcategories). */
  product_count: number;
}

export interface CategoryWrite {
  name: string;
  slug?: string | null;
  parent_id: number | null;
  sort_order: number;
}

export interface BrandWrite {
  name: string;
  slug?: string | null;
  search_term?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Product {
  id: UUID;
  base_code: string;
  name: string;
  brand: string | null;
  description: string | null;
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
  /** "Renk" labels, in the order the admin added them. */
  color_names?: string[];
  /**
   * On the "Fırsat Ürünleri" list while true — even once the deal is over, when
   * it shows as "Fırsat Kaçtı". A claimable deal also has `variants[].flash_sale`.
   */
  is_opportunity: boolean;
  /** "Fırsat rengi": the badge colour for a product on offer, "#rrggbb". */
  opportunity_color: string | null;
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

export interface CatalogVariant {
  id: UUID;
  sku: string;
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
  /** Stock in the caller's warehouse; absent (older API) means unknown → treated as in stock. */
  in_stock?: boolean;
}

export interface CatalogProduct extends Product {
  variants: CatalogVariant[];
}

/** `GET /products/{id}`: the product plus its "birlikte satılanlar". */
export interface CatalogProductDetail extends CatalogProduct {
  /** Priced for the same caller as the product itself; empty when none are pinned. */
  cross_sells?: CatalogProduct[];
}

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  sku: string;
  barcode: string | null;
  attributes: Record<string, unknown> | null;
}

export interface VariantPrice {
  id: number;
  variant_id: UUID;
  segment_id: number;
  currency: CurrencyType;
  price_excl_tax: DecimalString;
  price_incl_tax: DecimalString;
  vat_rate: DecimalString;
}

export interface Inventory {
  id: number;
  variant_id: UUID;
  warehouse_type: WarehouseType;
  quantity: number;
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
export interface CartLineItem extends CartItem {
  product_name: string;
  /** Snapshot for the cart thumbnail (the server quote's image wins when present). */
  image_url?: string | null;
  price: DecimalString;
  segment_price: DecimalString | null;
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
}

export interface CartItemBreakdown {
  variant_id: UUID;
  product_id?: UUID | null;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: DecimalString;
  line_total: DecimalString;
  tags: string[];
  image_url?: string | null;
}

/** Server-priced cart, returned by POST /orders/calculate-cart. */
/** Why shipping is (or isn't) free — lets the cart explain the coal rules. */
export interface ShippingBreakdown {
  /** The shop pays the carrier: nothing is collected from the buyer. */
  free: boolean;
  /** "Karşı ödemeli": the buyer pays the carrier (or courier) on delivery. */
  receiver_pays: boolean;
  /** coal_weight: coal is over coal_max_ratio of the cart and under coal_min_kg. */
  reason: "free" | "below_threshold" | "coal_weight" | "courier";
  free_threshold: DecimalString;
  coal_total: DecimalString;
  /** Coal share of the subtotal, 0..1. */
  coal_ratio: DecimalString;
  coal_max_ratio: DecimalString;
  coal_weight_kg: DecimalString;
  coal_min_kg: DecimalString;
  /** Some coal in the cart has no recorded weight (counts as 0 kg). */
  coal_weight_unknown: boolean;
}

export interface Cart {
  subtotal: DecimalString;
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
  shipping_method: ShippingMethod;
  /** Who pays the carriage. `shipping_cost` is always "0.00": it is never charged. */
  shipping_payer: ShippingPayer;
  /** When the buyer accepted paying the carrier; null when the shop pays. */
  shipping_consent_at: ISODateTime | null;
  /** Null on orders from before addresses were collected. */
  shipping_address: ShippingAddress | null;
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
  /** "Ciro indirimi": counts towards, and is discounted by, the volume tiers. */
  has_volume_discount: boolean;
  gives_points: boolean;
  can_use_points: boolean;
  /** "Ağır Kargo rakamı 3.000 TL üzeri alışverişlerde sepetin %50'sini geçemez." */
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
  category_id?: number | null;
  /** "Renk" labels, in the order the admin added them. */
  color_names: string[];
  description?: string | null;
  /** Gallery in order; the server mirrors the first one into `image_url`. */
  image_urls: string[];
  youtube_video_url?: string | null;
  /** Defaults to `base_code` on the server. */
  sku?: string | null;
  /** Unit weight in kg (the coal free-shipping rule); null = not recorded. */
  weight_kg?: DecimalString | null;
  is_published: boolean;
  stock: SheetStock;
  prices: SheetPriceRow[];
  rules: SheetRules;
  opportunity: SheetOpportunity;
  /** "Birlikte satılanlar", in the admin's order; at most four. */
  related_product_ids: UUID[];
}

export interface SavedProductSheet extends ProductSheet {
  id: UUID;
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
  billing_address: Partial<ShippingAddress> | null;
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
  sale_price_incl_tax: DecimalString;
  regular_price_incl_tax: DecimalString | null;
  starts_at: ISODateTime;
  ends_at: ISODateTime;
  is_active: boolean;
  is_live: boolean;
}

export interface AdminFlashSaleWrite {
  sku: string;
  sale_price_incl_tax: DecimalString;
  starts_at: ISODateTime;
  ends_at: ISODateTime;
  is_active: boolean;
}

// ── Homepage CMS (/home/content, /admin/hero-slides|promo-boxes|advantages) ──

/** Content shown only while something exists (e.g. a live flash sale). */
export type ContentRequirement = "flash_sales";

export interface HeroSlideContent {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  guest_cta_label: string | null;
  guest_cta_href: string | null;
  /** Resolved image: uploaded file URL, else external URL, else null. */
  image: string | null;
  image_url: string | null;
  has_upload: boolean;
  requires: ContentRequirement | null;
  is_active: boolean;
  sort_order: number;
}

export type PromoVariant = "image" | "text" | "transparent";

export interface PromoBoxContent {
  id: number;
  /** 1 = first promo grid, 2 = second. */
  row: number;
  variant: PromoVariant;
  eyebrow: string;
  title: string;
  text: string | null;
  href: string;
  image: string | null;
  image_url: string | null;
  has_upload: boolean;
  badge: "sok" | null;
  requires: ContentRequirement | null;
  is_active: boolean;
  sort_order: number;
}

export interface AdvantageContent {
  id: number;
  icon: string;
  title: string;
  highlight: string;
  highlight_label: string;
  details: string[];
  footnote: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface HomeContent {
  slides: HeroSlideContent[];
  promos: PromoBoxContent[];
  advantages: AdvantageContent[];
}

export type HeroSlideWrite = Omit<HeroSlideContent, "id" | "image" | "has_upload">;
export type PromoBoxWrite = Omit<PromoBoxContent, "id" | "image" | "has_upload">;
export type AdvantageWrite = Omit<AdvantageContent, "id">;

// ── Wallet (ParaPuan + Kumbarapuan), bank accounts, admin customers ──────────

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
  lots: WalletLot[];
  kumbara: { accumulated: DecimalString; target: DecimalString; rate: DecimalString };
  history: WalletEntry[];
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

export interface AdminCustomer {
  id: UUID;
  email: string;
  full_name: string | null;
  segment: SegmentType | null;
  balance: number;
  order_count: number;
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
