"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Play } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { ProductLightbox } from "@/components/product/ProductLightbox";
import { productMessages } from "@/lib/i18n/messages/product";
import { youtubeEmbed, youtubeId, youtubeThumbnail } from "@/lib/youtube";

type Slide = { kind: "image"; src: string } | { kind: "video"; id: string };

const frameClass =
  "relative aspect-square overflow-hidden rounded-3xl bg-white shadow-sm shadow-black/[0.04] dark:bg-zinc-100";
const arrowClass =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-md ring-1 ring-inset ring-black/[0.06] backdrop-blur transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * Product media: every photo of the gallery plus the YouTube video, if there is
 * one, as the last slide. The player is only fetched once the viewer presses
 * play — until then the slide is the poster frame, so the page stays light.
 *
 * Every slide sits in the same fixed-aspect frame, so moving between them (or
 * swapping the poster for the player) shifts nothing.
 *
 * A photo opens full screen, zoomable (ProductLightbox), from a click
 * anywhere on it or the expand button in its corner; the lightbox has every
 * photo, and the gallery follows to the one it was closed on.
 */
export function ProductGallery({
  images,
  youtubeUrl,
  alt,
  dimmed,
  fallback,
}: {
  /** The gallery, cover first. May be absent in an older cached payload. */
  images: string[] | undefined;
  youtubeUrl: string | null | undefined;
  alt: string;
  /** Sold out: the media dims, the controls do not. */
  dimmed?: boolean;
  fallback: ReactNode;
}) {
  const t = useMessages(productMessages).gallery;
  const videoId = youtubeId(youtubeUrl);
  // `images` can be missing, not just empty: a product page rendered before
  // galleries existed can still be served from the ISR cache, and its payload has
  // no `image_urls` at all.
  const slides: Slide[] = [
    ...(images ?? []).map((src) => ({ kind: "image" as const, src })),
    ...(videoId ? [{ kind: "video" as const, id: videoId }] : []),
  ];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  // The photo the lightbox is open on; null while it is closed.
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = images ?? [];

  if (slides.length === 0) return <div className={frameClass}>{fallback}</div>;

  const current = slides[Math.min(index, slides.length - 1)];
  const go = (next: number) => {
    setIndex((next + slides.length) % slides.length);
    setPlaying(false);
  };

  return (
    <div>
      <div className={frameClass}>
        <div className={`h-full transition-[filter,opacity] duration-300 ${dimmed ? "opacity-50 grayscale" : ""}`}>
          {current.kind === "image" ? (
            <ProductImage
              src={current.src}
              // The cover is the product's name; the others say which view they are.
              alt={index === 0 ? alt : t.nth(alt, index + 1)}
              sizes="(min-width: 1024px) 600px, 100vw"
              fallback={fallback}
              // The cover is the page's LCP; a photo picked later is not.
              eager={index === 0}
            />
          ) : playing ? (
            <iframe
              src={youtubeEmbed(current.id)}
              title={t.videoTitle(alt)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group/play relative h-full w-full bg-zinc-950"
              aria-label={t.play(alt)}
            >
              {/* Poster frame straight from YouTube; no player, no cookies yet. */}
              <Image
                src={youtubeThumbnail(current.id)}
                alt={t.videoAlt(alt)}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover opacity-90 transition-opacity duration-300 group-hover/play:opacity-100"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform duration-300 motion-safe:group-hover/play:scale-110">
                  <Play className="h-7 w-7 translate-x-0.5" aria-hidden />
                </span>
              </span>
            </button>
          )}
        </div>

        {/* A photo opens full screen from anywhere on it (photos come first
            among the slides, so the slide's index is the photo's); the expand
            button in the corner says so. Outside the dimmed media, under the
            arrows. */}
        {current.kind === "image" && (
          <button
            type="button"
            onClick={() => setLightbox(index)}
            aria-label={t.enlarge}
            className="group/zoom absolute inset-0 cursor-zoom-in rounded-3xl focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent"
          >
            <span
              aria-hidden
              className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-md ring-1 ring-inset ring-black/[0.06] backdrop-blur transition-transform duration-200 motion-safe:group-hover/zoom:scale-110"
            >
              <Expand className="h-4 w-4" />
            </span>
          </button>
        )}

        {slides.length > 1 && (
          <>
            {/* Previous at the reading direction's start, next at its end. */}
            <button type="button" onClick={() => go(index - 1)} aria-label={t.previous} className={`${arrowClass} start-3`}>
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={t.next} className={`${arrowClass} end-3`}>
              <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </button>
          </>
        )}
      </div>

      {lightbox !== null && photos.length > 0 && (
        <ProductLightbox
          images={photos}
          alt={alt}
          start={lightbox}
          onClose={(last) => {
            setLightbox(null);
            setIndex(last);
          }}
        />
      )}

      {slides.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t.thumbnails}>
          {slides.map((slide, i) => (
            <li key={slide.kind === "image" ? slide.src : slide.id}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={slide.kind === "video" ? t.videoThumb(alt) : undefined}
                aria-current={i === index}
                className={`relative h-16 w-16 overflow-hidden rounded-xl bg-white ring-1 transition-[box-shadow,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-zinc-100 ${
                  i === index ? "ring-2 ring-accent" : "ring-black/[0.08] hover:opacity-80 dark:ring-white/10"
                }`}
              >
                {/* A 64px button: next/image sends a 64/128px copy, not the
                    full photo the main frame shows. */}
                <Image
                  src={slide.kind === "image" ? slide.src : youtubeThumbnail(slide.id)}
                  // The image names the button: the product, and which view it is.
                  alt={slide.kind === "image" ? t.nth(alt, i + 1) : t.videoAlt(alt)}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                {slide.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                    <Play className="h-5 w-5 translate-x-0.5" aria-hidden />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
