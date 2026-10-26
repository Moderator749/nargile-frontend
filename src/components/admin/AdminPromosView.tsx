"use client";

import { useEffect, useState, type SubmitEvent } from "react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { isSiteOrHttpsLink } from "@/components/admin/ContentEditor";
import { BottomCardFields, CardPreview, TopCardFields } from "@/components/admin/promos/PromoCardFields";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminPromoBox } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import type { PromoBoxContent, PromoBoxWrite, SocialWidget } from "@/types";

/** What the box starts with before its first save. */
const DEFAULT_WIDGET: SocialWidget = {
  instagram_href: "https://www.instagram.com/sultannargile_bahcelievler",
  instagram_label: "Instagram",
  youtube_href: "https://www.youtube.com/@sultannargile1982",
  youtube_label: "YouTube",
  anchor_label: "Keşfet",
};

const BLANK: PromoBoxWrite = {
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
  top_title: null,
  bottom_text: null,
  top_shade: "left",
  bottom_shade: "left",
  is_active: true,
  sort_order: 0,
};

const toWrite = (b: PromoBoxContent): PromoBoxWrite => ({
  eyebrow: b.eyebrow,
  title: b.title,
  text: b.text,
  href: b.href,
  requires: null,
  widget: b.widget ?? DEFAULT_WIDGET,
  top_card_image_url: b.top_card_image_url ?? null,
  top_card_focus_x: b.top_card_focus_x ?? 50,
  bottom_card_image_url: b.bottom_card_image_url ?? null,
  bottom_card_focus_x: b.bottom_card_focus_x ?? 50,
  top_title: b.top_title ?? null,
  bottom_text: b.bottom_text ?? null,
  top_shade: b.top_shade ?? "left",
  bottom_shade: b.bottom_shade ?? "left",
  is_active: true,
  sort_order: b.sort_order,
});

function validate(v: PromoBoxWrite): string | null {
  if (!v.title.trim()) return "Alt kartın başlığı gerekli.";
  const links = [v.widget.instagram_href, v.widget.youtube_href].filter((h) => h?.trim());
  if (links.length === 0) return "En az bir kanal bağlantısı (Instagram veya YouTube) girin.";
  if (links.some((h) => !isSiteOrHttpsLink(h!))) return "Kanal bağlantıları https:// ile başlamalı.";
  if (![v.widget.instagram_label, v.widget.youtube_label, v.widget.anchor_label].every((l) => l.trim()))
    return "Etiketler boş olamaz.";
  if (!isSiteOrHttpsLink(v.href)) return "Geçerli bir bağlantı girin (/… veya https://…).";
  return null;
}

/**
 * Admin: "Promo Kutusu", the two cards beside the hero — the community card
 * (the shop's channels) on top, the advantages card under it. Always exactly
 * these two: one box, read and saved as the homepage shows it
 * (`/admin/promo-box`), so a save is what the homepage shows. Each card's
 * fields stand in their own column with its live preview right under them.
 */
export function AdminPromosView() {
  const [form, setForm] = useState<PromoBoxWrite | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminPromoBox
      .get(controller.signal)
      .then((box) => setForm(box ? toWrite(box) : BLANK))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Promo kutusu yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const set = (patch: Partial<PromoBoxWrite>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setResult(null);
  };

  const problem = form ? validate(form) : null;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving || problem) return;
    setSaving(true);
    try {
      const saved = await adminPromoBox.save(form);
      setForm(toWrite(saved));
      void refreshStorefront();
      setResult({ kind: "success", text: "Kaydedildi. Ana sayfa güncellendi." });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Promo Kutusu"
        description="Slider’ın yanındaki iki kart: üstte Topluluk (Instagram, YouTube), altta Ayrıcalıklar & Avantajlar. Her kartın altında canlı önizlemesi var; kaydettiğinizde ana sayfa güncellenir."
      />
      {loadError ? (
        <Alert variant="error">{loadError}</Alert>
      ) : !form ? (
        <div className={`${panelClass} h-96 motion-safe:animate-pulse`} aria-busy />
      ) : (
        <form onSubmit={handleSubmit} className={`${panelClass} space-y-5 p-5 sm:p-6`}>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <TopCardFields value={form} set={set} />
              <CardPreview value={form} card="top" />
            </div>
            <div className="space-y-4">
              <BottomCardFields value={form} set={set} />
              <CardPreview value={form} card="bottom" />
            </div>
          </div>
          <p className="text-center text-[11px] text-slate-500 dark:text-zinc-400">
            Önizlemeler masaüstündeki boyutta (kategori menüsü kapalıyken slider’ın yanında). Tablette yan yana, telefonda alt alta durur.
          </p>

          {result && <Alert variant={result.kind}>{result.text}</Alert>}
          {problem && <p className="text-xs text-slate-500 dark:text-zinc-400">{problem}</p>}
          <Button type="submit" loading={saving} disabled={!!problem} className="sm:w-auto! sm:px-8!">
            Kaydet
          </Button>
        </form>
      )}
    </>
  );
}
