import { api } from "@/lib/api";
import type {
  AdminDashboardData,
  B2BApplication,
  B2BSegment,
  AdminCustomer,
  ShippingMethod,
  BankAccount,
  BankAccountWrite,
  Wallet,
  AdvantageContent,
  AdvantageWrite,
  HeroSlideContent,
  HeroSlideWrite,
  PromoBoxContent,
  PromoBoxWrite,
  AdminCategory,
  AdminFlashSale,
  Brand,
  BrandWrite,
  CategoryWrite,
  AdminFlashSaleWrite,
  AdminOrder,
  AdminProduct,
  AdminVariantPrice,
  Announcement,
  AnnouncementUpdate,
  CurrencyType,
  DecimalString,
  OrderApproveResponse,
  OrderStatus,
  ProductDeleteResult,
  ProductSheet,
  ProductSort,
  SavedProductSheet,
  Segment,
  SortDirection,
  UploadedImage,
} from "@/types";

export const ADMIN_PAGE_SIZE = 50;

export async function adminListOrders(
  params: { status?: OrderStatus | null; shippingMethod?: ShippingMethod | null; skip?: number; limit?: number },
  signal?: AbortSignal,
): Promise<AdminOrder[]> {
  const { data } = await api.get<AdminOrder[]>("/admin/orders", {
    params: {
      status: params.status ?? undefined,
      shipping_method: params.shippingMethod ?? undefined,
      skip: params.skip ?? 0,
      limit: params.limit ?? ADMIN_PAGE_SIZE,
    },
    signal,
  });
  return data;
}

export async function adminApproveOrder(orderId: string): Promise<OrderApproveResponse> {
  const { data } = await api.post<OrderApproveResponse>(`/admin/orders/${orderId}/approve`);
  return data;
}

export async function adminListProducts(
  params: { q?: string; category?: string | null; skip?: number; limit?: number },
  signal?: AbortSignal,
): Promise<AdminProduct[]> {
  const { data } = await api.get<AdminProduct[]>("/admin/products", {
    params: {
      q: params.q || undefined,
      category: params.category || undefined,
      skip: params.skip ?? 0,
      limit: params.limit ?? ADMIN_PAGE_SIZE,
    },
    signal,
  });
  return data;
}

// ── Product sheet ("Ürün Ekle / Düzenle") ────────────────────────────────────

/** Deletes the ticked products; the result says which were kept, and why. */
export async function adminDeleteProducts(productIds: string[]): Promise<ProductDeleteResult> {
  const { data } = await api.post<ProductDeleteResult>("/admin/products/delete", { product_ids: productIds });
  return data;
}

/** Deep-copies the ticked products as unpublished drafts, in the order given. */
export async function adminDuplicateProducts(productIds: string[]): Promise<AdminProduct[]> {
  const { data } = await api.post<AdminProduct[]>("/admin/products/duplicate", { product_ids: productIds });
  return data;
}

/** Puts a product on the storefront, or takes it off, from the products list. */
export async function adminSetProductPublished(productId: string, isPublished: boolean): Promise<boolean> {
  const { data } = await api.patch<{ id: string; is_published: boolean }>(
    `/admin/products/${productId}/publish`,
    { is_published: isPublished },
  );
  return data.is_published;
}

