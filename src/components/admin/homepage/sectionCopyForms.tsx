"use client";

import { useId, useRef } from "react";
import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { TextStyleFields } from "@/components/admin/hero/TextStyleFields";
import { useBoxCanvas } from "@/components/admin/homepage/useBoxCanvas";
import { BentoBoxView } from "@/components/home/BentoBoxView";
import { Switch } from "@/components/ui/Switch";

import {
  IconSelect,
  ImageField,
  LinkField,
  Panel,
  StringList,
  TextArea,
  TextField,
} from "@/components/admin/homepage/fields";
import type {
  Category,
  HomeBentoBox,
  HomeBoxText,
  HomeBrandBlurb,
  HomeCampaignBox,
  HomeLoyaltyCopy,
  HomePerk,
  Homepage,
  HomeProductRowCopy,
} from "@/types";

/*
 * The drawers of the sections whose words, pictures and links used to be
 * written into their components (lib/homeSectionCopy): each edits its part of
 * the homepage document, saved with "Kaydet" like the rest.
 */

type Set<K extends keyof Homepage> = (value: Homepage[K]) => void;

/** Where the live figures come from, and how a text takes one. */
function LiveFigures({ placeholders }: { placeholders: { name: string; means: string }[] }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-400">
      <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
      <span>
        Rakamlar canlıdır ve{" "}
        <Link href="/admin/parameters" className="font-medium text-red-600 hover:underline dark:text-red-400">
          Parametreler
        </Link>{" "}
        sayfasından gelir. Metne şu yer tutucuları yazın, mağazada rakamla değişir:{" "}
        {placeholders.map((p, i) => (
          <span key={p.name}>
            {i > 0 && ", "}
            <code className="rounded bg-slate-100 px-1 font-mono text-[11px] text-slate-800 dark:bg-white/10 dark:text-zinc-200">
              {`{${p.name}}`}
            </code>{" "}
            ({p.means})
          </span>
        ))}
        .
      </span>
    </p>
  );
}

// ── Avantaj Çubuğu ───────────────────────────────────────────────────────────

function PerkFields({ perk, onChange, value }: { perk: HomePerk; onChange: (perk: HomePerk) => void; value?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <TextField label="Kırmızı etiket" value={perk.label} max={40} onChange={(label) => onChange({ ...perk, label })} />
        <IconSelect value={perk.icon} onChange={(icon) => onChange({ ...perk, icon })} />
      </div>
      {value}
      <TextField label="Alt satır" value={perk.note} max={160} onChange={(note) => onChange({ ...perk, note })} />
    </div>
  );
}

export function PerksForm({ value, set }: { value: Homepage["perks"]; set: Set<"perks"> }) {
  return (
    <div className="space-y-6">
      <Panel title="Taksit" hint="Bilgi sayfasındaki “Taksit Avantajı” bölümüne bağlanır.">
        <PerkFields
          perk={value.installments}
          onChange={(perk) => set({ ...value, installments: { ...value.installments, ...perk } })}
          value={
            <TextField
              label="Büyük yazı"
              value={value.installments.value}
              max={60}
              onChange={(v) => set({ ...value, installments: { ...value.installments, value: v } })}
            />
          }
        />
      </Panel>
      <Panel
        title="Sepette İndirim"
        hint="Büyük yazı, Parametreler’deki ciro indirimi kademelerinden canlı gelir (ör. %5 – %8); kademe yoksa bu öğe gösterilmez."
      >
        <PerkFields perk={value.volume} onChange={(volume) => set({ ...value, volume })} />
      </Panel>
      <Panel
        title="Havale & EFT"
        hint="Büyük yazı, Parametreler’deki havale indirimi kademelerinden canlı gelir; kademe yoksa bu öğe gösterilmez."
      >
        <PerkFields perk={value.transfer} onChange={(transfer) => set({ ...value, transfer })} />
      </Panel>
    </div>
  );
}

// ── Sizin İçin Seçtiklerimiz ─────────────────────────────────────────────────

