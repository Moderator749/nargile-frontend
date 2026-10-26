"use client";

import { useId } from "react";

import { ImageField } from "@/components/admin/homepage/fields";
import { AdvantagesCard, ChannelsCard } from "@/components/home/HeroAsideCards";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Input } from "@/components/ui/Input";
import type { PromoBox } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { PromoBoxWrite, PromoShade, SocialWidget } from "@/types";

const legend = "px-1 text-sm font-semibold text-slate-800 dark:text-zinc-100";
const fixed = "text-xs text-slate-500 dark:text-zinc-400";

/** A card's background photo: upload (or an address), remove, and where its crop centres across it. */
function CardPhotoFields({
  image,
  focus,
  onImage,
  onFocus,
}: {
  image: string | null;
  focus: number;
  onImage: (image: string | null) => void;
  onFocus: (focus: number) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-2 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.03]">
      <ImageField
        label="Arka plan fotoğrafı"
        value={image}
        onChange={onImage}
        hint="Boş: sitenin kendi fotoğrafı. Yazılar soldadır; fotoğrafın konusu gölgenin açıldığı tarafta kalsın."
      />
      {image && (
        <div className="space-y-1">
          <label htmlFor={id} className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
            Odak (yatay): %{focus}
          </label>
          <input
            id={id}
            type="range"
            min={0}
            max={100}
            value={focus}
            onChange={(e) => onFocus(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      )}
    </div>
  );
}

/** "Gölge Yönü": where the card's dark veil is darkest, so the words stay legible. */
const SHADES: { value: PromoShade; label: string }[] = [
  { value: "left", label: "Soldan" },
  { value: "right", label: "Sağdan" },
  { value: "top", label: "Üstten" },
  { value: "bottom", label: "Alttan" },
];

function ShadeField({ value, onChange }: { value: PromoShade; onChange: (shade: PromoShade) => void }) {
  const name = useId();
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">Gölge Yönü</legend>
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
        {SHADES.map((shade) => (
          <label
            key={shade.value}
            className={`flex h-9 cursor-pointer items-center justify-center rounded-md text-xs font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-red-600 ${
              value === shade.value
                ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={shade.value}
              checked={value === shade.value}
              onChange={() => onChange(shade.value)}
              className="sr-only"
            />
            {shade.label}
          </label>
        ))}
      </div>
      <p className={fixed}>Koyu gölgenin başladığı kenar; yazılar o tarafta en iyi okunur. Arapça sayfada sol ve sağ yer değiştirir.</p>
    </fieldset>
  );
}

const fieldset = "space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10";

/**
 * The community card's fields (the top card beside the hero): its two texts,
 * the shop's channels, its photo and its shade. A text left blank shows the
 * site's own copy, named in its placeholder and translated with the site.
 */
export function TopCardFields({
  value: v,
  set,
}: {
  value: PromoBoxWrite;
  set: (patch: Partial<PromoBoxWrite>) => void;
}) {
  const t = useMessages(homeMessages);
  const widget = v.widget;
  const setWidget = (patch: Partial<SocialWidget>) => set({ widget: { ...widget, ...patch } });
  return (
    <fieldset className={fieldset}>
      <legend className={legend}>Üst kart — Topluluk (Instagram, YouTube)</legend>
      <Input
        label="Üst etiket"
        value={v.text ?? ""}
        maxLength={240}
        onChange={(e) => set({ text: e.target.value || null })}
        placeholder={t.followUs}
        hint={`Boş: “${t.followUs}”.`}
      />
      <Input
        label="Başlık"
        value={v.top_title ?? ""}
        maxLength={120}
        onChange={(e) => set({ top_title: e.target.value || null })}
        placeholder={t.aside.channelsTitle}
        hint={`Boş: “${t.aside.channelsTitle}”.`}
      />
      <div className="grid grid-cols-[1fr_8rem] gap-3">
        <Input
          label="Instagram bağlantısı"
          value={widget.instagram_href ?? ""}
          maxLength={300}
          onChange={(e) => setWidget({ instagram_href: e.target.value || null })}
          placeholder="https://www.instagram.com/…"
        />
        <Input label="Instagram etiketi" value={widget.instagram_label} maxLength={40} onChange={(e) => setWidget({ instagram_label: e.target.value })} />
      </div>
      <div className="grid grid-cols-[1fr_8rem] gap-3">
        <Input
          label="YouTube bağlantısı"
          value={widget.youtube_href ?? ""}
          maxLength={300}
          onChange={(e) => setWidget({ youtube_href: e.target.value || null })}
          placeholder="https://www.youtube.com/@…"
        />
        <Input label="YouTube etiketi" value={widget.youtube_label} maxLength={40} onChange={(e) => setWidget({ youtube_label: e.target.value })} />
      </div>
      <p className={fixed}>Boş bırakılan kanal gösterilmez. Bağlantılar yeni sekmede açılır.</p>
      <CardPhotoFields
        image={v.top_card_image_url}
        focus={v.top_card_focus_x}
        onImage={(top_card_image_url) => set({ top_card_image_url })}
        onFocus={(top_card_focus_x) => set({ top_card_focus_x })}
      />
      <ShadeField value={v.top_shade} onChange={(top_shade) => set({ top_shade })} />
    </fieldset>
  );
}

/** The advantages card's fields (the bottom card): every text on it, its link, photo and shade. */
export function BottomCardFields({
  value: v,
  set,
}: {
  value: PromoBoxWrite;
  set: (patch: Partial<PromoBoxWrite>) => void;
}) {
  const t = useMessages(homeMessages);
  const widget = v.widget;
  const setWidget = (patch: Partial<SocialWidget>) => set({ widget: { ...widget, ...patch } });
  return (
    <fieldset className={fieldset}>
      <legend className={legend}>Alt kart — Ayrıcalıklar & Avantajlar</legend>
      <Input
        label="Üst etiket"
        value={v.eyebrow}
        maxLength={60}
        onChange={(e) => set({ eyebrow: e.target.value })}
        placeholder={t.aside.advantagesEyebrow}
        hint={`Baştaki ve sondaki • işaretleri gösterilmez. Boş: “${t.aside.advantagesEyebrow}”.`}
      />
      <Input label="Başlık" value={v.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder={t.aside.advantagesTitle} />
      <div className="space-y-1.5">
        <label htmlFor="promo-bottom-text" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
          Açıklama
        </label>
        <textarea
          id="promo-bottom-text"
          rows={3}
          value={v.bottom_text ?? ""}
          maxLength={300}
          onChange={(e) => set({ bottom_text: e.target.value || null })}
          placeholder={t.aside.advantagesText}
          className="block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className={fixed}>Başlığın altındaki satır. Boş: sitenin kendi metni (yer tutucudaki).</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Bağlantı metni"
          value={widget.anchor_label}
          maxLength={40}
          onChange={(e) => setWidget({ anchor_label: e.target.value })}
          hint="Kısa tutun: dar kartta tek satıra sığmalı."
        />
        <Input
          label="Bağlantı"
          value={v.href}
          maxLength={300}
          onChange={(e) => set({ href: e.target.value })}
          placeholder="/bilgi/ayricaliklar-ve-avantajlar"
          hint="Kartın tamamı bu adrese gider."
        />
      </div>
      <CardPhotoFields
        image={v.bottom_card_image_url}
        focus={v.bottom_card_focus_x}
        onImage={(bottom_card_image_url) => set({ bottom_card_image_url })}
        onFocus={(bottom_card_focus_x) => set({ bottom_card_focus_x })}
      />
      <ShadeField value={v.bottom_shade} onChange={(bottom_shade) => set({ bottom_shade })} />
    </fieldset>
  );
}

/** The form as the storefront reads it (`lib/home`'s PromoBox). */
export function previewBox(v: PromoBoxWrite): PromoBox {
  const photo = (src: string | null, focusX: number) => (src?.trim() ? { src: src.trim(), focusX } : null);
  return {
    id: "preview",
    eyebrow: v.eyebrow,
    title: v.title,
    text: v.text ?? undefined,
    href: v.href || "/",
    widget: v.widget,
    photos: { top: photo(v.top_card_image_url, v.top_card_focus_x), bottom: photo(v.bottom_card_image_url, v.bottom_card_focus_x) },
    topTitle: v.top_title ?? undefined,
    bottomText: v.bottom_text ?? undefined,
    shades: { top: v.top_shade, bottom: v.bottom_shade },
  };
}

/**
 * One card exactly as the homepage draws it (ChannelsCard / AdvantagesCard),
 * at its desktop size — 264px wide, half the slider's height — inert here.
 */
export function CardPreview({ value, card }: { value: PromoBoxWrite; card: "top" | "bottom" }) {
  const t = useMessages(homeMessages);
  const box = previewBox(value);
  const Card = card === "top" ? ChannelsCard : AdvantagesCard;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Önizleme</p>
      <div className="flex justify-center rounded-xl bg-background p-6">
        <div inert style={CARD_SIZE} className="flex flex-col">
          <Card box={box} t={t} />
        </div>
      </div>
    </div>
  );
}

/** A card beside the slider on a desktop: the 264px column, half its 536px less the gap. */
const CARD_SIZE = { width: 264, height: 260 };
