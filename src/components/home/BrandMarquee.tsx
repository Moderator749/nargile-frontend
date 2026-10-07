import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { catalogSearchHref } from "@/lib/home";
import type { Brand } from "@/types";

/** Items per half of the track, so even a short list spans a wide screen. */
const MIN_ITEMS = 10;
const SECONDS_PER_ITEM = 4;

// Shared by every item, so hover behaves the same on all copies: faint and grey,
// full opacity and colour on hover or focus.
const itemClass =
  "flex h-12 items-center text-foreground opacity-40 grayscale transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent dark:opacity-55";

function BrandMark({ brand }: { brand: Brand }) {
  return brand.logo_url ? (
    <Image
      src={brand.logo_url}
      alt={brand.name}
      width={140}
      height={48}
      unoptimized // small uploaded logos, served by the API
      // Dark mode: inverted (and kept grey) on the image itself, so the link's hover can
      // brighten it without turning the inverted artwork into odd colours.
      className="h-9 w-auto max-w-36 object-contain dark:invert dark:grayscale"
    />
  ) : (
    <span className="whitespace-nowrap text-xl font-semibold uppercase tracking-[0.3em]">{brand.name}</span>
  );
}

/**
 * "Kayan Marka Şeridi": an infinite, monochrome brand loop. The list is laid out
 * twice and slid by -50%, which lands on an identical frame. Pauses on hover or
 * focus; static (and wrapped) for reduced motion. Managed in /admin/brands.
 */
export function BrandMarquee({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  const repeats = Math.ceil(MIN_ITEMS / brands.length);
  const half = Array.from({ length: repeats }, () => brands).flat();
  const duration = `${half.length * SECONDS_PER_ITEM}s`;

  const list = (copy: number) => (
    <ul
      aria-hidden={copy > 0 || undefined}
      className={`flex shrink-0 items-center gap-16 pr-16 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:pr-0 ${
        copy > 0 ? "motion-reduce:hidden" : ""
      }`}
    >
      {half.map((brand, i) => {
        // Keyboard and screen readers meet each brand once (the first pass of copy 0);
        // the repeats look and hover the same but are skipped.
        const primary = copy === 0 && i < brands.length;
        return (
          <li key={`${brand.id}-${i}`} aria-hidden={primary ? undefined : true} className={primary ? "" : "motion-reduce:hidden"}>
            <Link
              href={catalogSearchHref(brand.search_term)}
              tabIndex={primary ? undefined : -1}
              aria-label={`${brand.name} ürünleri`}
              className={itemClass}
            >
              <BrandMark brand={brand} />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    // A defined strip, edge to edge: titanium in light mode, near-black in dark.
    <section
      aria-label="Markalar"
      className="border-y border-black/[0.05] bg-gradient-to-b from-[#ececf0] to-[#e7e7eb] py-10 shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] dark:border-white/[0.06] dark:from-zinc-950 dark:to-zinc-950 dark:shadow-none"
    >
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <div
          className="flex w-max motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:w-full motion-reduce:justify-center"
          style={{ "--marquee-duration": duration } as CSSProperties}
        >
          {list(0)}
          {list(1)}
        </div>
      </div>
    </section>
  );
}
