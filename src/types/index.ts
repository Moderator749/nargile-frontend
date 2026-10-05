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
export type OrderStatus = "PENDING_APPROVAL" | "APPROVED" | "SHIPPED" | "CANCELLED";

// ---- User / Auth ----

export interface User {
  id: UUID;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: ISODateTime;
  /** Returned by GET /auth/me (UserMe); absent from other user responses. */
  segment_code?: SegmentType | null;
}

export const B2B_SEGMENTS: readonly SegmentType[] = ["WHOLESALE", "DEALER"];

export interface UserCreate {
  email: string;
  password: string;
  phone?: string | null;
  segment_code?: SegmentType | null;
  /** Not yet stored by the backend (no column); ignored until it is added. */
  full_name?: string;
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
  parent_id: number | null;
}

export interface Product {
  id: UUID;
  base_code: string;
  name: string;
  brand: string | null;
  description: string | null;
  category_id: number | null;
  tags: string[] | null;
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
  price: DecimalString;
  segment_price: DecimalString | null;
}

export interface CartCalculateRequest {
  user_id: UUID;
  payment_method: PaymentMethod;
  items: CartItem[];
  points_to_redeem?: number;
}

export interface CartItemBreakdown {
  variant_id: UUID;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: DecimalString;
  line_total: DecimalString;
  tags: string[];
}

/** Server-priced cart, returned by POST /orders/calculate-cart. */
export interface Cart {
  subtotal: DecimalString;
  cargo_cost: DecimalString;
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
