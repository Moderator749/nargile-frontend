"use client";

import { AdvantagesCard, ChannelsCard } from "@/components/home/HeroAsideCards";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { PromoImageField } from "@/components/admin/promos/PromoImageField";
import { inputClass } from "@/components/admin/homepage/fields";
import { Input } from "@/components/ui/Input";
import type { PromoBox } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { PromoBoxWrite, SocialWidget } from "@/types";

const legend = "px-1 text-sm font-semibold text-slate-800 dark:text-zinc-100";
const fixed = "text-xs text-slate-500 dark:text-zinc-400";

const fieldset = "space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10";

/**
 * The community card's fields (the top card beside the hero): its two texts,
 * the shop's channels. A text left blank shows the site's own copy, named in
 * its placeholder and translated with the site. Its background: the shop's
 * neon-sign picture unless one is uploaded here (PromoImageField).
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
      <PromoImageField
        value={v.top_card_image_url}
        focusX={v.top_card_focus_x}
        fallback={SHOP_PHOTO.top}
        onChange={(top_card_image_url) => set({ top_card_image_url })}
        onFocusX={(top_card_focus_x) => set({ top_card_focus_x })}
      />
    </fieldset>
  );
}

/** The shop's own pictures (public/images/promo), shown while a card has none of its own. */
const SHOP_PHOTO = { top: "/images/promo/sosyal.webp", bottom: "/images/promo/kazanansizolun.webp" };

/** The advantages card's lines: as many inputs as the card has room for. */
const MAX_FEATURES = 4;

/** The advantages card's fields (the bottom card): every text on it, its lines, its link and its picture. */
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
      <FeatureLines value={v.features} onChange={(features) => set({ features })} />
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
      <PromoImageField
        value={v.bottom_card_image_url}
        focusX={v.bottom_card_focus_x}
        fallback={SHOP_PHOTO.bottom}
        onChange={(bottom_card_image_url) => set({ bottom_card_image_url })}
        onFocusX={(bottom_card_focus_x) => set({ bottom_card_focus_x })}
      />
    </fieldset>
  );
}

/**
 * The advantages card's short lines, one input each. All blank: the site's own
 * lines, which follow the live free-shipping threshold and SultanPuan rate and
 * are translated; typed lines are shown as typed, in every language.
 */
function FeatureLines({ value, onChange }: { value: string[] | null; onChange: (lines: string[] | null) => void }) {
  const t = useMessages(homeMessages);
  const lines = Array.from({ length: MAX_FEATURES }, (_, i) => value?.[i] ?? "");
  const setLine = (i: number, text: string) => {
    const next = lines.map((line, j) => (j === i ? text : line));
    // Trailing blanks dropped; none left = the site's own lines.
    while (next.length && !next[next.length - 1].trim()) next.pop();
    onChange(next.length ? next : null);
  };
  const own = [t.aside.featureOriginal, t.aside.featureShipping("…"), t.aside.featureLoyalty("…")];
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Özellik satırları</p>
      {lines.map((line, i) => (
        <input
          key={i}
          value={line}
          maxLength={60}
          aria-label={`Özellik satırı ${i + 1}`}
          placeholder={value?.some((l) => l.trim()) ? "" : own[i] ?? ""}
          onChange={(e) => setLine(i, e.target.value)}
          className={inputClass}
        />
      ))}
      <p className={fixed}>
        En fazla 4 kısa satır (~30 karakter, dar kartta tek satıra sığsın); her biri onay işaretiyle gösterilir. Hepsi boş:
        sitenin kendi satırları (güncel ücretsiz kargo limiti ve SultanPuan oranıyla, her dilde çevrili). 1024–1279 px
        genişlikte kart dar olduğundan liste gizlenir.
      </p>
    </div>
  );
}

/** The form as the storefront reads it (`lib/home`'s PromoBox). */
export function previewBox(v: PromoBoxWrite): PromoBox {
  return {
    id: "preview",
    eyebrow: v.eyebrow,
    title: v.title,
    text: v.text ?? undefined,
    href: v.href || "/",
    widget: v.widget,
    topTitle: v.top_title ?? undefined,
    bottomText: v.bottom_text ?? undefined,
    topImage: v.top_card_image_url ?? undefined,
    topFocusX: v.top_card_focus_x,
    bottomImage: v.bottom_card_image_url ?? undefined,
    bottomFocusX: v.bottom_card_focus_x,
    features: v.features?.some((f) => f.trim()) ? v.features.filter((f) => f.trim()) : undefined,
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
