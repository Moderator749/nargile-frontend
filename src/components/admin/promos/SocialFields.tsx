"use client";

import { HeroAsideCards } from "@/components/home/HeroAsideCards";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Input } from "@/components/ui/Input";
import type { PromoBox } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import type { PromoBoxWrite, SocialWidget } from "@/types";

const legend = "px-1 text-sm font-medium text-slate-700 dark:text-zinc-300";
const fixed = "text-xs text-slate-500 dark:text-zinc-400";

/**
 * The fields of the two cards beside the hero, in the order the homepage
 * stacks them: the community card (the shop's channels) on top, the
 * advantages card under it. What a card shows that has no field here is the
 * site's own copy, translated with it; it is named, so nobody looks for it.
 */
export function SocialFields({
  value: v,
  widget,
  set,
}: {
  value: PromoBoxWrite;
  widget: SocialWidget;
  set: (patch: Partial<PromoBoxWrite>) => void;
}) {
  const t = useMessages(homeMessages);
  const setWidget = (patch: Partial<SocialWidget>) => set({ widget: { ...widget, ...patch } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <legend className={legend}>Üst kart — Topluluk (Instagram, YouTube)</legend>
        <Input
          label="Üst etiket"
          value={v.text ?? ""}
          maxLength={240}
          onChange={(e) => set({ text: e.target.value || null })}
          placeholder={t.followUs}
          hint={`Boş: “${t.followUs}”.`}
        />
        <p className={fixed}>Başlık sitenin kendi metni: “{t.aside.channelsTitle}”.</p>
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
      </fieldset>
      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
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
        <p className={fixed}>Başlığın altındaki satır sitenin kendi metni: “{t.aside.advantagesText}”</p>
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
      </fieldset>
    </div>
  );
}

/** The column beside the slider on a desktop: 264px wide, as tall as the slider. */
const COLUMN = { width: 264, height: 536 };

/** The two cards exactly as the homepage draws them (HeroAsideCards), in their column; inert here. */
export function SocialPreview({ value: v }: { value: PromoBoxWrite }) {
  const t = useMessages(homeMessages);
  const box: PromoBox = {
    id: "preview",
    eyebrow: v.eyebrow,
    title: v.title,
    text: v.text ?? undefined,
    href: v.href || "/",
    widget: v.widget,
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Önizleme</p>
      <div className="flex justify-center rounded-xl bg-background p-6">
        <div inert style={COLUMN} className="flex">
          <HeroAsideCards box={box} t={t} preview className="w-full" />
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-500 dark:text-zinc-400">
        Masaüstünde slider’ın yanındaki sütun (kategori menüsü kapalıyken). Tablette yan yana, telefonda alt alta durur.
      </p>
    </div>
  );
}