/** Stores images under the API's media root and returns their public URLs. */
export async function adminUploadImages(files: File[]): Promise<UploadedImage[]> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  // Overrides the client's JSON default; the browser adds the multipart boundary.
  const { data } = await api.post<UploadedImage[]>("/admin/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** The whole sheet in one request; the server writes its five tables atomically. */
export async function adminCreateProductSheet(body: ProductSheet): Promise<SavedProductSheet> {
  const { data } = await api.post<SavedProductSheet>("/admin/products/sheet", body);
  return data;
}

export async function adminGetProductSheet(productId: string, signal?: AbortSignal): Promise<SavedProductSheet> {
  const { data } = await api.get<SavedProductSheet>(`/admin/products/${productId}/sheet`, { signal });
  return data;
}

export async function adminUpdateProductSheet(productId: string, body: ProductSheet): Promise<SavedProductSheet> {
  const { data } = await api.put<SavedProductSheet>(`/admin/products/${productId}/sheet`, body);
  return data;
}

export async function adminListSegments(signal?: AbortSignal): Promise<Segment[]> {
  const { data } = await api.get<Segment[]>("/admin/segments", { signal });
  return data;
}

export interface PriceInput {
  segment_id: number;
  price_excl_tax: DecimalString;
  price_incl_tax: DecimalString;
  vat_rate: DecimalString;
}

export async function adminUpdatePricing(
  variantId: string,
  prices: PriceInput[],
  currency: CurrencyType = "TRY",
): Promise<{ variant_id: string; currency: CurrencyType; prices: (AdminVariantPrice & { id: number })[] }> {
  const { data } = await api.put(`/admin/variants/${variantId}/pricing`, { currency, prices });
  return data;
}

export async function adminGetAnnouncement(signal?: AbortSignal): Promise<Announcement> {
  const { data } = await api.get<Announcement>("/admin/announcement", { signal });
  return data;
}

export async function adminUpdateAnnouncement(payload: AnnouncementUpdate): Promise<Announcement> {
  const { data } = await api.put<Announcement>("/admin/announcement", payload);
  return data;
}

export async function adminListFlashSales(signal?: AbortSignal): Promise<AdminFlashSale[]> {
  const { data } = await api.get<AdminFlashSale[]>("/admin/flash-sales", { signal });
  return data;
}

export async function adminCreateFlashSale(body: AdminFlashSaleWrite): Promise<AdminFlashSale> {
  const { data } = await api.post<AdminFlashSale>("/admin/flash-sales", body);
  return data;
}

export async function adminUpdateFlashSale(id: number, body: AdminFlashSaleWrite): Promise<AdminFlashSale> {
  const { data } = await api.put<AdminFlashSale>(`/admin/flash-sales/${id}`, body);
  return data;
}

export async function adminDeleteFlashSale(id: number): Promise<void> {
  await api.delete(`/admin/flash-sales/${id}`);
}

// ── Menu taxonomy: categories, product mapping, brands ───────────────────────

export async function adminListCategories(signal?: AbortSignal): Promise<AdminCategory[]> {
  const { data } = await api.get<AdminCategory[]>("/admin/categories", { signal });
  return data;
}

export async function adminCreateCategory(body: CategoryWrite): Promise<AdminCategory> {
  const { data } = await api.post<AdminCategory>("/admin/categories", body);
  return data;
}

export async function adminUpdateCategory(id: number, body: CategoryWrite): Promise<AdminCategory> {
  const { data } = await api.put<AdminCategory>(`/admin/categories/${id}`, body);
  return data;
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await api.delete(`/admin/categories/${id}`);
}

export async function adminAssignProductCategory(productIds: string[], categoryId: number | null): Promise<number> {
  const { data } = await api.post<{ updated: number }>("/admin/products/category", {
    product_ids: productIds,
    category_id: categoryId,
  });
  return data.updated;
}

export async function adminListBrands(signal?: AbortSignal): Promise<Brand[]> {
  const { data } = await api.get<Brand[]>("/admin/brands", { signal });
  return data;
}

export async function adminCreateBrand(body: BrandWrite): Promise<Brand> {
  const { data } = await api.post<Brand>("/admin/brands", body);
  return data;
}

export async function adminUpdateBrand(id: number, body: BrandWrite): Promise<Brand> {
  const { data } = await api.put<Brand>(`/admin/brands/${id}`, body);
  return data;
}

export async function adminDeleteBrand(id: number): Promise<void> {
  await api.delete(`/admin/brands/${id}`);
}

export async function adminUploadBrandLogo(id: number, file: File): Promise<Brand> {
  const form = new FormData();
  form.append("file", file);
  // Overrides the client's JSON default (which would serialise FormData as JSON);
  // the browser adds the multipart boundary itself.
  const { data } = await api.post<Brand>(`/admin/brands/${id}/logo`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function adminDeleteBrandLogo(id: number): Promise<Brand> {
  const { data } = await api.delete<Brand>(`/admin/brands/${id}/logo`);
  return data;
}

// ── Homepage CMS: hero slides, promo boxes, advantages (same REST shape) ──────

function contentApi<Row, Write>(path: string) {
  return {
    list: async (signal?: AbortSignal) => (await api.get<Row[]>(path, { signal })).data,
    create: async (body: Write) => (await api.post<Row>(path, body)).data,
    update: async (id: number, body: Write) => (await api.put<Row>(`${path}/${id}`, body)).data,
    remove: async (id: number) => {
      await api.delete(`${path}/${id}`);
    },
  };
}

function imageApi<Row>(path: string) {
  return {
    uploadImage: async (id: number, file: File) => {
      const form = new FormData();
      form.append("file", file);
      // Overrides the client's JSON default; the browser adds the multipart boundary.
      return (await api.post<Row>(`${path}/${id}/image`, form, { headers: { "Content-Type": "multipart/form-data" } })).data;
    },
    removeImage: async (id: number) => (await api.delete<Row>(`${path}/${id}/image`)).data,
  };
}

export const adminHeroSlides = {
  ...contentApi<HeroSlideContent, HeroSlideWrite>("/admin/hero-slides"),
  ...imageApi<HeroSlideContent>("/admin/hero-slides"),
};
export const adminPromoBoxes = {
  ...contentApi<PromoBoxContent, PromoBoxWrite>("/admin/promo-boxes"),
  ...imageApi<PromoBoxContent>("/admin/promo-boxes"),
};
export const adminAdvantages = contentApi<AdvantageContent, AdvantageWrite>("/admin/advantages");

/** Unit weight in kg; null clears it. */
export async function adminUpdateVariantWeight(
  variantId: string,
  weightKg: string | null,
): Promise<{ id: string; sku: string; weight_kg: DecimalString | null }> {
  const { data } = await api.patch(`/admin/variants/${variantId}`, { weight_kg: weightKg });
  return data;
}

// ── Orders: mark paid / cancel; customers & wallets; bank accounts ────────────

/** Hands the order to the carrier and e-mails the customer the dispatch notice. */
export async function adminShipOrder(orderId: string, trackingCode: string | null): Promise<AdminOrder> {
  const { data } = await api.post<AdminOrder>(`/admin/orders/${orderId}/ship`, { tracking_code: trackingCode });
  return data;
}

/** Cancels and returns the updated order in the list shape, so an open row can be replaced. */
export async function adminCancelOrder(orderId: string, reason: string): Promise<AdminOrder> {
  const { data } = await api.post<AdminOrder>(`/admin/orders/${orderId}/cancel`, { reason });
  return data;
}

export async function adminListCustomers(params: { q?: string; skip?: number }, signal?: AbortSignal): Promise<AdminCustomer[]> {
  const { data } = await api.get<AdminCustomer[]>("/admin/customers", {
    params: { q: params.q || undefined, skip: params.skip ?? 0, limit: ADMIN_PAGE_SIZE },
    signal,
  });
  return data;
}

export async function adminCustomerWallet(userId: string, signal?: AbortSignal): Promise<Wallet> {
  const { data } = await api.get<Wallet>(`/admin/customers/${userId}/wallet`, { signal });
  return data;
}

/** + adds points (expire in a year), − removes them; a reason is required. */
export async function adminAdjustPoints(userId: string, amount: number, note: string): Promise<Wallet> {
  const { data } = await api.post<Wallet>(`/admin/customers/${userId}/points`, { amount, note });
  return data;
}

export const adminBankAccounts = contentApi<BankAccount, BankAccountWrite>("/admin/bank-accounts");

/** One page of products plus the total number of matches (X-Total-Count), for page controls. */
export async function adminListProductsPage(
  params: {
    q?: string;
    category?: string | null;
    page: number;
    pageSize?: number;
    /** Omitted: the server's default order (by name). */
    orderBy?: ProductSort | null;
    orderDir?: SortDirection;
  },
  signal?: AbortSignal,
): Promise<{ products: AdminProduct[]; total: number }> {
  const pageSize = params.pageSize ?? ADMIN_PAGE_SIZE;
  const { data, headers } = await api.get<AdminProduct[]>("/admin/products", {
    params: {
      q: params.q || undefined,
      category: params.category || undefined,
      order_by: params.orderBy || undefined,
      order_dir: params.orderBy ? (params.orderDir ?? "asc") : undefined,
      skip: params.page * pageSize,
      limit: pageSize,
    },
    signal,
  });
  const total = Number(headers["x-total-count"]);
  return { products: data, total: Number.isFinite(total) ? total : data.length };
}

// ── Dashboard & B2B applications ─────────────────────────────────────────────

export async function adminDashboard(signal?: AbortSignal): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>("/admin/dashboard", { signal });
  return data;
}

/** A page of orders (newest first) plus the total count, for page controls. */
export async function adminListOrdersPage(
  params: { page: number; pageSize: number; status?: OrderStatus | null },
  signal?: AbortSignal,
): Promise<{ orders: AdminOrder[]; total: number }> {
  const { data, headers } = await api.get<AdminOrder[]>("/admin/orders", {
    params: { status: params.status ?? undefined, skip: params.page * params.pageSize, limit: params.pageSize },
    signal,
  });
  const total = Number(headers["x-total-count"]);
  return { orders: data, total: Number.isFinite(total) ? total : data.length };
}

export async function adminListB2BApplications(signal?: AbortSignal): Promise<B2BApplication[]> {
  const { data } = await api.get<B2BApplication[]>("/admin/b2b-applications", { signal });
  return data;
}

export async function adminApproveB2B(id: number, segment: B2BSegment | null): Promise<B2BApplication> {
  const { data } = await api.post<B2BApplication>(`/admin/b2b-applications/${id}/approve`, { segment });
  return data;
}

export async function adminRejectB2B(id: number, note: string): Promise<B2BApplication> {
  const { data } = await api.post<B2BApplication>(`/admin/b2b-applications/${id}/reject`, { note });
  return data;
}
