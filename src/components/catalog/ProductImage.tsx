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
  /**
   * The surface behind the photo. White by default, because supplier photos are
   * shot on white and a white backdrop is what makes them seamless — pass
   * `bg-transparent` where the box already provides its own surface.
   */
  surfaceClassName?: string;
  /**
   * The page's largest image above the fold (its LCP): fetched at once and
   * first. Every other photo loads lazily as it nears the viewport.
   */
  eager?: boolean;
}

const DEFAULT_IMAGE_CLASS =
  "object-contain p-8 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105";

const DEFAULT_SURFACE = "bg-white dark:bg-zinc-100";

/** Product photo filling its (fixed-aspect) parent; falls back on missing or broken images. */
export function ProductImage({
  src,
  alt,
  fallback,
  sizes,
  imageClassName = DEFAULT_IMAGE_CLASS,
  surfaceClassName,
  eager = false,
}: ProductImageProps) {
  // Remember which src failed, so a different product's image gets its own try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // And which one has arrived: until then the default surface is a grey,
  // pulsing placeholder, so a card that has just appeared (the next page, a
  // new search) is not an empty white box.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return fallback;
  const surface =
    surfaceClassName ?? (loadedSrc === src ? DEFAULT_SURFACE : "bg-[#f5f5f7] motion-safe:animate-pulse dark:bg-zinc-200");

  return (
    // Supplier photos are shot on white; the card is white too, so they sit seamlessly.
    <div className={`relative h-full ${surface}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        onError={() => setFailedSrc(src)}
        onLoad={() => setLoadedSrc(src)}
        className={imageClassName}
      />
    </div>
  );
}
