"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Check, Package, Plus, RotateCw, Save } from "lucide-react";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { CategoryPicker } from "@/components/admin/products/CategoryPicker";
import { ColorTags } from "@/components/admin/products/ColorTags";
import { MediaFields } from "@/components/admin/products/MediaFields";
import { CrossSellPicker, MAX_CROSS_SELLS } from "@/components/admin/products/CrossSellPicker";
import { PricingGrid } from "@/components/admin/products/PricingGrid";
import { QuantityCondition } from "@/components/admin/products/QuantityCondition";
import { RuleSwitch } from "@/components/admin/products/RuleSwitch";
import { SheetField, SheetSection, sheetInputClass } from "@/components/admin/products/SheetParts";
import { StockGrid } from "@/components/admin/products/StockGrid";
import {
  VAT_RATES,
  draftFromSheet,
  draftProblem,
  draftStockTotal,
  emptyDraft,
  toPayload,
  atRate,
  type CellDraft,
  type SheetDraft,
  type VatRate,
} from "@/components/admin/products/sheetDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  adminCreateProductSheet,
  adminGetProductSheet,
  adminListBrands,
  adminListCategories,
  adminUpdateProductSheet,
} from "@/lib/adminApi";
import { useProductListHref } from "@/components/admin/products/listReturn";
import { refreshStorefront } from "@/lib/revalidate";
import { getApiErrorMessage } from "@/lib/errors";
import { nameWithCode, productSlug } from "@/lib/slug";
import type { AdminCategory, Brand, CurrencyType, SavedProductSheet, SheetSegment } from "@/types";

/** The crimson of the site's primary buttons (red-600), as a one-click preset. */
const CRIMSON = "#DC2626";

// What a search result actually shows, and what the columns hold.
const META_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 160;

/** Product ids are UUIDs; anything else in the address cannot be a product. */
const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const linkButtonClass =
  "inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5";

/** "48 / 70" — amber from four fifths on, so the admin sees the ceiling coming. */
function CharCount({ value, max }: { value: string; max: number }) {
  const near = value.length >= max * 0.8;
  return (
    <p
      className={`mt-1 text-right font-mono text-[11px] tabular-nums ${
        near ? "text-amber-700 dark:text-amber-400" : "text-slate-400 dark:text-zinc-500"
      }`}
    >
      {value.length} / {max}
    </p>
  );
}

/** Shared by the general rule and its Fırsat override, so the two always agree. */
/**
 * The brand a stored value means: the same name, slug or search term, ignoring
 * case — so a product saved as "legend" before the brand list existed still
 * shows as Legend.
 */
function matchBrand(value: string, brands: Brand[]): Brand | undefined {
  const fold = (s: string) => s.trim().toLocaleLowerCase("tr-TR");
  const v = fold(value);
  if (!v) return undefined;
  return brands.find((b) => [b.name, b.slug, b.search_term].some((x) => fold(x) === v));
}

const VOLUME_DISCOUNT_HINT =
  "sepet indirim limitine gelindiğinde %5 ve %8 ciro indirimi otomatik olarak uygulansın";

/**
 * "Ürün Ekle / Düzenle" — the admin's product sheet, one screen for everything
 * the Excel blueprint holds: product info, the colours and their stock quotas,
 * the price matrix, the description and SEO overrides, the commercial rules and
 * the Fırsat block. One save writes them all.
 */
