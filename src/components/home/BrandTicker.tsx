const SECONDS_PER_BRAND = 3;

/**
 * The brand ticker: a single line of names (from "Ana Sayfa Düzenleme") sliding between the deals and the
 * gallery, set in a frosted capsule so it reads as one deliberate surface
 * rather than loose text on the canvas.
 *
 * The names are small, wide-tracked and muted — a credits line, not a
 * headline — and answer one at a time under the pointer. The capsule's ends
 * are faded so names glide in and out instead of being cut off. The track holds the list twice and slides by -50%, which
 * lands on an identical frame, so the loop has no seam; the pause hangs off the
 * track's own hover rather than an ancestor `group`, which is what would
 * otherwise light every name at once.
 */
export function BrandTicker({ brands }: { brands: string[] }) {
  if (brands.length === 0) return null;
  const half = [...brands, ...brands];
  const duration = `${half.length * SECONDS_PER_BRAND}s`;

  const band = (copy: number) => (
    <ul
      aria-hidden={copy > 0 || undefined}
      className={`flex shrink-0 items-center gap-8 pr-8 motion-reduce:w-full motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3 motion-reduce:px-6 motion-reduce:pr-6 ${
        copy > 0 ? "motion-reduce:hidden" : ""
      }`}
    >
      {half.map((brand, i) => {
        // Screen readers meet each name once; the repeats are decoration.
        const primary = copy === 0 && i < brands.length;
        return (
          <li
            key={`${brand}-${i}`}
            aria-hidden={primary ? undefined : true}
            className={`flex items-center gap-8 whitespace-nowrap ${primary ? "" : "motion-reduce:hidden"}`}
          >
            <span className="cursor-pointer select-none transition-colors duration-200 hover:text-neutral-900 dark:hover:text-white">
              {brand.toLocaleUpperCase("tr-TR")}
            </span>
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
    <section aria-label="Dünya markaları" className="mb-2 mt-7 sm:mb-2 sm:mt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-full border border-neutral-200/60 motion-reduce:rounded-3xl bg-white/70 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:py-5 dark:border-neutral-800/60 dark:bg-neutral-900/50 dark:shadow-none">
          {/* Still, the list wraps inside the capsule instead, so there is no
              moving edge to fade. */}
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)] motion-reduce:[mask-image:none]">
            <div
              className="flex w-max text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:justify-center sm:text-sm dark:text-neutral-500"
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
