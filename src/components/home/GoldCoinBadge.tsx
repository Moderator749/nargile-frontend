/**
 * The gold of the loyalty bands ("%10 SultanPuan", "Kumbara 20.000 TL").
 *
 * `FIGURE` and `GOLD` set a figure in tight, gold-gradient type ("%10",
 * "20.000 TL"); `GoldCoinBadge` is the minted "SP" coin beside a band's call,
 * turning a little as its band is hovered — and, smaller, in the "%10 SultanPuan"
 * mark of every card and product page that earns it (SultanPuanBadge).
 */

/** A figure: tight, its colour from a gradient clipped to the text (pair with `GOLD`). */
export const FIGURE =
  "bg-clip-text py-0.5 text-2xl font-semibold leading-none tracking-tighter text-transparent tabular-nums md:text-3xl";

/** The figure's gold, darker in the light theme and paler in the dark. */
export const GOLD = "bg-gradient-to-br from-amber-500 to-amber-800 dark:from-amber-200 dark:to-amber-500";

/** The coin's sizes: a band's call (the default), the product page, a product card. */
const COIN = {
  lg: { box: "h-10 w-10", rim: "inset-[3px]", text: "text-[11px]" },
  md: { box: "h-7 w-7", rim: "inset-[2px]", text: "text-[9px]" },
  sm: { box: "h-5 w-5", rim: "inset-[1.5px]", text: "text-[7.5px]" },
} as const;

export function GoldCoinBadge({ size = "lg" }: { size?: keyof typeof COIN } = {}) {
  const c = COIN[size];
  return (
    <span
      aria-hidden
      className={`relative flex ${c.box} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_8px_20px_-8px_rgba(217,119,6,0.55)] transition-transform duration-700 ease-out motion-safe:group-hover:rotate-12`}
    >
      <span className={`absolute ${c.rim} rounded-full border border-white/50`} />
      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
      <span className={`relative ${c.text} font-bold leading-none tracking-tight text-amber-950/80`}>SP</span>
    </span>
  );
}
