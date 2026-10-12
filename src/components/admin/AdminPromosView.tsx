"use client";

import { ContentEditor, adminSelectClass, isImageUrl, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { PromoCanvas } from "@/components/admin/promos/PromoCanvas";
import { SocialFields, SocialPreview } from "@/components/admin/promos/SocialFields";
import { Input } from "@/components/ui/Input";
import { adminPromoBoxes } from "@/lib/adminApi";
import type { PromoBoxContent, PromoBoxWrite, PromoVariant, SocialWidget } from "@/types";

const VARIANTS: Record<PromoVariant, string> = {
  image: "Görselli kart",
  text: "Beyaz metin kartı",
  transparent: "Şeffaf (çerçeveli)",
  social: "Sosyal & Avantaj Widget",
};

/** What a card switched to the social widget starts with. */
const DEFAULT_WIDGET: SocialWidget = {
  instagram_href: "https://www.instagram.com/sultannargile_bahcelievler",
  instagram_label: "Instagram",
  youtube_href: "https://www.youtube.com/@sultannargile1982",
  youtube_label: "YouTube",
  anchor_label: "Keşfet",
};

const blank = (): PromoBoxWrite => ({
  row: 1,
  variant: "text",
  eyebrow: "",
  title: "",
  text: null,
  href: "/catalog",
  image_url: null,
  badge: null,
  requires: null,
  layout: null,
  overlay_direction: "to-t",
  image_focus_x: 50,
  image_focus_y: 50,
  image_zoom: 100,
  widget: null,
  is_active: true,
  sort_order: 100,
});

const toWrite = (b: PromoBoxContent): PromoBoxWrite => ({
  row: b.row,
  variant: b.variant,
  eyebrow: b.eyebrow,
  title: b.title,
  text: b.text,
  href: b.href,
  image_url: b.image_url,
  badge: b.badge,
  requires: b.requires,
  layout: b.layout,
  overlay_direction: b.overlay_direction,
  image_focus_x: b.image_focus_x,
  image_focus_y: b.image_focus_y,
  image_zoom: b.image_zoom,
  widget: b.widget,
  is_active: b.is_active,
  sort_order: b.sort_order,
});

function validate(v: PromoBoxWrite): string | null {
  if (!v.title.trim()) return "Başlık gerekli.";
  if (v.variant === "social" && v.widget) {
    const links = [v.widget.instagram_href, v.widget.youtube_href].filter((h) => h?.trim());
    if (links.length === 0) return "Widget için en az bir kanal bağlantısı (Instagram veya YouTube) girin.";
    if (links.some((h) => !isSiteOrHttpsLink(h!))) return "Kanal bağlantıları https:// ile başlamalı.";
    if (![v.widget.instagram_label, v.widget.youtube_label, v.widget.anchor_label].every((l) => l.trim()))
      return "Widget etiketleri boş olamaz.";
  }
  if (!isSiteOrHttpsLink(v.href)) return "Geçerli bir bağlantı girin (/… veya https://…).";
  if (v.image_url?.trim() && !isImageUrl(v.image_url)) return "Görsel URL'si https:// ile başlamalı, boşluk/tırnak içermemeli.";
  return null;
}

/** Admin: the two smart promo grids (Modules 6 & 7). */
export function AdminPromosView() {
  return (
    <ContentEditor
      title="Promo Kutuları"
      description="Slider altındaki iki sıra kampanya kartı. Bir kutu kapatılınca kalanlar satırı doldurur."
      noun="kutu"
      api={adminPromoBoxes}
      blank={blank}
      toWrite={toWrite}
      summary={(b) => ({
        primary: b.title,
        secondary: [`${b.row}. sıra`, VARIANTS[b.variant as PromoVariant], b.badge === "sok" ? "Şok" : "", b.requires ? "fırsat varken" : ""]
          .filter(Boolean)
          .join(" · "),
      })}
      validate={validate}
      listNote="Her sırada en fazla 3 etkin kutu gösterilir (sıra numarasına göre)."
      stacked
      fields={(v, set, current) => (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="promo-row" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Satır
              </label>
              <select id="promo-row" value={v.row} onChange={(e) => set({ row: Number(e.target.value) })} className={adminSelectClass}>
                <option value={1}>1. sıra</option>
                <option value={2}>2. sıra</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="promo-variant" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Kart tipi
              </label>
              <select
                id="promo-variant"
                value={v.variant}
                onChange={(e) => {
                  const variant = e.target.value as PromoVariant;
                  set({ variant, widget: variant === "social" ? (v.widget ?? DEFAULT_WIDGET) : null });
                }}
                className={adminSelectClass}
              >
                {Object.entries(VARIANTS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {v.variant === "social" && v.widget ? (
            <SocialFields value={v} widget={v.widget} set={set} />
          ) : (
            <>
            <Input label="Üst etiket" value={v.eyebrow} maxLength={60} onChange={(e) => set({ eyebrow: e.target.value })} />
            <Input label="Başlık" value={v.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} />
            <Input label="Metin (isteğe bağlı)" value={v.text ?? ""} maxLength={240} onChange={(e) => set({ text: e.target.value || null })} />
            <Input label="Bağlantı" value={v.href} maxLength={300} onChange={(e) => set({ href: e.target.value })} placeholder="/catalog/nargile-komurleri" />
            <Input
              label="Görsel URL"
              value={v.image_url ?? ""}
              maxLength={500}
              onChange={(e) => set({ image_url: e.target.value || null })}
              placeholder="https://…/urun.jpg"
              hint="Görsel kartı tamamen kaplar; altta gölge yönü ve kırpma ayarları var."
            />
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="promo-badge" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
                Rozet
              </label>
              <select id="promo-badge" value={v.badge ?? ""} onChange={(e) => set({ badge: e.target.value === "sok" ? "sok" : null })} className={adminSelectClass}>
                <option value="">Yok</option>
                <option value="sok">Şok</option>
              </select>
            </div>
            <div className="space-y-1.5">
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
          </div>
          {v.variant === "social" ? (
            <SocialPreview value={v} />
          ) : (
            <PromoCanvas value={v} set={set} image={current?.image ?? v.image_url} />
          )}
        </>
      )}
    />
  );
}
