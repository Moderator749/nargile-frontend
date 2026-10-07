"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";

interface ProductImageProps {
  src: string | null;
  alt: string;
  /** Shown when there is no image or it fails to load. */
  fallback: ReactNode;
  sizes: string;
  /**
   * Overrides how the photo sits in its box. The default suits a full card; a
   * small thumbnail needs far less padding or the photo all but disappears.
   */
  imageClassName?: string;
}

const DEFAULT_IMAGE_CLASS =
  "object-contain p-8 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105";

/** Product photo filling its (fixed-aspect) parent; falls back on missing or broken images. */
export function ProductImage({ src, alt, fallback, sizes, imageClassName = DEFAULT_IMAGE_CLASS }: ProductImageProps) {
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
        className={imageClassName}
      />
    </div>
  );
}
