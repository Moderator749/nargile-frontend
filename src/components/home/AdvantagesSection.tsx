import { advantageIcon } from "@/lib/advantageIcons";
import type { AdvantageContent } from "@/types";

/**
 * "Avantajlar": the B2B value proposition as a bento of charcoal tiles, always
 * dark (kept apart from the charcoal footer by the section's own padding). The first tile leads,
 * double size. Content is managed in /admin/advantages.
 */
export function AdvantagesSection({ advantages }: { advantages: AdvantageContent[] }) {
  if (advantages.length === 0) return null;

  return (
    <section
      id="avantajlar"
      aria-labelledby="advantages-heading"
      className="mx-auto w-full max-w-7xl scroll-mt-[var(--header-height)] px-4 py-24 sm:px-6"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Avantajlar</p>
      <h2 id="advantages-heading" className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tighter text-foreground sm:text-5xl">
        Hacim büyür. Maliyet küçülür.
      </h2>

      <ul className="mt-14 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {advantages.map(({ id, icon, title, highlight, highlight_label, details, footnote }, i) => {
          const Icon = advantageIcon(icon);
          const lead = i === 0;
          return (
            <li
              key={id}
              className={`dark group relative isolate flex flex-col overflow-hidden rounded-[2rem] bg-[#1d1d1f] p-7 text-foreground ring-1 ring-inset ring-white/[0.06] transition-[transform,box-shadow] duration-500 ease-out hover:shadow-2xl hover:shadow-black/20 motion-safe:hover:-translate-y-1 sm:p-8 ${
                lead ? "sm:col-span-2 lg:row-span-2" : ""
              }`}
            >
              {/* Titanium sheen; the lead tile also carries a faint crimson glow. */}
              <span
                aria-hidden
                className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgb(255_255_255/0.06),transparent_45%)]"
              />
              {lead && (
                <span
                  aria-hidden
                  className="absolute -bottom-1/3 -right-1/4 -z-10 h-2/3 w-2/3 rounded-full bg-[radial-gradient(closest-side,rgb(200_16_46/0.25),transparent)]"
                />
              )}

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/10">
                <Icon className="h-5 w-5 text-zinc-300" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">{title}</h3>
              <p
                className={`mt-3 font-mono font-medium tracking-tighter text-white tabular-nums ${
                  lead ? "text-5xl sm:text-6xl lg:text-7xl" : "text-3xl"
                }`}
              >
                {highlight}
              </p>
              {highlight_label && (
                <p className={`mt-2 font-light text-zinc-400 ${lead ? "text-base sm:text-lg" : "text-sm"}`}>
                  {highlight_label}
                </p>
              )}
              {details.length > 0 && (
                <ul className="mt-6 space-y-1.5 text-xs font-light leading-5 text-zinc-400">
                  {details.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {footnote && (
                <p className="mt-auto border-t border-white/10 pt-5 text-[11px] font-light leading-4 text-zinc-500">
                  {footnote}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
