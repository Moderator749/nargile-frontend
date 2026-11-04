"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { ImageDropZone } from "@/components/admin/ImageDropZone";
import { inputClass } from "@/components/admin/homepage/fields";
import { adminUploadBanner } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * A category page's banner: dropped or chosen, stored wide (adminUploadBanner),
 * and previewed at the page's own 4:1, with the strips a phone crops off
 * (it shows 3:1, from the middle) shaded — so the words and the subject are
 * placed where every screen sees them. Empty: the page shows no banner.
 */
export function BannerField({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      onChange((await adminUploadBanner(file)).url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Banner yüklenemedi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Kategori banner&apos;ı</p>
      {value && (
        <figure className="space-y-1">
          <div className="relative aspect-[4/1] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
            <Image src={value} alt="" fill sizes="384px" unoptimized className="object-cover" />
            {/* 4:1 shown as 3:1 on a phone: an eighth off each side. */}
            <span className="absolute inset-y-0 left-0 w-[12.5%] border-r border-dashed border-white/80 bg-black/45" aria-hidden />
            <span className="absolute inset-y-0 right-0 w-[12.5%] border-l border-dashed border-white/80 bg-black/45" aria-hidden />
          </div>
          <figcaption className="text-[11px] text-slate-500 dark:text-zinc-400">
            Gölgeli kenarlar telefonda kırpılır; yazı ve ana görsel ortada kalsın.
          </figcaption>
        </figure>
      )}
      <ImageDropZone
        label={value ? "Banner'ı değiştir" : "Banner yükle"}
        busy={busy}
        maxBytes={MAX_BYTES}
        onFile={(f) => void upload(f)}
        onReject={setError}
        preview={null}
      />
      <div className="flex items-center gap-2">
        <input
          value={value ?? ""}
          maxLength={500}
          placeholder="/images/banner.webp veya https://…"
          aria-label="Banner adresi"
          onChange={(e) => onChange(e.target.value.trim() || null)}
          className={inputClass}
        />
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />}
        {value && (
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600">
            Kaldır
          </button>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-[11px] text-slate-500 dark:text-zinc-500">
          Kategori sayfasında başlığın altında, tam genişlikte görünür. 2400×600 (4:1) önerilir; az yazılı, görsel ağırlıklı
          olsun — her dilde aynı görsel gösterilir. Boş bırakılırsa banner alanı hiç görünmez.
        </p>
      )}
    </div>
  );
}