export function ProductSheetForm({ productId }: { productId?: string }) {
  const router = useRouter();
  // "Geri Dön": the list as it was left (category, search, sort, page).
  const listHref = useProductListHref();
  const editing = !!productId;
  // An address that cannot name a product is not looked up at all.
  const validId = !!productId && PRODUCT_ID.test(productId);
  // The product could not be loaded: the form is not shown, so saving cannot
  // write an empty sheet over it — or PUT to a product that no longer exists.
  const [unavailable, setUnavailable] = useState<{ missing: boolean; message: string } | null>(
    editing && !validId ? { missing: true, message: "" } : null,
  );
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState<SheetDraft>(emptyDraft);
  // The admin list, so a category switched off in the storefront can still be chosen.
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  // The admin list too, so the brand a product already has is found even when switched off.
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(validId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedProductSheet | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminListCategories(controller.signal)
      .then(setCategories)
      .catch(() => {
        // Non-critical: the category select stays empty.
      });
    adminListBrands(controller.signal)
      .then(setBrands)
      .catch(() => {
        // Non-critical: the brand select offers only the product's own brand.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!productId || !validId) return;
    const controller = new AbortController();
    adminGetProductSheet(productId, controller.signal)
      .then((sheet) => {
        setDraft(draftFromSheet(sheet));
        setUnavailable(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setUnavailable({
          missing: axios.isAxiosError(err) && err.response?.status === 404,
          message: getApiErrorMessage(err, "Ürün yüklenemedi."),
        });
        setLoading(false);
      });
    return () => controller.abort();
  }, [productId, validId, attempt]);

  // The address a new product gets from its code and name (the API's own rule).
  const generatedSlug = productSlug(draft.base_code, draft.name);
  const set = <K extends keyof SheetDraft>(key: K, value: SheetDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setCell = (currency: CurrencyType, segment: SheetSegment, cell: CellDraft) =>
    setDraft((d) => ({ ...d, prices: { ...d.prices, [currency]: { ...d.prices[currency], [segment]: cell } } }));

  /** A new rate re-derives every cell from the price the admin typed in it
   * (the net one, unless they typed the KDV dahil one). */
  const setVatRate = (vatRate: VatRate) =>
    setDraft((d) => ({
      ...d,
      vatRate,
      prices: Object.fromEntries(
        Object.entries(d.prices).map(([currency, row]) => [
          currency,
          Object.fromEntries(
            Object.entries(row).map(([segment, cell]) => [segment, atRate(cell, vatRate)]),
          ),
        ]),
      ) as SheetDraft["prices"],
    }));

  const brand = matchBrand(draft.brand, brands);
  // A brand typed in before the list existed, or since removed from it: kept
  // and shown, so saving does not drop it, until another one is picked.
  const unlistedBrand = draft.brand.trim() && !brand ? draft.brand.trim() : null;

  const problem = useMemo(() => draftProblem(draft), [draft]);
  const total = draftStockTotal(draft);

  async function save() {
    if (saving || problem || unavailable) return;
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const payload = toPayload(draft);
      const sheet = productId
        ? await adminUpdateProductSheet(productId, payload)
        : await adminCreateProductSheet(payload);
      setSaved(sheet);
      // The category page lists it from the catalog cache; drop that so the
      // product shows under its category straight away.
      void refreshStorefront();
      setDraft(draftFromSheet(sheet));
      if (!productId) router.replace(`/admin/products/${sheet.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Ürün kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
        ))}
      </div>
    );
  }

  if (unavailable) {
    return (
      <>
        <AdminPageHeader title="Ürün Düzenle" description="Ürün bilgisi, stok, fiyat ve kurallar tek formda." />
        <div className={`${panelClass} space-y-4 p-6`}>
          <Alert variant="error">
            {unavailable.missing
              ? "Bu ürün bulunamadı. Silinmiş olabilir ya da bağlantı hatalı."
              : unavailable.message}
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Link href={listHref} className={linkButtonClass}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Ürün listesine dön
            </Link>
            {unavailable.missing ? (
              <Link href="/admin/products/new" className={linkButtonClass}>
                <Plus className="h-4 w-4" aria-hidden /> Yeni Ürün Ekle
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setAttempt((n) => n + 1);
                }}
                className={linkButtonClass}
              >
                <RotateCw className="h-4 w-4" aria-hidden /> Tekrar dene
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  const opp = draft.opportunity;
  const setOpp = (patch: Partial<SheetDraft["opportunity"]>) => set("opportunity", { ...opp, ...patch });

  return (
    <>
      <AdminPageHeader
        title={editing ? "Ürün Düzenle" : "Ürün Ekle"}
        description="Ürün bilgisi, renk bazlı stok kotaları, fiyat tablosu, açıklama, SEO, kurallar ve fırsat tek formda; kaydet dediğinizde hepsi birlikte yazılır."
      />

      <div className="space-y-4">
        <SheetSection title="Ürün Bilgileri">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SheetField id="sheet-code" label="Ürün Kodu" hint="Stok kodu olarak da kullanılır.">
              <input
                id="sheet-code"
                value={draft.base_code}
                onChange={(e) => set("base_code", e.target.value)}
                className={sheetInputClass}
                autoComplete="off"
              />
            </SheetField>
            <SheetField id="sheet-name" label="Ürün Adı" className="xl:col-span-2">
              <input id="sheet-name" value={draft.name} onChange={(e) => set("name", e.target.value)} className={sheetInputClass} />
            </SheetField>
            <SheetField id="sheet-brand" label="Marka">
              {/* The sidebar's brand entries search for the brand's term, which
                  the name carries — so a brand picked here lists the product there. */}
              <select
                id="sheet-brand"
                value={brand?.name ?? unlistedBrand ?? ""}
                onChange={(e) => set("brand", e.target.value)}
                className={sheetInputClass}
              >
                <option value="">Markasız</option>
                {brands
                  .filter((b) => b.is_active || b.id === brand?.id)
                  .map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                      {!b.is_active ? " (pasif)" : ""}
                    </option>
                  ))}
                {unlistedBrand && <option value={unlistedBrand}>{unlistedBrand} (listede yok)</option>}
              </select>
            </SheetField>
            <div className="xl:col-span-2">
              <CategoryPicker
                categories={categories}
                value={draft.category_ids}
                onChange={(ids) => set("category_ids", ids)}
              />
            </div>
            <ColorTags colors={draft.colors} onChange={(colors) => set("colors", colors)} />
          </div>
        </SheetSection>

        <SheetSection title="Yayın Durumu" hint="Kapalıyken ürün mağazada hiç görünmez.">
          <RuleSwitch
            id="sheet-published"
            label="Mağazada Yayında"
            hint="Ürünler listesinden de açıp kapatabilirsiniz."
            checked={draft.isPublished}
            onChange={(v) => set("isPublished", v)}
          />
        </SheetSection>

        <SheetSection title="Görseller ve Video">
          <MediaFields
            imageUrls={draft.image_urls}
            youtubeUrl={draft.youtube_video_url}
            onImagesChange={(urls) => set("image_urls", urls)}
            onYoutubeChange={(url) => set("youtube_video_url", url)}
          />
        </SheetSection>

        <SheetSection
          title="Açıklama ve SEO"
          hint="Açıklama ürün sayfasında katlanır bir bölümde görünür; SEO alanları boşsa ürün adı ve açıklaması kullanılır."
        >
          <div className="space-y-4">
            <SheetField
              id="sheet-description"
              label="Ürün Açıklaması"
              hint="Kalın, başlık, liste ve bağlantı kullanılabilir. Ürün sayfasında “Ürün Açıklaması” başlığı altında ilk üç satırı görünür, gerisi “Devamını Oku” ile açılır."
            >
              <RichTextEditor
                id="sheet-description"
                labelledBy="sheet-description-label"
                value={draft.description}
                onChange={(html) => set("description", html)}
                placeholder="Malzeme, ölçüler, kutu içeriği, kullanım notları…"
              />
            </SheetField>
            <div className="grid gap-4 lg:grid-cols-2">
              <SheetField id="sheet-meta-title" label="SEO Başlığı">
                <input
                  id="sheet-meta-title"
                  value={draft.metaTitle}
                  onChange={(e) => set("metaTitle", e.target.value)}
                  maxLength={META_TITLE_MAX}
                  placeholder={nameWithCode(draft.name, draft.base_code) || "Ürün adı"}
                  className={sheetInputClass}
                />
                <CharCount value={draft.metaTitle} max={META_TITLE_MAX} />
              </SheetField>
              <SheetField id="sheet-meta-description" label="SEO Açıklaması">
                <input
                  id="sheet-meta-description"
                  value={draft.metaDescription}
                  onChange={(e) => set("metaDescription", e.target.value)}
                  maxLength={META_DESCRIPTION_MAX}
                  placeholder="Arama sonuçlarında görünecek kısa tanıtım"
                  className={sheetInputClass}
                />
                <CharCount value={draft.metaDescription} max={META_DESCRIPTION_MAX} />
              </SheetField>
            </div>
            <SheetField
              id="sheet-slug"
              label="Sayfa Adresi (slug)"
              hint={
                saved || draft.slug
                  ? "Değiştirirseniz eski adres otomatik olarak yeni adrese yönlendirilir; paylaşılmış bağlantılar çalışmaya devam eder."
                  : "Boş bırakılırsa ürün kodu ve adından üretilir (yukarıdaki gibi). Küçük harf, rakam, tire ve nokta."
              }
            >
              <div className="flex items-stretch">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 font-mono text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                  /product/
                </span>
                <input
                  id="sheet-slug"
                  value={draft.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  maxLength={255}
                  placeholder={generatedSlug}
                  spellCheck={false}
                  autoCapitalize="none"
                  className={`${sheetInputClass} rounded-l-none font-mono`}
                />
              </div>
              {/* A saved address stays put through renames (links keep working);
                  this puts it in the code-and-name form on purpose, the old one
                  redirecting here once saved. */}
              {draft.slug && draft.slug !== generatedSlug && (
                <button
                  type="button"
                  onClick={() => set("slug", generatedSlug)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline dark:text-red-400"
                >
                  Koddan ve addan üret: <span className="font-mono">{generatedSlug}</span>
                </button>
              )}
            </SheetField>
          </div>
        </SheetSection>

        <SheetSection
          title="Stok"
          hint={
            draft.colors.length > 0
              ? `${draft.colors.length} renk · her renk kendi kotalarını taşır · toplam ${total.toLocaleString("tr-TR")}`
              : "Her müşteri grubunun kendi kotası; toplam otomatik hesaplanır."
          }
        >
          <StockGrid
            colors={draft.colors}
            stock={draft.stock}
            onColorsChange={(colors) => set("colors", colors)}
            onStockChange={(stock) => set("stock", stock)}
          />
        </SheetSection>

        <SheetSection
          title="Fiyat Tablosu"
          hint="KDV hariç ya da KDV dahil fiyatı yazın; diğeri seçili KDV oranına göre hesaplanır."
        >
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <SheetField id="sheet-vat" label="KDV Oranı" className="w-40">
              <select
                id="sheet-vat"
                value={draft.vatRate}
                onChange={(e) => setVatRate(Number(e.target.value) as VatRate)}
                className={sheetInputClass}
              >
                {VAT_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    %{rate}
                  </option>
                ))}
              </select>
            </SheetField>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Oranı değiştirmek, girilmiş tüm KDV dahil tutarları yeniden hesaplar.
            </p>
          </div>
          <PricingGrid prices={draft.prices} vatRate={draft.vatRate} onChange={setCell} />
        </SheetSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <SheetSection title="Genel Kurallar">
            <RuleSwitch
              id="rule-shipping"
              label="Ücretsiz Kargo"
              hint="Bu ürün için gönderim ücreti firmaya ait."
              checked={draft.rules.is_free_shipping}
              onChange={(v) => set("rules", { ...draft.rules, is_free_shipping: v })}
            />
            <QuantityCondition
              id="rule-ship-qty"
              value={draft.rules.free_shipping_min_quantity ?? null}
              onChange={(value) => set("rules", { ...draft.rules, free_shipping_min_quantity: value })}
            />
            <RuleSwitch
              id="rule-havale"
              label="Havale / EFT İndirimi"
              checked={draft.rules.has_havale_discount}
              onChange={(v) => set("rules", { ...draft.rules, has_havale_discount: v })}
            />
            <RuleSwitch
              id="rule-dealer-havale"
              label="Bayide Havale / EFT İndirimi"
              hint="Havale / EFT indirimi bayi fiyat grubundaki müşteriler için de geçerli."
              checked={draft.rules.has_dealer_havale_discount}
              onChange={(v) => set("rules", { ...draft.rules, has_dealer_havale_discount: v })}
            />
            <RuleSwitch
              id="rule-toptan-havale"
              label="Toptanda Havale / EFT İndirimi"
              hint="Havale / EFT indirimi toptan fiyat grubundaki müşteriler için de geçerli."
              checked={draft.rules.has_toptan_havale_discount}
              onChange={(v) => set("rules", { ...draft.rules, has_toptan_havale_discount: v })}
            />
            <RuleSwitch
              id="rule-cafe-havale"
              label="Kafede Havale / EFT İndirimi"
              hint="Havale / EFT indirimi kafe fiyat grubundaki müşteriler için de geçerli."
              checked={draft.rules.has_cafe_havale_discount}
              onChange={(v) => set("rules", { ...draft.rules, has_cafe_havale_discount: v })}
            />
            <RuleSwitch
              id="rule-volume"
              label="Sepet İndirimi"
              hint={VOLUME_DISCOUNT_HINT}
              checked={draft.rules.has_volume_discount}
              onChange={(v) => set("rules", { ...draft.rules, has_volume_discount: v })}
            />
            <RuleSwitch
              id="rule-earn"
              label="Sultan Puan Kazandırır"
              checked={draft.rules.gives_points}
              onChange={(v) => set("rules", { ...draft.rules, gives_points: v })}
            />
            <RuleSwitch
              id="rule-spend"
              label="Sultan Puan ile Alınabilir"
              checked={draft.rules.can_use_points}
              onChange={(v) => set("rules", { ...draft.rules, can_use_points: v })}
            />
            <RuleSwitch
              id="rule-cart"
              label="Sepet Kuralı"
              hint="Açıkken ürün %50 kuralına girer: sepetin %50'sinden fazlasıysa ücretsiz kargo belirlenen parametre kuralıyla başlar."
              checked={draft.rules.is_cart_rule_applied}
              onChange={(v) => set("rules", { ...draft.rules, is_cart_rule_applied: v })}
            />
          </SheetSection>

          <SheetSection title="Fırsat" hint="Açıkken ürün anasayfadaki Fırsat Ürünleri bölümünde yayınlanır.">
            <RuleSwitch
              id="opp-active"
              label="Fırsat Ürünü"
              checked={opp.is_opportunity}
              onChange={(v) => setOpp({ is_opportunity: v })}
            />
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <SheetField id="opp-price" label="Fırsat Fiyatı (KDV dahil, TL)">
                <input
                  id="opp-price"
                  type="text"
                  inputMode="decimal"
                  value={opp.price}
                  onChange={(e) => setOpp({ price: e.target.value })}
                  disabled={!opp.is_opportunity}
                  placeholder="0,00"
                  className={`${sheetInputClass} text-right tabular-nums`}
                />
              </SheetField>
              <SheetField id="opp-stock" label="Fırsat Stoğu">
                <input
                  id="opp-stock"
                  type="text"
                  inputMode="numeric"
                  value={opp.stock}
                  onChange={(e) => setOpp({ stock: e.target.value })}
                  disabled={!opp.is_opportunity}
                  placeholder="0"
                  className={`${sheetInputClass} text-right tabular-nums`}
                />
              </SheetField>
              <SheetField
                id="opp-ends"
                label="Fırsat Süresi (bitiş)"
                hint="Boş bırakın: fırsat, stoğu bitene kadar sürer."
              >
                <input
                  id="opp-ends"
                  type="datetime-local"
                  value={opp.endsAt}
                  onChange={(e) => setOpp({ endsAt: e.target.value })}
                  disabled={!opp.is_opportunity}
                  className={sheetInputClass}
                />
              </SheetField>
              <SheetField id="opp-color" label="Fırsat Rengi">
                <span className="flex items-center gap-2">
                  <input
                    id="opp-color"
                    type="color"
                    value={opp.color}
                    onChange={(e) => setOpp({ color: e.target.value })}
                    disabled={!opp.is_opportunity}
                    className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 disabled:cursor-not-allowed dark:border-white/15 dark:bg-zinc-900"
                  />
                  <input
                    value={opp.color}
                    onChange={(e) => setOpp({ color: e.target.value })}
                    disabled={!opp.is_opportunity}
                    aria-label="Fırsat rengi kodu"
                    className={`${sheetInputClass} font-mono`}
                  />
                  {/* One click for the house colour, the usual choice. */}
                  <button
                    type="button"
                    onClick={() => setOpp({ color: CRIMSON })}
                    disabled={!opp.is_opportunity}
                    title={`Site kırmızısı (${CRIMSON})`}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: CRIMSON }}
                      aria-hidden
                    />
                    Kırmızı
                  </button>
                </span>
              </SheetField>
            </div>
            <p className="mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Fırsat süresince geçerli kurallar
            </p>
            <RuleSwitch
              id="opp-shipping"
              label="Ücretsiz Kargo"
              checked={opp.opp_is_free_shipping}
              onChange={(v) => setOpp({ opp_is_free_shipping: v })}
            />
            <QuantityCondition
              id="opp-ship-qty"
              value={opp.opp_free_shipping_min_quantity}
              onChange={(value) => setOpp({ opp_free_shipping_min_quantity: value })}
              disabled={!opp.is_opportunity}
            />
            <RuleSwitch
              id="opp-havale"
              label="Havale / EFT İndirimi"
              checked={opp.opp_has_havale_discount}
              onChange={(v) => setOpp({ opp_has_havale_discount: v })}
            />
            <RuleSwitch
              id="opp-volume"
              label="Sepet İndirimi"
              hint={VOLUME_DISCOUNT_HINT}
              checked={opp.opp_has_volume_discount}
              onChange={(v) => setOpp({ opp_has_volume_discount: v })}
            />
            <RuleSwitch
              id="opp-earn"
              label="Sultan Puan Kazandırır"
              checked={opp.opp_gives_points}
              onChange={(v) => setOpp({ opp_gives_points: v })}
            />
            <RuleSwitch
              id="opp-spend"
              label="Sultan Puan ile Alınabilir"
              checked={opp.opp_can_use_points}
              onChange={(v) => setOpp({ opp_can_use_points: v })}
            />
          </SheetSection>
        </div>

        <SheetSection
          title="Birlikte Satılanlar"
          hint={`En fazla ${MAX_CROSS_SELLS} ürün; ürün sayfasında "Birlikte İyi Gider" olarak görünür.`}
        >
          <CrossSellPicker
            selected={draft.crossSells}
            onChange={(cards) => set("crossSells", cards)}
            excludeId={productId}
          />
        </SheetSection>

        {error && <Alert variant="error">{error}</Alert>}
        {saved && !error && (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
            <Check className="h-4 w-4" aria-hidden /> “{saved.name}” kaydedildi · toplam stok{" "}
            {saved.stock_total.toLocaleString("tr-TR")}
          </p>
        )}

        {/* Stays in reach however long the sheet gets. */}
        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-white/10">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {problem ?? (editing ? "Değişiklikler kaydedilmeye hazır." : "Yeni ürün kaydedilmeye hazır.")}
          </p>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
            <Link href={listHref} className={linkButtonClass}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Geri Dön
            </Link>
            <Button type="button" onClick={save} loading={saving} disabled={!!problem} className="h-10! w-auto!">
              <Save className="h-4 w-4" aria-hidden /> {editing ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
