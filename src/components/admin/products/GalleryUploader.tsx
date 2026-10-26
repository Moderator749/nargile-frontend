"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImageUp, Loader2, Trash2 } from "lucide-react";

import { useFileDrop } from "@/components/admin/useFileDrop";
import { adminUploadImages } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 12;

/**
 * The product gallery: drop photos (or pick them), and they are uploaded to the
 * API, which answers with the URLs stored on the product. The first photo is the
 * cover, so the thumbnails can be reordered and removed.
 *
 * The server checks the bytes again; the checks here only save a round trip.
 */
export function GalleryUploader({
  urls,
  onChange,
  name,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  /** What the photos' files are named for: the product's slug. */
  name?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: File[]) {
    setError(null);
    const room = MAX_FILES - urls.length;
    if (room <= 0) return setError(`En fazla ${MAX_FILES} görsel ekleyebilirsiniz.`);

    const accepted: File[] = [];
    for (const file of files.slice(0, room)) {
      if (!ACCEPTED.includes(file.type)) {
        setError("Yalnızca PNG, JPEG veya WebP görseller yüklenebilir.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: görsel en fazla 5 MB olabilir.`);
        continue;
      }
      accepted.push(file);
    }
    if (files.length > room) setError(`İlk ${room} görsel yüklendi; en fazla ${MAX_FILES} görsel olabilir.`);
    if (accepted.length === 0) return;

    setBusy(true);
    try {
      const stored = await adminUploadImages(accepted, name);
      onChange([...urls, ...stored.map((f) => f.url)]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Görsel yüklenemedi."));
    } finally {
      setBusy(false);
    }
  }

  const { over, handlers } = useFileDrop({ onFiles: upload, disabled: busy });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= urls.length) return;
    const next = [...urls];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <div
        {...handlers}
        aria-busy={busy || undefined}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-[border-color,background-color] duration-200 ${
          over
            ? "border-red-500 bg-red-50 dark:bg-red-500/10"
            : "border-slate-300 bg-slate-50/60 dark:border-white/15 dark:bg-white/[0.02]"
        } ${busy ? "opacity-60" : ""}`}
      >
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
        ) : (
          <ImageUp className="h-6 w-6 text-slate-400" aria-hidden />
        )}
        <p className="text-sm font-medium">{over ? "Bırakın, yükleyelim" : "Görselleri buraya sürükleyin"}</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          veya{" "}
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="font-medium text-red-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:no-underline dark:text-red-400"
          >
            dosya seçin
          </button>
          . PNG, JPEG, WebP · her biri en fazla 5 MB · en çok {MAX_FILES} görsel.
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []));
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {urls.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {urls.map((url, index) => (
            <li
              key={url}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="relative aspect-square bg-white dark:bg-zinc-100">
                {/* A plain img: these are freshly uploaded URLs, not optimised assets. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-contain p-2" />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Kapak
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-slate-200 px-1.5 py-1 dark:border-white/10">
                <span className="flex">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`${index + 1}. görseli öne al`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === urls.length - 1}
                    aria-label={`${index + 1}. görseli geri al`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/10"
                  >
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(urls.filter((_, i) => i !== index))}
                  aria-label={`${index + 1}. görseli kaldır`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
