"use client";

import { ContentEditor, adminSelectClass, isImageUrl, isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { Input } from "@/components/ui/Input";
import { adminHeroSlides } from "@/lib/adminApi";
import type { HeroSlideContent, HeroSlideWrite } from "@/types";

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
      fields={(v, set) => (
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
