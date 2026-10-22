"use client";

import { useEffect, useId, useState } from "react";

import { ContentEditor, adminSelectClass, isImageUrl, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { SlideCanvas } from "@/components/admin/hero/SlideCanvas";
import { TextStyleFields } from "@/components/admin/hero/TextStyleFields";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { adminGetHomepage, adminHeroSlides } from "@/lib/adminApi";
import type { HeroSlideContent, HeroSlideWrite, HeroTextColors, HeroTextSizes } from "@/types";

type SlideText = "eyebrow" | "title" | "subtitle";

/** A slide text over several lines: Enter starts a new one, and the homepage keeps it. */
function SlideTextArea({
  label,
  value,
  maxLength,
  rows,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  rows: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
        <span className="text-xs font-normal text-slate-400 tabular-nums">
          {value.length}/{maxLength}
        </span>
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
    </div>
  );
}

/** A size or colour for one text, the rest kept; null when none is left. */
function withOne<T extends HeroTextSizes | HeroTextColors>(all: T | null, text: SlideText, value: string | number | null): T | null {
  const next = { ...(all ?? {}), [text]: value } as T;
  return Object.values(next).some(Boolean) ? next : null;
}

const blank = (): HeroSlideWrite => ({
  eyebrow: "",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_href: "/catalog",
  guest_cta_label: null,
  guest_cta_href: null,
  image_url: null,
  requires: null,
  text_align: "center",
  image_focus_x: 50,
  image_focus_y: 50,
  image_zoom: 100,
  layout: null,
  enable_overlay: true,
  font_sizes: null,
  text_colors: null,
  mobile_layout: null,
  mobile_font_sizes: null,
  mobile_bg_position: null,
  is_active: true,
  sort_order: 100,
});

const toWrite = (s: HeroSlideContent): HeroSlideWrite => ({
  eyebrow: s.eyebrow,
  title: s.title,
  subtitle: s.subtitle,
  cta_label: s.cta_label,
  cta_href: s.cta_href,
  guest_cta_label: s.guest_cta_label,
  guest_cta_href: s.guest_cta_href,
  image_url: s.image_url,
  requires: s.requires,
  text_align: s.text_align,
  image_focus_x: s.image_focus_x,
  image_focus_y: s.image_focus_y,
  image_zoom: s.image_zoom,
  layout: s.layout,
  enable_overlay: s.enable_overlay ?? true,
  font_sizes: s.font_sizes ?? null,
  text_colors: s.text_colors ?? null,
  mobile_layout: s.mobile_layout ?? null,
  mobile_font_sizes: s.mobile_font_sizes ?? null,
  mobile_bg_position: s.mobile_bg_position ?? null,
  is_active: s.is_active,
  sort_order: s.sort_order,
});

function validate(v: HeroSlideWrite): string | null {
  // The button is optional; one with a text needs a link.
  if (v.cta_label.trim() && !isSiteOrHttpsLink(v.cta_href)) return "Buton için geçerli bir bağlantı (/… veya https://…) girin.";
  const colors = Object.values(v.text_colors ?? {}).filter(Boolean) as string[];
  if (colors.some((c) => !/^#[0-9a-fA-F]{6}$/.test(c))) return "Renkler #RRGGBB biçiminde olmalı (ör. #FFFFFF).";
  if (!!v.guest_cta_label?.trim() !== !!v.guest_cta_href?.trim()) return "Misafir butonu için hem metin hem bağlantı girin.";
  if (v.guest_cta_href?.trim() && !isSiteOrHttpsLink(v.guest_cta_href)) return "Misafir butonu bağlantısı geçersiz.";
  if (v.image_url?.trim() && !isImageUrl(v.image_url)) return "Görsel URL'si https:// ile başlamalı, boşluk/tırnak içermemeli.";
  return null;
}

/** Admin: homepage hero slider (Module 5). */
export function AdminHeroView() {
  // Each slide's portrait photo for phones ("Mobil Yönetim"), for the canvas's "Mobil" view.
  const [mobileImages, setMobileImages] = useState<Record<number, string>>({});
  useEffect(() => {
    const controller = new AbortController();
    adminGetHomepage(controller.signal)
      .then((res) => setMobileImages(Object.fromEntries((res.data.mobile?.hero_images ?? []).map((e) => [e.slide_id, e.image]))))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <ContentEditor
      title="Hero Slider"
      description="Ana sayfanın üstündeki kayan büyük bant: başlık, alt metin, butonlar ve arka plan görseli."
      noun="slayt"
      stacked
      api={adminHeroSlides}
      blank={blank}
      toWrite={toWrite}
      summary={(s) => ({ primary: s.title.replace(/\s+/g, " ").trim() || s.eyebrow || "Yalnızca görsel (yazısız)", secondary: [s.eyebrow, s.requires === "flash_sales" ? "yalnızca fırsat varken" : ""].filter(Boolean).join(" · ") })}
      validate={validate}
      listNote="İlk sıradaki etkin slaytın başlığı sayfanın ana başlığıdır (H1)."
      fields={(v, set, current) => {
        const style = (text: SlideText, label: string) => (
          <TextStyleFields
            label={label}
            size={v.font_sizes?.[text]}
            mobileSize={v.mobile_font_sizes?.[text]}
            color={v.text_colors?.[text]}
            onSize={(size) => set({ font_sizes: withOne(v.font_sizes, text, size) })}
            onMobileSize={(size) => set({ mobile_font_sizes: withOne(v.mobile_font_sizes, text, size) })}
            onColor={(color) => set({ text_colors: withOne(v.text_colors, text, color) })}
          />
        );
        return (
        <>
          <Input label="Üst etiket (isteğe bağlı)" value={v.eyebrow} maxLength={60} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="ör. Nargile Kömürleri" />
          {style("eyebrow", "Üst etiket")}
          <SlideTextArea
            label="Başlık (isteğe bağlı)"
            value={v.title}
            maxLength={120}
            rows={2}
            onChange={(title) => set({ title })}
            placeholder="ör. Saf ısı.&#10;Kesintisiz seans."
          />
          {style("title", "Başlık")}
          <SlideTextArea label="Alt metin (isteğe bağlı)" value={v.subtitle} maxLength={240} rows={3} onChange={(subtitle) => set({ subtitle })} />
          {style("subtitle", "Alt metin")}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Buton metni (isteğe bağlı)"
              value={v.cta_label}
              maxLength={40}
              onChange={(e) => set({ cta_label: e.target.value })}
              hint="Boş bırakılırsa slaytta buton gösterilmez."
            />
            <Input label="Buton bağlantısı" value={v.cta_href} maxLength={300} onChange={(e) => set({ cta_href: e.target.value })} placeholder="/catalog" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Misafir butonu (isteğe bağlı)"
              value={v.guest_cta_label ?? ""}
              maxLength={40}
              onChange={(e) => set({ guest_cta_label: e.target.value || null })}
              placeholder="ör. Bayi Girişi"
            />
            <Input
              label="Misafir bağlantısı"
              value={v.guest_cta_href ?? ""}
              maxLength={300}
              onChange={(e) => set({ guest_cta_href: e.target.value || null })}
              placeholder="/login?next=/catalog"
            />
          </div>
          <Input
            label="Arka plan görseli URL (isteğe bağlı)"
            value={v.image_url ?? ""}
            maxLength={500}
            onChange={(e) => set({ image_url: e.target.value || null })}
            placeholder="https://…/kampanya.jpg"
            hint="Koyu katman açıkken fotoğrafın üzerine %30 karartma gelir; kapatınca fotoğraf olduğu gibi görünür."
          />
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10">
            <div>
              <p id="slide-overlay" className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Koyu katman (%30)
              </p>
              <p id="slide-overlay-hint" className="text-xs text-slate-500 dark:text-zinc-400">
                Açık: yazılar her fotoğrafta okunur. Kapalı: fotoğraf karartılmadan, olduğu gibi görünür.
              </p>
            </div>
            <Switch
              checked={v.enable_overlay}
              onChange={(enable_overlay) => set({ enable_overlay })}
              labelledBy="slide-overlay"
              describedBy="slide-overlay-hint"
            />
          </div>
          <SlideCanvas
            value={v}
            set={set}
            image={current?.image ?? v.image_url}
            mobileImage={current ? (mobileImages[current.id] ?? null) : null}
          />
          <div className="space-y-1.5">
            <label htmlFor="slide-requires" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Gösterim koşulu
            </label>
            <select
              id="slide-requires"
              value={v.requires ?? ""}
              onChange={(e) => set({ requires: e.target.value === "flash_sales" ? "flash_sales" : null })}
              className={adminSelectClass}
            >
              <option value="">Her zaman</option>
              <option value="flash_sales">Yalnızca yayında fırsat ürünü varken</option>
            </select>
          </div>
        </>
        );
      }}
    />
  );
}
