"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

import { canOptimiseImage } from "@/lib/home";

/**
 * A product's photo at thumbnail size, for telling models apart at a glance —
 * the admin knows the hookahs by sight faster than by code. Decorative: the
 * code and name always stand beside it. A missing or broken photo is a quiet
 * placeholder, never an empty box.
 */
export function ProductThumb({ src, size = 48 }: { src: string | null; size?: 40 | 48 }) {
  const [failed, setFailed] = useState<string | null>(null);
  const box = size === 40 ? "h-10 w-10" : "h-12 w-12";
  if (!src || failed === src) {
    return (
      <span aria-hidden className={`${box} flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-zinc-500`}>
        <Package className="h-5 w-5" strokeWidth={1.5} />
      </span>
    );
  }
  return (
    <span className={`${box} relative shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:ring-white/10`}>
      <Image
        src={src}
        alt=""
        fill
        sizes={`${size}px`}
        unoptimized={!canOptimiseImage(src)}
        onError={() => setFailed(src)}
        className="object-contain p-0.5"
      />
    </span>
  );
}
