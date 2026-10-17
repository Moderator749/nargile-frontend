import { api } from "@/lib/api";
import type {
  AccountType,
  AdminCategory,
  AdminCustomer,
  AdminCustomerDetail,
  AdminDashboardData,
  AdminFlashSale,
  AdminFlashSaleWrite,
  AdminOrder,
  AdminProduct,
  AdminVariantPrice,
  AdvantageContent,
  AdvantageWrite,
  Announcement,
  AnnouncementUpdate,
  AudienceCount,
  Campaign,
  CampaignCreate,
  CommunicationDrivers,
  MessageChannel,
  NotificationLogEntry,
  AdminNote,
  AdminNoteWrite,
  BannerPreset,
  BannerPresetWrite,
  PopupAnnouncement,
  PopupAnnouncementUpdate,
  B2BApplication,
  B2BSegment,
  BankAccount,
  BankAccountWrite,
  Brand,
  BrandWrite,
  CategoryWrite,
  CurrencyType,
  CustomerSort,
  DecimalString,
  HeroSlideContent,
  HeroSlideWrite,
  LegalDocument,
  LegalKey,
  OrderApproveResponse,
  OrderStatus,
  PriceImportAlias,
  PriceImportResult,
  ProductDeleteResult,
  ProductSheet,
  ProductSort,
  PromoBoxContent,
  StoreParameters,
  PromoBoxWrite,
  SavedProductSheet,
  Segment,
  SegmentType,
  ShippingMethod,
  SortDirection,
  Homepage,
  HomepageSettingsResponse,
  UploadedImage,
  Wallet,
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

/**
 * One order as it stands now.
 *
 * The listing is a page read at a moment; the sheet shows an order, and an
 * order changes — a note arrives with it, an admin corrects an address. The
 * sheet asks for this when it opens so what is on screen is never a row the
 * panel happened to fetch earlier.
 */
export async function adminGetOrder(orderId: string, signal?: AbortSignal): Promise<AdminOrder> {
  const { data } = await api.get<AdminOrder>(`/admin/orders/${orderId}`, { signal });
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

export async function adminListBannerPresets(signal?: AbortSignal): Promise<BannerPreset[]> {
  const { data } = await api.get<BannerPreset[]>("/admin/banner-presets", { signal });
  return data;
}

export async function adminCreateBannerPreset(body: BannerPresetWrite): Promise<BannerPreset> {
  const { data } = await api.post<BannerPreset>("/admin/banner-presets", body);
  return data;
}

export async function adminUpdateBannerPreset(id: number, body: BannerPresetWrite): Promise<BannerPreset> {
  const { data } = await api.put<BannerPreset>(`/admin/banner-presets/${id}`, body);
  return data;
}

export async function adminDeleteBannerPreset(id: number): Promise<void> {
  await api.delete(`/admin/banner-presets/${id}`);
}

export async function adminCommunicationDrivers(signal?: AbortSignal): Promise<CommunicationDrivers> {
  const { data } = await api.get<CommunicationDrivers>("/admin/communications/status", { signal });
  return data;
}

export async function adminAudienceCounts(channel: MessageChannel, signal?: AbortSignal): Promise<AudienceCount[]> {
  const { data } = await api.get<AudienceCount[]>("/admin/communications/audiences", { params: { channel }, signal });
  return data;
}

export async function adminCreateCampaign(body: CampaignCreate): Promise<Campaign> {
  const { data } = await api.post<Campaign>("/admin/communications/campaigns", body);
  return data;
}

export async function adminListCampaigns(signal?: AbortSignal): Promise<Campaign[]> {
  const { data } = await api.get<Campaign[]>("/admin/communications/campaigns", { params: { limit: 30 }, signal });
  return data;
}

export async function adminNotificationLogs(signal?: AbortSignal): Promise<NotificationLogEntry[]> {
  const { data } = await api.get<NotificationLogEntry[]>("/admin/communications/logs", { params: { limit: 50 }, signal });
  return data;
}

export async function adminListNotes(signal?: AbortSignal): Promise<AdminNote[]> {
  const { data } = await api.get<AdminNote[]>("/admin/notes", { signal });
  return data;
}

export async function adminCreateNote(body: AdminNoteWrite): Promise<AdminNote> {
  const { data } = await api.post<AdminNote>("/admin/notes", body);
  return data;
}

export async function adminUpdateNote(id: number, body: AdminNoteWrite): Promise<AdminNote> {
  const { data } = await api.put<AdminNote>(`/admin/notes/${id}`, body);
  return data;
}

export async function adminDeleteNote(id: number): Promise<void> {
  await api.delete(`/admin/notes/${id}`);
}

export async function adminGetPopup(signal?: AbortSignal): Promise<PopupAnnouncement> {
  const { data } = await api.get<PopupAnnouncement>("/admin/announcements/popup", { signal });
  return data;
}

export async function adminUpdatePopup(payload: PopupAnnouncementUpdate): Promise<PopupAnnouncement> {
  const { data } = await api.put<PopupAnnouncement>("/admin/announcements/popup", payload);
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

/** One page of customers plus the total number of matches (X-Total-Count), for page controls. */
export async function adminListCustomersPage(
  params: {
    q?: string;
    accountType?: AccountType | "";
    segment?: SegmentType | "";
    city?: string;
    page: number;
    pageSize?: number;
    /** Omitted: the server's default order (newest first). */
    orderBy?: CustomerSort | null;
    orderDir?: SortDirection;
  },
  signal?: AbortSignal,
): Promise<{ customers: AdminCustomer[]; total: number }> {
  const pageSize = params.pageSize ?? ADMIN_PAGE_SIZE;
  const { data, headers } = await api.get<AdminCustomer[]>("/admin/customers", {
    params: {
      q: params.q || undefined,
      account_type: params.accountType || undefined,
      segment: params.segment || undefined,
      city: params.city || undefined,
      order_by: params.orderBy || undefined,
      order_dir: params.orderBy ? (params.orderDir ?? "asc") : undefined,
      skip: params.page * pageSize,
      limit: pageSize,
    },
    signal,
  });
  return { customers: data, total: Number(headers["x-total-count"] ?? data.length) };
}

/** The cities customers are actually in, for the grid's İl filter. */
export async function adminCustomerCities(signal?: AbortSignal): Promise<string[]> {
  const { data } = await api.get<string[]>("/admin/customers/cities", { signal });
  return data;
}

/** One customer in full: identity, invoice details, addresses, orders, price list. */
export async function adminCustomerDetail(userId: string, signal?: AbortSignal): Promise<AdminCustomerDetail> {
  const { data } = await api.get<AdminCustomerDetail>(`/admin/customers/${userId}`, { signal });
  return data;
}

/**
 * Puts the customer on a price list. Sign-up grants no tier, so this is how a
 * kafe or a bayi gets theirs; it applies to their very next request.
 */
export async function adminAssignSegment(userId: string, segment: SegmentType): Promise<AdminCustomerDetail> {
  const { data } = await api.put<AdminCustomerDetail>(`/admin/customers/${userId}/segment`, { segment });
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

export async function adminGetLegalDocuments(signal?: AbortSignal): Promise<LegalDocument[]> {
  const { data } = await api.get<LegalDocument[]>("/admin/settings/legal", { signal });
  return data;
}

/** "Parametreler": the checkout's commercial rules; see `lib/settingsApi`. */
export async function adminGetStoreParameters(signal?: AbortSignal): Promise<StoreParameters> {
  const { data } = await api.get<StoreParameters>("/admin/settings/parameters", { signal });
  return data;
}

/** Saves all of them at once. The next cart calculation uses what is saved here. */
export async function adminUpdateStoreParameters(body: StoreParameters): Promise<StoreParameters> {
  const { data } = await api.put<StoreParameters>("/admin/settings/parameters", body);
  return data;
}

/** Saves one text. What the panel saves is what the next buyer accepts. */
export async function adminUpdateLegalDocument(
  key: LegalKey,
  body: { title: string; body: string },
): Promise<LegalDocument> {
  const { data } = await api.put<LegalDocument>(`/admin/settings/legal/${key}`, body);
  return data;
}

// ── Ana Sayfa Düzenleme ───────────────────────────────────────────────────────

/** The saved homepage document: only the sections an admin has saved. */
export async function adminGetHomepage(signal?: AbortSignal): Promise<HomepageSettingsResponse> {
  const { data } = await api.get<HomepageSettingsResponse>("/admin/home/settings", { signal });
  return data;
}

/** Replaces the document; sections left out go back to the storefront default. */
export async function adminSaveHomepage(body: Partial<Homepage>): Promise<HomepageSettingsResponse> {
  const { data } = await api.put<HomepageSettingsResponse>("/admin/home/settings", body);
  return data;
}

/**
 * Toplu fiyat: the supplier's pricing workbook, matched to products. With
 * `dryRun` (the preview) nothing is written; without it every matched row's
 * four group prices are, all or nothing.
 */
export async function adminImportPrices(file: File, dryRun: boolean): Promise<PriceImportResult> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<PriceImportResult>("/admin/pricing/import-excel", form, {
    params: { dry_run: dryRun },
    headers: { "Content-Type": "multipart/form-data" },
    // A workbook of a few hundred blocks is matched against the whole catalog.
    timeout: 60_000,
  });
  return data;
}

/** A suggestion confirmed: this workbook name means this product on every later upload. */
export async function adminSaveImportAlias(excelName: string, productId: string): Promise<PriceImportAlias> {
  const { data } = await api.post<PriceImportAlias>("/admin/pricing/import-aliases", {
    excel_name: excelName,
    product_id: productId,
  });
  return data;
}

/** Several at once ("Güvenli önerileri eşleştir"): all saved, or none. */
export async function adminSaveImportAliases(
  aliases: { excelName: string; productId: string }[],
): Promise<PriceImportAlias[]> {
  const { data } = await api.post<PriceImportAlias[]>("/admin/pricing/import-aliases/batch", {
    aliases: aliases.map((a) => ({ excel_name: a.excelName, product_id: a.productId })),
  });
  return data;
}

export async function adminListImportAliases(signal?: AbortSignal): Promise<PriceImportAlias[]> {
  const { data } = await api.get<PriceImportAlias[]>("/admin/pricing/import-aliases", { signal });
  return data;
}

export async function adminDeleteImportAlias(id: number): Promise<void> {
  await api.delete(`/admin/pricing/import-aliases/${id}`);
}
