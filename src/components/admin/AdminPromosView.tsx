"use client";

import { ContentEditor, adminSelectClass, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { SocialFields, SocialPreview } from "@/components/admin/promos/SocialFields";
import { adminPromoBoxes } from "@/lib/adminApi";
import type { PromoBoxContent, PromoBoxWrite, SocialWidget } from "@/types";

/** What a new box starts with. */
const DEFAULT_WIDGET: SocialWidget = {
  instagram_href: "https://www.instagram.com/sultannargile_bahcelievler",
  instagram_label: "Instagram",
  youtube_href: "https://www.youtube.com/@sultannargile1982",
  youtube_label: "YouTube",
  anchor_label: "Keşfet",
};

const blank = (): PromoBoxWrite => ({
  eyebrow: "Ayrıcalıklar & Avantajlar",
  title: "",
  text: null,
  href: "/bilgi/ayricaliklar-ve-avantajlar",
  requires: null,
  widget: DEFAULT_WIDGET,
  top_card_image_url: null,
  top_card_focus_x: 50,
  bottom_card_image_url: null,
  bottom_card_focus_x: 50,
  is_active: true,
  sort_order: 100,
});

const toWrite = (b: PromoBoxContent): PromoBoxWrite => ({
  eyebrow: b.eyebrow,
  title: b.title,
  text: b.text,
  href: b.href,
  requires: b.requires,
  widget: b.widget ?? DEFAULT_WIDGET,
  top_card_image_url: b.top_card_image_url ?? null,
  top_card_focus_x: b.top_card_focus_x ?? 50,
  bottom_card_image_url: b.bottom_card_image_url ?? null,
  bottom_card_focus_x: b.bottom_card_focus_x ?? 50,
  is_active: b.is_active,
  sort_order: b.sort_order,
});

function validate(v: PromoBoxWrite): string | null {
  if (!v.title.trim()) return "Başlık gerekli.";
  const links = [v.widget.instagram_href, v.widget.youtube_href].filter((h) => h?.trim());
  if (links.length === 0) return "En az bir kanal bağlantısı (Instagram veya YouTube) girin.";
  if (links.some((h) => !isSiteOrHttpsLink(h!))) return "Kanal bağlantıları https:// ile başlamalı.";
  if (![v.widget.instagram_label, v.widget.youtube_label, v.widget.anchor_label].every((l) => l.trim()))
    return "Etiketler boş olamaz.";
  if (!isSiteOrHttpsLink(v.href)) return "Geçerli bir bağlantı girin (/… veya https://…).";
  return null;
}

/**
 * Admin: the two cards beside the hero (HeroAsideCards): the community card
 * with the shop's channels on top, the advantages card under it. The first
 * active box whose condition is met is the one shown; the others wait.
 */
export function AdminPromosView() {
  return (
    <ContentEditor
      title="Promo Kutusu"
      description="Slider’ın yanındaki iki kart: üstte Topluluk (Instagram, YouTube), altta Ayrıcalıklar & Avantajlar."
      noun="kutu"
      api={adminPromoBoxes}
      blank={blank}
      toWrite={toWrite}
      summary={(b) => ({
        primary: b.title,
        secondary: b.requires ? "yalnızca fırsat ürünü varken" : "her zaman",
      })}
      validate={validate}
      listNote="Sırası en önde olan etkin kutu gösterilir; diğerleri yedekte bekler."
      stacked
      fields={(v, set) => (
        <>
          <SocialFields value={v} widget={v.widget} set={set} />
          <div className="max-w-xs space-y-1.5">
            <label htmlFor="promo-requires" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
              Koşul
            </label>
            <select
              id="promo-requires"
              value={v.requires ?? ""}
              onChange={(e) => set({ requires: e.target.value === "flash_sales" ? "flash_sales" : null })}
              className={adminSelectClass}
            >
              <option value="">Her zaman</option>
              <option value="flash_sales">Fırsat ürünü varken</option>
            </select>
          </div>
          <SocialPreview value={v} />
        </>
      )}
    />
  );
}
