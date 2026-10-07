"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

interface ProductImageProps {
  src: string | null;
  alt: string;
  /** Shown when there is no image or it fails to load. */
  fallback: ReactNode;
  sizes: string;
}

/** Product photo filling its (fixed-aspect) parent; falls back on missing or broken images. */
export function ProductImage({ src, alt, fallback, sizes }: ProductImageProps) {
  // Remember which src failed, so a different product's image gets its own try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return fallback;

  return (
    // Supplier photos are shot on white; the card is pure white too, so they sit seamlessly.
    <div className="relative h-full bg-white dark:bg-zinc-100">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setFailedSrc(src)}
        className="object-contain p-8 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
      />
    </div>
  );
}
