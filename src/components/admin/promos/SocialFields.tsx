"use client";

import { PromoSocialCard } from "@/components/home/PromoSocialCard";
import { Input } from "@/components/ui/Input";
import type { PromoBox } from "@/lib/home";
import type { PromoBoxWrite, SocialWidget } from "@/types";

/** The fields of a "Sosyal & Avantaj Widget" card: its top band (advantages) and bottom band (channels). */
export function SocialFields({
  value: v,
  widget,
  set,
}: {
  value: PromoBoxWrite;
  widget: SocialWidget;
  set: (patch: Partial<PromoBoxWrite>) => void;
}) {
  const setWidget = (patch: Partial<SocialWidget>) => set({ widget: { ...widget, ...patch } });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Üst bölüm — avantajlar / CTA</legend>
        <Input label="Üst etiket" value={v.eyebrow} maxLength={60} onChange={(e) => set({ eyebrow: e.target.value })} placeholder="Ayrıcalıklar & Avantajlar" hint="Baştaki ve sondaki • işaretleri otomatik eklenir." />
        <Input label="Başlık" value={v.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} placeholder="Hacim büyür. Maliyet küçülür." />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Buton metni"
            value={widget.anchor_label}
            maxLength={40}
            onChange={(e) => setWidget({ anchor_label: e.target.value })}
            hint="Kısa tutun: dar kartta tek satıra sığmalı."
          />
          <Input
            label="Buton bağlantısı"
            value={v.href}
            maxLength={300}
            onChange={(e) => set({ href: e.target.value })}
            placeholder="/#avantajlar"
            hint="/#avantajlar: sayfada yumuşakça kayar."
          />
        </div>
      </fieldset>
      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Alt bölüm — sosyal medya</legend>
        <Input label="Başlık / etiket" value={v.text ?? ""} maxLength={240} onChange={(e) => set({ text: e.target.value || null })} placeholder="BİZİ TAKİP EDİN" />
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
        <p className="text-xs text-slate-500 dark:text-zinc-400">Boş bırakılan kanal gösterilmez. Bağlantılar yeni sekmede açılır.</p>
      </fieldset>
    </div>
  );
}

/** The card at its widest: a third of the 952 px row, less two 16 px gaps. */
const CARD_WIDTH = 920 / 3;

/** The widget as the storefront renders it, at a card's real width; inert here. */
export function SocialPreview({ value: v }: { value: PromoBoxWrite }) {
  const box: PromoBox = {
    id: "preview",
    eyebrow: v.eyebrow,
    title: v.title || "Başlık",
    text: v.text ?? undefined,
    href: v.href || "/",
    widget: v.widget,
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Önizleme</p>
      <div className="flex flex-wrap items-start justify-center gap-6 rounded-xl bg-background p-6">
        {/* The widest the card gets (side by side) and a phone-width card. */}
        <div inert className="flex" style={{ width: CARD_WIDTH }}>
          <PromoSocialCard box={box} preview />
        </div>
        <div inert className="flex" style={{ width: 230 }}>
          <PromoSocialCard box={box} preview />
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-500 dark:text-zinc-400">Solda geniş ekrandaki kart, sağda dar (tablet) kart: dar kartta kanal butonları alt alta dizilir.</p>
    </div>
  );
}