export function PicksForm({ value, set }: { value: Homepage["picks"]; set: Set<"picks"> }) {
  return (
    <div className="space-y-6">
      <Panel title="Başlık ve sekmeler" hint="Ürünler kendiliğinden gelir: çok satanlar ve en yeni ürünler.">
        <TextField label="Başlık" value={value.title} max={80} onChange={(title) => set({ ...value, title })} />
        <TextArea label="Alt başlık" value={value.subtitle} max={200} rows={2} onChange={(subtitle) => set({ ...value, subtitle })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="1. sekme (çok satanlar)"
            value={value.bestsellers}
            max={30}
            onChange={(bestsellers) => set({ ...value, bestsellers })}
          />
          <TextField label="2. sekme (yeni gelenler)" value={value.newest} max={30} onChange={(newest) => set({ ...value, newest })} />
        </div>
      </Panel>
      <Panel title="Ücretsiz kargo notu" hint="Başlığın sağındaki kamyonetli not; kurumsal (B2B) hesaplara gösterilmez.">
        <TextField
          label="Üst etiket"
          value={value.shipping_eyebrow}
          max={60}
          onChange={(shipping_eyebrow) => set({ ...value, shipping_eyebrow })}
        />
        <TextArea
          label="Metin"
          value={value.shipping_text}
          max={160}
          rows={2}
          onChange={(shipping_text) => set({ ...value, shipping_text })}
        />
        <LiveFigures placeholders={[{ name: "tutar", means: "ücretsiz kargo sınırı, kalın yazılır" }]} />
      </Panel>
    </div>
  );
}

// ── Lüle Alırken Kararsız Kalacaksınız ───────────────────────────────────────

export function LulesForm({ value, set, categories }: { value: Homepage["lules"]; set: Set<"lules">; categories: Category[] }) {
  return (
    <div className="space-y-6">
      <Panel title="Başlık ve açıklama" hint="Ürünler Lüleler kategorisinden kendiliğinden gelir.">
        <TextField label="Başlık" value={value.title} max={80} onChange={(title) => set({ ...value, title })} />
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">Alt başlıktaki çeşitler (aralarına “|” konur)</p>
          <StringList
            items={value.kinds}
            onChange={(kinds) => set({ ...value, kinds })}
            max={8}
            maxLength={40}
            addLabel="Çeşit ekle"
            placeholder="ör. Sırlı & Sırsız"
          />
        </div>
        <TextField label="Alt başlığın son cümlesi" value={value.closing} max={160} onChange={(closing) => set({ ...value, closing })} />
      </Panel>
      <Panel title="Tümünü gör bağlantısı">
        <TextField label="Yazı" value={value.more} max={40} onChange={(more) => set({ ...value, more })} />
        <LinkField categories={categories} value={value.href} onChange={(href) => set({ ...value, href })} />
      </Panel>
      <Panel title="Kurye notu" hint="Başlığın yanındaki motosikletli not; kurumsal (B2B) hesaplara gösterilmez.">
        <TextField
          label="Üst etiket"
          value={value.courier_eyebrow}
          max={60}
          onChange={(courier_eyebrow) => set({ ...value, courier_eyebrow })}
        />
        <TextField label="Metin" value={value.courier_text} max={120} onChange={(courier_text) => set({ ...value, courier_text })} />
      </Panel>
    </div>
  );
}

// ── SultanPuan ve Kumbara bantları ───────────────────────────────────────────

export function LoyaltyForm({
  value,
  onChange,
  placeholders,
  title,
}: {
  value: HomeLoyaltyCopy;
  onChange: (value: HomeLoyaltyCopy) => void;
  placeholders: { name: string; means: string }[];
  title: string;
}) {
  return (
    <Panel title={title} hint="Başlıktaki oran ve tutar, Parametreler’den canlı gelir; program kapalıyken bant gösterilmez.">
      <TextField label="Alt başlık" value={value.subtitle} max={120} onChange={(subtitle) => onChange({ ...value, subtitle })} />
      <TextArea label="Not" value={value.note} max={200} rows={2} onChange={(note) => onChange({ ...value, note })} />
      <TextField label="Çağrı (madalyonun yanında)" value={value.call} max={40} onChange={(call) => onChange({ ...value, call })} />
      <LiveFigures placeholders={placeholders} />
    </Panel>
  );
}

// ── Kampanya Kutuları ────────────────────────────────────────────────────────

function BoxFields({
  box,
  onChange,
  categories,
  children,
}: {
  box: HomeCampaignBox;
  onChange: (patch: Partial<HomeCampaignBox>) => void;
  categories: Category[];
  children?: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 @2xl:grid-cols-[1fr_15rem]">
      <div className="space-y-3">
        {children}
        <TextField label="Başlık" value={box.title} max={80} onChange={(title) => onChange({ title })} />
        <TextField label="Alt yazı" value={box.subtitle} max={160} onChange={(subtitle) => onChange({ subtitle })} />
        <LinkField categories={categories} value={box.href} onChange={(href) => onChange({ href })} />
      </div>
      <ImageField
        label="Görsel"
        value={box.image}
        onChange={(image) => onChange({ image })}
        hint="Boş: renk geçişli zemin."
      />
    </div>
  );
}

const MINI_NAMES = ["Sağ üst (sol)", "Sağ üst (sağ)", "Sağ alt (geniş)"];

export function CampaignsForm({
  value,
  set,
  categories,
}: {
  value: Homepage["campaigns"];
  set: Set<"campaigns">;
  categories: Category[];
}) {
  const lead = value.lead;
  return (
    <div className="space-y-6">
      <Panel title="Büyük kutu" hint="Solda; kutunun tamamı bağlantıdır.">
        <BoxFields box={lead} categories={categories} onChange={(patch) => set({ ...value, lead: { ...lead, ...patch } })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Üst etiket" value={lead.eyebrow} max={40} onChange={(eyebrow) => set({ ...value, lead: { ...lead, eyebrow } })} />
            <TextField label="Buton yazısı" value={lead.cta} max={40} onChange={(cta) => set({ ...value, lead: { ...lead, cta } })} />
          </div>
        </BoxFields>
      </Panel>
      {value.minis.map((mini, i) => (
        <Panel key={i} title={`Küçük kutu ${i + 1} · ${MINI_NAMES[i]}`}>
          <BoxFields
            box={mini}
            categories={categories}
            onChange={(patch) => set({ ...value, minis: value.minis.map((m, j) => (j === i ? { ...m, ...patch } : m)) })}
          />
        </Panel>
      ))}
    </div>
  );
}

// ── Görsel Vitrin ────────────────────────────────────────────────────────────

/** A per-text setting with one text's value changed (null: back to the box's own); null when none is left. */
function withPart<V>(values: Partial<Record<HomeBoxText, V | null>> | null, part: HomeBoxText, value: V | null) {
  const next = Object.fromEntries(
    Object.entries({ ...values, [part]: value }).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<Record<HomeBoxText, V>>;
  return Object.keys(next).length ? next : null;
}

/** A box's words, placement, size, colour and wash, edited on its own live preview (as a hero slide's). */
function BentoBoxEditor({
  box,
  categories,
  onChange,
}: {
  box: HomeBentoBox;
  categories: Category[];
  onChange: (patch: Partial<HomeBentoBox>) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useBoxCanvas({ box, set: onChange, frame });
  const overlayId = useId();
  const strengthId = useId();
  const style = (part: HomeBoxText) => ({
    size: box.font_sizes?.[part] ?? null,
    color: box.text_colors?.[part] ?? null,
    // Back to the box's own size (the only way: sizes are set by dragging).
    onSize: () => onChange({ font_sizes: withPart(box.font_sizes, part, null) }),
    onColor: (color: string | null) => onChange({ text_colors: withPart(box.text_colors, part, color) }),
  });
  return (
    <div className="grid gap-5 @2xl:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <TextField label="Üst etiket (isteğe bağlı)" value={box.eyebrow} max={60} onChange={(eyebrow) => onChange({ eyebrow })} />
        <TextStyleFields label="Üst etiket" {...style("eyebrow")} />
        <TextArea label="Başlık (isteğe bağlı)" value={box.title} max={120} rows={2} onChange={(title) => onChange({ title })} />
        <TextStyleFields label="Başlık" {...style("title")} />
        <TextArea label="Alt metin (isteğe bağlı)" value={box.subtitle} max={240} rows={2} onChange={(subtitle) => onChange({ subtitle })} />
        <TextStyleFields label="Alt metin" {...style("subtitle")} />
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p id={overlayId} className="text-sm font-medium">
              Koyu katman
              <span className="block text-[11px] font-normal text-slate-500 dark:text-zinc-500">Açık fotoğrafta beyaz yazı okunsun diye alttan koyulaşır.</span>
            </p>
            <Switch checked={box.overlay} onChange={(overlay) => onChange({ overlay })} labelledBy={overlayId} />
          </div>
          {box.overlay && (
            <div className="mt-3 space-y-1">
              <label htmlFor={strengthId} className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Koyuluk: %{box.overlay_strength}
              </label>
              <input
                id={strengthId}
                type="range"
                min={10}
                max={90}
                value={box.overlay_strength}
                onChange={(e) => onChange({ overlay_strength: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>
          )}
        </div>
        <LinkField categories={categories} value={box.href} onChange={(href) => onChange({ href })} />
        <TextField
          label="Görselin açıklaması (alt)"
          value={box.alt}
          max={120}
          onChange={(alt) => onChange({ alt })}
          hint="Ekran okuyucular ve arama motorları için: fotoğrafta ne var."
        />
      </div>
      <div className="space-y-3 self-start @2xl:sticky @2xl:top-0">
        <div ref={frame} {...canvas.pan} className="cursor-move touch-none select-none">
          <BentoBoxView box={box} sizes="320px" editor={{ bind: canvas.bind, selected: canvas.selected, resize: canvas.resize }} />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-500">
          Yazıyı sürükleyip taşıyın; seçili yazıyı kırmızı köşesinden boyutlandırın; fotoğrafı sürükleyip kadrajlayın. Sitedeki kutu
          bunun büyütülmüşüdür.
        </p>
        {box.layout && (
          <button
            type="button"
            onClick={() => onChange({ layout: null })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Konumları sıfırla (alta dizili)
          </button>
        )}
        <ImageField label="Görsel" value={box.image} onChange={(image) => onChange({ image: image ?? "" })} hint="Yatay (3:2) fotoğraf en iyisi." />
      </div>
    </div>
  );
}

export function BentoForm({ value, set, categories }: { value: Homepage["bento"]; set: Set<"bento">; categories: Category[] }) {
  return (
    <div className="space-y-6">
      {value.boxes.map((box, i) => (
        <Panel key={i} title={`Kutu ${i + 1}`} hint={["Solda", "Ortada", "Sağda"][i] ?? undefined}>
          <BentoBoxEditor
            box={box}
            categories={categories}
            onChange={(patch) => set({ boxes: value.boxes.map((b, j) => (j === i ? { ...b, ...patch } : b)) })}
          />
        </Panel>
      ))}
    </div>
  );
}

// ── Sektörde Referans Noktası ────────────────────────────────────────────────

export function StatementForm({ value, set }: { value: Homepage["statement"]; set: Set<"statement"> }) {
  return (
    <Panel title="Sektörde Referans Noktası" hint="İlk cümle görünür; devamı “Devamını Oku” ile açılır (arama motorları ikisini de okur).">
      <TextField label="Başlık" value={value.heading} max={80} onChange={(heading) => set({ ...value, heading })} />
      <TextArea label="Görünen cümle" value={value.lead} max={400} rows={3} onChange={(lead) => set({ ...value, lead })} />
      <TextArea label="Devamı (katlanır)" value={value.rest} max={1000} rows={4} onChange={(rest) => set({ ...value, rest })} />
    </Panel>
  );
}

// ── Markalarımız ─────────────────────────────────────────────────────────────

const HOUSE_BRANDS = [
  { key: "sultan", name: "Sultan Nargile" },
  { key: "oduman", name: "Oduman" },
  { key: "legend", name: "Legend Hookah" },
] as const;

export function BrandShowcaseForm({ value, set }: { value: Homepage["brand_showcase"]; set: Set<"brand_showcase"> }) {
  const setBrand = (key: (typeof HOUSE_BRANDS)[number]["key"], patch: Partial<HomeBrandBlurb>) =>
    set({ ...value, [key]: { ...value[key], ...patch } });
  return (
    <div className="space-y-6">
      <Panel title="Bölüm" hint="Her markanın ürünleri, en pahalıdan başlayarak kendiliğinden gelir.">
        <TextField label="Başlık" value={value.heading} max={60} onChange={(heading) => set({ ...value, heading })} />
        <TextField label="Buton yazısı" value={value.collection} max={40} onChange={(collection) => set({ ...value, collection })} />
      </Panel>
      {HOUSE_BRANDS.map(({ key, name }) => (
        <Panel key={key} title={name}>
          <div className="grid gap-4 @2xl:grid-cols-[1fr_15rem]">
            <TextArea
              label="Tanıtım metni"
              value={value[key].description}
              max={400}
              rows={5}
              onChange={(description) => setBrand(key, { description })}
            />
            <ImageField
              label="Logo"
              value={value[key].logo}
              onChange={(logo) => setBrand(key, { logo })}
              hint="Boş: mağazanın kendi logosu. Şeffaf PNG, yatay."
            />
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ── Közlükler, Oyun & Eğlence ────────────────────────────────────────────────

export function ProductRowForm({
  value,
  onChange,
  title,
  source,
}: {
  value: HomeProductRowCopy;
  onChange: (value: HomeProductRowCopy) => void;
  title: string;
  /** Where its products come from, for the hint. */
  source: string;
}) {
  return (
    <Panel title={title} hint={`Ürünler ${source} kategorisinden kendiliğinden gelir; kategori boşsa satır gösterilmez.`}>
      <TextField label="Başlık" value={value.title} max={80} onChange={(t) => onChange({ ...value, title: t })} />
      <TextArea label="Alt başlık" value={value.subtitle} max={200} rows={2} onChange={(subtitle) => onChange({ ...value, subtitle })} />
      <TextField label="Tümünü gör yazısı" value={value.more} max={40} onChange={(more) => onChange({ ...value, more })} />
    </Panel>
  );
}
