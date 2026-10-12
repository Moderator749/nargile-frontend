"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

import { ContentEditor, adminSelectClass, isImageUrl, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { Input } from "@/components/ui/Input";
import { adminHeroSlides } from "@/lib/adminApi";
import type { HeroSlideContent, HeroSlideWrite, HeroTextAlign } from "@/types";

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
  is_active: s.is_active,
  sort_order: s.sort_order,
});

function validate(v: HeroSlideWrite): string | null {
  if (!v.title.trim()) return "Başlık gerekli.";
  if (!v.cta_label.trim() || !isSiteOrHttpsLink(v.cta_href)) return "Buton metni ve geçerli bir bağlantı (/… veya https://…) gerekli.";
  if (!!v.guest_cta_label?.trim() !== !!v.guest_cta_href?.trim()) return "Misafir butonu için hem metin hem bağlantı girin.";
  if (v.guest_cta_href?.trim() && !isSiteOrHttpsLink(v.guest_cta_href)) return "Misafir butonu bağlantısı geçersiz.";
  if (v.image_url?.trim() && !isImageUrl(v.image_url)) return "Görsel URL'si https:// ile başlamalı, boşluk/tırnak içermemeli.";
  return null;
}

const ALIGNMENTS: { value: HeroTextAlign; label: string; Icon: typeof AlignLeft }[] = [
  { value: "left", label: "Sola", Icon: AlignLeft },
  { value: "center", label: "Ortaya", Icon: AlignCenter },
  { value: "right", label: "Sağa", Icon: AlignRight },
];

const rangeClass = "h-2 w-full cursor-pointer accent-red-600";

/**
 * Text alignment and the photo's crop: a focal point and a zoom, previewed on a
 * slide-shaped frame so the admin sees what the visitor will.
 */
function SlideLayoutFields({
  value: v,
  set,
  image,
}: {
  value: HeroSlideWrite;
  set: (patch: Partial<HeroSlideWrite>) => void;
  image: string | null;
}) {
  const slider = (key: "image_focus_x" | "image_focus_y" | "image_zoom", label: string, min: number, max: number, unit: string) => (
    <label className="block space-y-1">
      <span className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
        {label}
        <span className="font-mono tabular-nums">
          {v[key]}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={v[key]}
        onChange={(e) => set({ [key]: Number(e.target.value) })}
        className={rangeClass}
      />
    </label>
  );

  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Yerleşim & görsel kırpma</legend>
      <div role="radiogroup" aria-label="Metin hizası" className="flex gap-1.5">
        {ALIGNMENTS.map(({ value, label, Icon }) => {
          const active = v.text_align === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => set({ text_align: value })}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                active
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          );
        })}
      </div>

      {/* A slide-shaped preview: the same crop, focal point and alignment. */}
      <div className="relative aspect-[16/7] overflow-hidden rounded-lg bg-zinc-900">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- a live preview of an arbitrary URL
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: `${v.image_focus_x}% ${v.image_focus_y}%`,
              transform: `scale(${v.image_zoom / 100})`,
              transformOrigin: `${v.image_focus_x}% ${v.image_focus_y}%`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/35" />
        <div
          className={`relative flex h-full flex-col justify-center px-4 text-white ${
            v.text_align === "left" ? "items-start text-left" : v.text_align === "right" ? "items-end text-right" : "items-center text-center"
          }`}
        >
          <p className="text-[8px] uppercase tracking-[0.3em] text-white/70">{v.eyebrow || "Üst etiket"}</p>
          <p className="mt-1 line-clamp-2 max-w-[80%] text-sm font-semibold leading-tight">{v.title || "Başlık"}</p>
          <span className="mt-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold">{v.cta_label || "Buton"}</span>
        </div>
        {!image && (
          <p className="absolute bottom-1.5 right-2 text-[10px] text-white/50">Görsel yok — kırpma görseli olan slaytta görünür</p>
        )}
      </div>

      {slider("image_focus_x", "Odak — yatay", 0, 100, "%")}
      {slider("image_focus_y", "Odak — dikey", 0, 100, "%")}
      {slider("image_zoom", "Yakınlaştırma", 100, 200, "%")}
    </fieldset>
  );
}

/** Admin: homepage hero slider (Module 5). */
export function AdminHeroView() {
  return (
    <ContentEditor
      title="Hero Slider"
      description="Ana sayfanın üstündeki kayan büyük bant: başlık, alt metin, butonlar ve arka plan görseli."
      noun="slayt"
      api={adminHeroSlides}
      blank={blank}
      toWrite={toWrite}
      summary={(s) => ({ primary: s.title, secondary: [s.eyebrow, s.requires === "flash_sales" ? "yalnızca fırsat varken" : ""].filter(Boolean).join(" · ") })}
      validate={validate}
      listNote="İlk sıradaki etkin slaytın başlığı sayfanın ana başlığıdır (H1)."
      fields={(v, set, current) => (
        <>
          <Input label="Üst etiket" value={v.eyebrow} maxLength={60} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="ör. Nargile Kömürleri" />
          <Input label="Başlık" value={v.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="ör. Saf ısı. Kesintisiz seans." />
          <Input label="Alt metin" value={v.subtitle} maxLength={240} onChange={(e) => set({ subtitle: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Buton metni" value={v.cta_label} maxLength={40} onChange={(e) => set({ cta_label: e.target.value })} />
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
            hint="Koyu, sade fotoğraflar en iyisi: %30 opaklıkla gösterilir."
          />
          <SlideLayoutFields value={v} set={set} image={current?.image ?? v.image_url} />
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
      )}
    />
  );
}
