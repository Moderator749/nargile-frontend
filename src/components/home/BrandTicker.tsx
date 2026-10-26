import Image from "next/image";

import Link from "@/components/i18n/Link";
import { canOptimiseImage } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { brandHref } from "@/lib/seo";
import type { Brand } from "@/types";

const SECONDS_PER_BRAND = 3;

/** A brand on the ticker: its logo where "Markalar" has one, else its name; a link to its page where it has one. */
export type TickerBrand = Pick<Brand, "name"> & Partial<Pick<Brand, "slug" | "logo_url">>;

/**
 * What the ticker shows: the active brands of "Markalar", in its order. The
 * homepage's own list of names stands in only when that list cannot be read.
 */
export function tickerBrands(brands: Brand[] | null | undefined, fallback: string[]): TickerBrand[] {
  if (brands) return brands.filter((b) => b.is_active);
  return fallback.map((name) => ({ name }));
}

/**
 * The brand ticker: a single line of brands ("Markalar") — logos, or names
 * where there is none — sliding
 * under "Sektörde Referans Noktası", over "Markalarımız", on a flat track with
 * square ends and no surface of its own, so it sits in the page rather than
 * on it; a hairline above and below frames it. The band behind it is white in
 * the light theme, carrying on the statement's white — spaced by padding, not
 * margin, so no strip of the page's grey shows between them.
 *
 * The names are small, wide-tracked and muted — a credits line, not a
 * headline — and answer one at a time under the pointer. The track's ends are
 * masked to transparent, so names and dots fade into the background before
 * they reach the edge instead of being cut off. Each name carries the dot that
 * follows it, so in the loop every dot sits between two names (the last one
 * between the end of the list and its start). The track holds the list twice and slides by -50%, which
 * lands on an identical frame, so the loop has no seam; the pause hangs off the
 * track's own hover rather than an ancestor `group`, which is what would
 * otherwise light every name at once.
 *
 * The homepage runs it twice — under the perks bar near the top, and under
 * the statement near the foot. The top one is `decorative`: hidden from
 * screen readers, so the list is announced once, as its own region.
 *
 * In Arabic the track lays out from the right and overflows to the left, so
 * the same -50% would slide it off into nothing. There it starts half a track
 * over (`translate`, which the keyframes' `transform` adds to) and runs the
 * keyframes backwards: the frames are the same two copies, the names drift
 * rightwards — the way Arabic reads on — and the loop still has no seam.
 */
export async function BrandTicker({
  brands,
  decorative = false,
  className = "pb-2 pt-4 sm:pt-5",
}: {
  brands: TickerBrand[];
  /** A second copy on the page: no landmark, nothing for a screen reader. */
  decorative?: boolean;
  /** The band's vertical padding. */
  className?: string;
}) {
  if (brands.length === 0) return null;
  const [locale, t] = await Promise.all([getLocale(), getMessages(homeMessages)]);
  // Capitals by the page's language: Turkish turns "i" into "İ", which an
  // English or Arabic page would show on "Khalil Mamoon".
  const upper = locale === "tr" ? "tr-TR" : "en-GB";
  const half = [...brands, ...brands];
  const duration = `${half.length * SECONDS_PER_BRAND}s`;

  const band = (copy: number) => (
    <ul
      aria-hidden={copy > 0 || undefined}
      className={`flex shrink-0 items-center gap-8 pe-8 motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3 motion-reduce:px-6 motion-reduce:pe-6 ${
        copy > 0 ? "motion-reduce:hidden" : ""
      }`}
    >
      {half.map((brand, i) => {
        // Screen readers meet each name once; the repeats are decoration.
        const primary = copy === 0 && i < brands.length;
        // The repeats, and the decorative ticker, are not in the tab order either.
        const reachable = primary && !decorative;
        const face = brand.logo_url ? (
          // Through next/image: an uploaded logo is often a full-size PNG
          // (50–85 KB) shown 28px tall, and resized to the strip's size and
          // sent as WebP/AVIF it is a few KB — the same file for every repeat
          // of the band. `width`/`height` are the box it is drawn in; the
          // logo keeps its own proportions inside it (object-contain). Grey
          // and quiet until pointed at, as the names are; a white silhouette
          // on the dark theme.
          <Image
            src={brand.logo_url}
            alt={reachable ? brand.name : ""}
            width={120}
            height={28}
            loading="lazy"
            unoptimized={!canOptimiseImage(brand.logo_url)}
            className="h-6 w-auto max-w-[7.5rem] object-contain opacity-60 grayscale transition duration-200 group-hover/brand:opacity-100 group-hover/brand:grayscale-0 sm:h-7 dark:opacity-70 dark:brightness-0 dark:invert dark:group-hover/brand:opacity-100"
          />
        ) : (
          <span className="transition-colors duration-200 group-hover/brand:text-neutral-900 dark:group-hover/brand:text-white">
            {brand.name.toLocaleUpperCase(upper)}
          </span>
        );
        return (
          <li
            key={`${brand.slug ?? brand.name}-${i}`}
            aria-hidden={primary ? undefined : true}
            className={`flex items-center gap-8 whitespace-nowrap ${primary ? "" : "motion-reduce:hidden"}`}
          >
            {brand.slug ? (
              <Link
                href={brandHref(brand.slug)}
                tabIndex={reachable ? undefined : -1}
                className="group/brand flex items-center select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
              >
                {face}
              </Link>
            ) : (
              <span className="group/brand flex select-none items-center">{face}</span>
            )}
            {/* A jewel dot rather than a typed bullet: it sits on the
                x-height's centre at any size and carries a faint glow. */}
            <span
              aria-hidden
              className="h-1 w-1 shrink-0 rounded-full bg-red-600/80 shadow-[0_0_6px_rgba(220,38,38,0.45)] dark:bg-red-500/80"
            />
          </li>
        );
      })}
    </ul>
  );

  return (
    <section
      aria-label={decorative ? undefined : t.brands.ticker}
      aria-hidden={decorative || undefined}
      className={`bg-white dark:bg-transparent ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Framed by hairlines above and below, open at the ends. The lines are
            on this wrapper and the mask on the track inside, so only the names
            and dots fade; the lines run solid edge to edge. */}
        <div className="border-y border-gray-200 dark:border-border">
          {/* Still, the list wraps instead, so there is no moving edge to fade. */}
          <div className="overflow-hidden rounded-none py-4 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:py-5 motion-reduce:[mask-image:none]">
            <div
              className="flex w-max text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] motion-safe:rtl:translate-x-1/2 motion-safe:rtl:[animation-direction:reverse] hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:justify-center sm:text-sm dark:text-neutral-500"
              style={{ "--marquee-duration": duration } as React.CSSProperties}
            >
              {band(0)}
              {band(1)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
