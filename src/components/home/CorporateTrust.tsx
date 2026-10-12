import { Check } from "lucide-react";

import type { Homepage } from "@/types";

/**
 * The corporate close ("Ana Sayfa Düzenleme" → Hakkımızda): the figures on the left, what the shop says about itself
 * on the right, and the three promises under both.
 *
 * The manifesto is rendered as ordinary prose in the markup rather than loaded
 * in — it is the page's one paragraph of plain Turkish about the business, and
 * it is there to be read by a crawler as much as by a visitor. The pane scrolls
 * if the copy outgrows it, so a longer text never stretches the card.
 */
export function CorporateTrust({ content }: { content: Homepage["about"] }) {
  const { stats, text, badges } = content;
  return (
    <section
      aria-label="Sultan Nargile hakkında"
      // Close above, where the advantages end; open below, where the footer begins.
      className="mx-auto mb-10 mt-6 w-full max-w-7xl px-4 sm:px-6 md:mb-14 md:mt-8"
    >
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-neutral-100/70 p-6 shadow-sm sm:p-8 md:p-10 dark:border-neutral-800 dark:bg-neutral-900/40">
        {/* The house glow, off the top corner. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-500/10 blur-3xl"
        />

        <div className="relative grid gap-6 lg:grid-cols-[45%_1fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map(({ value, label }, i) => (
              <div
                key={`${label}-${i}`}
                className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200/60 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:shadow-md sm:p-5 dark:border-neutral-700/60 dark:bg-neutral-800/80"
              >
                <p className="text-2xl font-bold tracking-tight tabular-nums text-red-600 sm:text-3xl dark:text-red-400">
                  {value}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="relative flex w-full flex-col justify-center lg:pl-6">
            <span
              aria-hidden
              className="mb-2 select-none font-serif text-4xl leading-none text-red-500/40 sm:text-5xl"
            >
              &ldquo;
            </span>
            <div className="scroll-slim max-h-[170px] overflow-y-auto overscroll-contain pr-3 sm:max-h-[190px]">
              <p className="text-sm font-medium leading-relaxed text-neutral-700 sm:text-base dark:text-neutral-300">
                {text}
              </p>
            </div>
          </div>
        </div>

        {badges.length > 0 && (
        <div className="relative mt-6 flex flex-wrap items-center gap-5 border-t border-neutral-200/60 pt-5 sm:gap-8 dark:border-neutral-800">
          {badges.map((badge, i) => (
            <span
              key={`${badge}-${i}`}
              className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" strokeWidth={2.5} aria-hidden />
              {badge}
            </span>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
