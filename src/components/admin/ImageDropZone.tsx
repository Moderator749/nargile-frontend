"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { ImageUp, Loader2 } from "lucide-react";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 1024 * 1024;

interface ImageDropZoneProps {
  /** Called with a validated file (PNG/JPEG/WebP, ≤ 1 MB). */
  onFile: (file: File) => void;
  /** Shown when a file is rejected before upload. */
  onReject: (message: string) => void;
  /** Current image, previewed inside the zone. */
  preview?: string | null;
  busy?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * Image upload by drag & drop or click. Highlights while a file is dragged over
 * it and checks type and size client-side (the server checks the bytes again).
 */
export function ImageDropZone({ onFile, onReject, preview, busy = false, disabled = false, label = "Görsel" }: ImageDropZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  // dragenter/leave also fire for child elements: count them so the highlight doesn't flicker.
  const depth = useRef(0);
  const [over, setOver] = useState(false);
  const inactive = disabled || busy;

  function accept(file: File | undefined) {
    if (!file || inactive) return;
    if (!ACCEPTED.includes(file.type)) return onReject("Yalnızca PNG, JPEG veya WebP görseller yüklenebilir.");
    if (file.size > MAX_BYTES) return onReject("Görsel en fazla 1 MB olabilir.");
    onFile(file);
  }

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  return (
    <div
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault(); // required to allow dropping
        e.dataTransfer.dropEffect = inactive ? "none" : "copy";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        accept(e.dataTransfer.files[0]);
      }}
      aria-busy={busy || undefined}
      className={`relative flex items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-[border-color,background-color] duration-200 ${
        over && !inactive
          ? "border-red-500 bg-red-50 dark:bg-red-500/10"
          : "border-slate-300 bg-slate-50/60 dark:border-white/15 dark:bg-white/[0.02]"
      } ${inactive ? "opacity-60" : ""}`}
    >
      <div className="relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10">
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden />
        ) : preview ? (
          <Image src={preview} alt="" fill sizes="80px" unoptimized className="object-contain p-1" />
        ) : (
          <ImageUp className="h-5 w-5 text-slate-400" aria-hidden />
        )}
      </div>
      <div className="min-w-0 text-sm">
        <p className="font-medium">{over && !inactive ? "Bırakın, yükleyelim" : label}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
          Sürükleyip bırakın veya{" "}
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={inactive}
            className="font-medium text-red-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:no-underline dark:text-red-400"
          >
            dosya seçin
          </button>
          . PNG, JPEG, WebP · en fazla 1 MB.
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
