"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";

import { ImageDropZone, MAX_UPLOAD_BYTES } from "@/components/admin/ImageDropZone";
import { inputClass } from "@/components/admin/homepage/fields";
import { adminUploadPromoCard } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";

/**
 * A promo card's background: dropped or chosen (stored as a 1200px WebP,
 * adminUploadPromoCard), or a site path / https address typed in, and where
 * its crop centres across the card. Empty: the shop's own picture (`fallback`,
 * shown in the zone so the admin sees what stays), placed as the homepage
 * places it. The card's preview under the fields shows the result.
 */
export function PromoImageField({
  value,
  focusX,
  fallback,
  onChange,
  onFocusX,
}: {
  value: string | null;
  focusX: number;
  /** The shop's own picture for this card, used while `value` is empty. */
  fallback: string;
  onChange: (value: string | null) => void;
  onFocusX: (x: number) => void;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      onChange((await adminUploadPromoCard(file)).url);
    } catch (err) {
      setError(getApiErrorMessage(err, "Görsel yüklenemedi."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Arka plan görseli</p>
      <ImageDropZone
        label={value ? "Görseli değiştir" : "Kendi görselinizi yükleyin"}
        preview={value || fallback}
        busy={busy}
        maxBytes={MAX_UPLOAD_BYTES}
        onFile={(f) => void upload(f)}
        onReject={setError}
      />
      <div className="flex items-center gap-2">
        <input
          value={value ?? ""}
          maxLength={500}
          placeholder={`Boş: sitenin görseli (${fallback})`}
          aria-label="Arka plan görselinin adresi"
          onChange={(e) => onChange(e.target.value.trim() || null)}
          className={inputClass}
        />
        {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" aria-hidden />}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600"
          >
            Sitenin görseline dön
          </button>
        )}
      </div>
      {value && (
        <div className="space-y-1">
          <label htmlFor={id} className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
            <span>Yatay odak</span>
            <span className="tabular-nums">%{focusX}</span>
          </label>
          <input
            id={id}
            type="range"
            min={0}
            max={100}
            step={1}
            value={focusX}
            onChange={(e) => onFocusX(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      )}
      {error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-[11px] text-slate-500 dark:text-zinc-500">
          PNG, JPEG veya WebP, en fazla 5 MB; 1200 px WebP olarak saklanır. Kart neredeyse kare: kareye yakın bir görsel seçin.
          Görsel kartı kaplar; “Yatay odak” hangi kısmının görüneceğini seçer. Açık renkli görsellerde de yazılar okunsun diye
          yüklenen görselin üstü ve altı otomatik olarak koyulaştırılır, ortası olduğu gibi kalır.
        </p>
      )}
    </div>
  );
}
