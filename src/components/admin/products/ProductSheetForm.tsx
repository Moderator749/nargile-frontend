"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Check, Package, Save } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminShell";
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
  withVat,
  type CellDraft,
  type SheetDraft,
  type VatRate,
} from "@/components/admin/products/sheetDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminCreateProductSheet, adminGetProductSheet, adminUpdateProductSheet } from "@/lib/adminApi";
import { fetchCategories } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { Category, CurrencyType, SavedProductSheet, SheetSegment } from "@/types";

/** The crimson of the site's primary buttons (red-600), as a one-click preset. */
const CRIMSON = "#DC2626";

// What a search result actually shows, and what the columns hold.
const META_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 160;
const DESCRIPTION_MAX = 8000;

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
  const editing = !!productId;
  const [draft, setDraft] = useState<SheetDraft>(emptyDraft);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedProductSheet | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal)
      .then(setCategories)
      .catch(() => {
        // Non-critical: the category select stays empty.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    adminGetProductSheet(productId, controller.signal)
      .then((sheet) => {
        setDraft(draftFromSheet(sheet));
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setError(getApiErrorMessage(err, "Ürün yüklenemedi."));
        setLoading(false);
      });
    return () => controller.abort();
  }, [productId]);

  const set = <K extends keyof SheetDraft>(key: K, value: SheetDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setCell = (currency: CurrencyType, segment: SheetSegment, cell: CellDraft) =>
    setDraft((d) => ({ ...d, prices: { ...d.prices, [currency]: { ...d.prices[currency], [segment]: cell } } }));

  /** A new rate re-derives every KDV dahil box that has a net price behind it. */
  const setVatRate = (vatRate: VatRate) =>
    setDraft((d) => ({
      ...d,
      vatRate,
      prices: Object.fromEntries(
        Object.entries(d.prices).map(([currency, row]) => [
          currency,
          Object.fromEntries(
            Object.entries(row).map(([segment, cell]) => [segment, { ...cell, incl: withVat(cell.excl, vatRate) }]),
          ),
        ]),
      ) as SheetDraft["prices"],
    }));

  const problem = useMemo(() => draftProblem(draft), [draft]);
  const total = draftStockTotal(draft);

  async function save() {
    if (saving || problem) return;
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const payload = toPayload(draft);
      const sheet = productId
        ? await adminUpdateProductSheet(productId, payload)
        : await adminCreateProductSheet(payload);
      setSaved(sheet);
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
              <input id="sheet-brand" value={draft.brand} onChange={(e) => set("brand", e.target.value)} className={sheetInputClass} />
            </SheetField>
            <SheetField id="sheet-category" label="Kategori">
              <select
                id="sheet-category"
                value={draft.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className={sheetInputClass}
              >
                <option value="">Kategorisiz</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </SheetField>
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
              hint="Satır başları korunur. Ürün sayfasında “Ürün Açıklaması” başlığı altında açılır."
            >
              <textarea
                id="sheet-description"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                rows={6}
                maxLength={DESCRIPTION_MAX}
                placeholder="Malzeme, ölçüler, kutu içeriği, kullanım notları…"
                className={`${sheetInputClass} h-auto! resize-y py-2 leading-6`}
              />
            </SheetField>
            <div className="grid gap-4 lg:grid-cols-2">
              <SheetField id="sheet-meta-title" label="SEO Başlığı">
                <input
                  id="sheet-meta-title"
                  value={draft.metaTitle}
                  onChange={(e) => set("metaTitle", e.target.value)}
                  maxLength={META_TITLE_MAX}
                  placeholder={draft.name || "Ürün adı"}
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

        <SheetSection title="Fiyat Tablosu" hint="KDV hariç fiyatı yazın; KDV dahil otomatik hesaplanır.">
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
              id="rule-volume"
              label="Sepet İndirimi"
              hint={VOLUME_DISCOUNT_HINT}
              checked={draft.rules.has_volume_discount}
              onChange={(v) => set("rules", { ...draft.rules, has_volume_discount: v })}
            />
            <RuleSwitch
              id="rule-earn"
              label="ParaPuan Kazandırır"
              checked={draft.rules.gives_points}
              onChange={(v) => set("rules", { ...draft.rules, gives_points: v })}
            />
            <RuleSwitch
              id="rule-spend"
              label="ParaPuan ile Alınabilir"
              checked={draft.rules.can_use_points}
              onChange={(v) => set("rules", { ...draft.rules, can_use_points: v })}
            />
            <RuleSwitch
              id="rule-cart"
              label="Sepet Kuralı"
              hint="ücretsiz kargo için sepet kargo limitinin %50'sini geçemez."
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
              label="ParaPuan Kazandırır"
              checked={opp.opp_gives_points}
              onChange={(v) => setOpp({ opp_gives_points: v })}
            />
            <RuleSwitch
              id="opp-spend"
              label="ParaPuan ile Alınabilir"
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
            <Link
              href="/admin/products"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
            >
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
