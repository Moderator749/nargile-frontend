"use client";

import { Film } from "lucide-react";

import { GalleryUploader } from "@/components/admin/products/GalleryUploader";
import { SheetField, sheetInputClass, sheetLabelClass } from "@/components/admin/products/SheetParts";

/**
 * The product's media: photos uploaded by drag & drop (the first is the cover
 * shown on cards) plus one optional YouTube link for the detail page.
 */
export function MediaFields({
  imageUrls,
  youtubeUrl,
  onImagesChange,
  onYoutubeChange,
}: {
  imageUrls: string[];
  youtubeUrl: string;
  onImagesChange: (urls: string[]) => void;
  onYoutubeChange: (url: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <span className={sheetLabelClass}>Görseller</span>
        <GalleryUploader urls={imageUrls} onChange={onImagesChange} />
        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
          İlk görsel kapak olarak kullanılır; sıralama ürün sayfasındaki galeri sırasıdır.
        </p>
      </div>

      <SheetField id="sheet-youtube" label="YouTube Videosu" hint="watch, youtu.be veya shorts bağlantısı.">
        <span className="flex items-center gap-2">
          <Film className="h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
          <input
            id="sheet-youtube"
            value={youtubeUrl}
            onChange={(e) => onYoutubeChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className={sheetInputClass}
          />
        </span>
      </SheetField>
    </div>
  );
}
