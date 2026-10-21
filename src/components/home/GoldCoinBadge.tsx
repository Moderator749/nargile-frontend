/**
 * The gold of the loyalty bands ("%10 SultanPuan", "Kumbara 20.000 TL").
 *
 * `FIGURE` and `GOLD` set a figure in tight, gold-gradient type ("%10",
 * "20.000 TL"); `GoldCoinBadge` is the minted "SP" coin beside a band's call,
 * turning a little as its band is hovered.
 */

/** A figure: tight, its colour from a gradient clipped to the text (pair with `GOLD`). */
export const FIGURE =
  "bg-clip-text py-0.5 text-2xl font-semibold leading-none tracking-tighter text-transparent tabular-nums md:text-3xl";

/** The figure's gold, darker in the light theme and paler in the dark. */
export const GOLD = "bg-gradient-to-br from-amber-500 to-amber-800 dark:from-amber-200 dark:to-amber-500";

export function GoldCoinBadge() {
  return (
    <span
      aria-hidden
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_8px_20px_-8px_rgba(217,119,6,0.55)] transition-transform duration-700 ease-out motion-safe:group-hover:rotate-12"
    >
      <span className="absolute inset-[3px] rounded-full border border-white/50" />
      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
      <span className="relative text-[11px] font-bold tracking-tight text-amber-950/80">SP</span>
    </span>
  );
}
