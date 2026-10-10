/** The world brands the shop stocks, as the ticker prints them. */
const BRANDS = [
  "Alkamik Bowl",
  "Caos Bowl",
  "Cosmo Bowl",
  "Oblako",
  "Alpha Hookah",
  "Tangiers",
  "Darkside",
  "Musthave",
  "Starbuzz",
  "DSH",
  "Hoob",
  "Mattpear",
];

const SECONDS_PER_BRAND = 3;

/**
 * The brand ticker: a single line of names sliding between the deals and the
 * gallery, and nothing else — no kicker, no heading, no card.
 *
 * It reads as texture at rest, pale and heavy, and answers one name at a time
 * under the pointer. The track holds the list twice and slides by -50%, which
 * lands on an identical frame, so the loop has no seam; the pause hangs off the
 * track's own hover rather than an ancestor `group`, which is what would
 * otherwise light every name at once.
 */
export function BrandTicker() {
  const half = [...BRANDS, ...BRANDS];
  const duration = `${half.length * SECONDS_PER_BRAND}s`;

  const band = (copy: number) => (
    <ul
      aria-hidden={copy > 0 || undefined}
      className={`flex shrink-0 items-center gap-6 pr-6 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-2 motion-reduce:pr-0 ${
        copy > 0 ? "motion-reduce:hidden" : ""
      }`}
    >
      {half.map((brand, i) => {
        // Screen readers meet each name once; the repeats are decoration.
        const primary = copy === 0 && i < BRANDS.length;
        return (
          <li
            key={`${brand}-${i}`}
            aria-hidden={primary ? undefined : true}
            className={`flex items-center gap-6 whitespace-nowrap ${primary ? "" : "motion-reduce:hidden"}`}
          >
            <span className="cursor-pointer select-none transition-colors duration-200 hover:text-black dark:hover:text-white">
              {brand.toLocaleUpperCase("tr-TR")}
            </span>
            <span aria-hidden className="text-red-600">
              •
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section aria-label="Dünya markaları" className="py-4 sm:py-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          <div
            className="flex w-max text-xl font-black uppercase tracking-wider text-neutral-300 motion-safe:animate-[marquee_var(--marquee-duration)_linear_infinite] hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:justify-center md:text-2xl dark:text-neutral-600"
            style={{ "--marquee-duration": duration } as React.CSSProperties}
          >
            {band(0)}
            {band(1)}
          </div>
        </div>
      </div>
    </section>
  );
}
