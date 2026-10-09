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
export type PaymentMethod = "CREDIT_CARD" | "BANK_TRANSFER";
/** AWAITING_TRANSFER = "Havale Bekliyor": a bank-transfer order waiting for the money. */
export type OrderStatus = "PENDING_APPROVAL" | "AWAITING_TRANSFER" | "APPROVED" | "SHIPPED" | "CANCELLED";
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
  /** Usable ParaPuan (1 point = 1 TRY). Returned by GET /auth/me only. */
  loyalty_balance?: number;
}

export const B2B_SEGMENTS: readonly SegmentType[] = ["WHOLESALE", "DEALER"];

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
  /** The colour that was added; null/absent on a colourless product. */
  color_name?: string | null;
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
  invoice_tax_office?: string | null;
  invoice_tax_number?: string | null;
  /** "Kart bilgilerimi sonraki alışverişlerim için güvenle kaydet". */
  save_card?: boolean;
  /** Both are required to place an order; a price preview needs neither. */
  distance_sales_accepted?: boolean;
  terms_accepted?: boolean;
}

export interface CartItemBreakdown {
  variant_id: UUID;
  product_id?: UUID | null;
  sku: string;
  product_name: string;
  /** The colour in the cart; null on a colourless product. */
  color_name?: string | null;
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
  /**
   * coal_weight: coal is over coal_max_ratio of the cart and under coal_min_kg.
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
}

export interface Cart {
  subtotal: DecimalString;
  /**
   * Whether this account gets the retail promotions (ParaPuan, the ciro and
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
  invoice_tax_office: string | null;
  invoice_tax_number: string | null;
  save_card: boolean;
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
  /** "Renk" labels, in the order the admin added them; one buyable colour each. */
  color_names: string[];
  description?: string | null;
  /** Overrides the product page <title>; blank falls back to the product name. */
  meta_title?: string | null;
  /** Overrides its meta description; blank falls back to `description`. */
  meta_description?: string | null;
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

/** Which legal text. PRIVACY_NOTICE is the short framed notice in the cart. */
export type LegalKey = "PRIVACY_NOTICE" | "PRIVACY" | "DISTANCE_SALES" | "TERMS";

export interface LegalDocument {
  key: LegalKey;
  title: string;
  /** Plain text with `## ` headings and blank-line paragraphs. */
  body: string;
  updated_at: ISODateTime | null;
  /** False while this is still the text the shop was set up with. */
  edited: boolean;
}
