import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { PAGE_CONTAINER } from "@/lib/layout";

/** Decorative light over a gradient: silver, a warm gold, or a deep rose. */
type Accent = "slate" | "gold" | "rose";

interface Banner {
  title: string;
  subtitle: string;
  href: string;
  /**
   * The background until a photo takes its place: a gradient (Tailwind
   * classes, so they are generated). Swap it for an image layer later; the
   * rest of the card stays.
   */
  backdrop: string;
  accent: Accent;
}

/** The big box on the left: its own label and call. */
const LEAD: Banner & { eyebrow: string; cta: string } = {
  eyebrow: "Sınırlı Stok",
  title: "Premium Takımlarda Efsane Fırsat",
  subtitle: "Sınırlı stoklarla sunulan elit koleksiyonu keşfedin.",
  cta: "Hemen İncele",
  href: "/firsat-urunleri",
  backdrop: "bg-gradient-to-br from-slate-600 via-slate-800 to-zinc-950",
  accent: "slate",
};

/** The three on the right: two side by side, then one across both. Placeholder art. */
const MINIS: Banner[] = [
  {
    title: "Lüle Seçkisi",
    subtitle: "Premium tatlar.",
    href: "/catalog/luleler",
    backdrop: "bg-gradient-to-br from-red-500 via-red-800 to-neutral-950",
    accent: "gold",
  },
  {
    title: "Közlükler",
    subtitle: "Isı kontrolü.",
    href: "/catalog/kozlukler",
    backdrop: "bg-gradient-to-br from-orange-500 via-orange-800 to-neutral-950",
    accent: "gold",
  },
  {
    title: "Yeni Aksesuarlar",
    subtitle: "Seansınızı zenginleştiren detaylar.",
    href: "/catalog/malzemeler",
    backdrop: "bg-gradient-to-br from-rose-700 via-rose-950 to-black",
    accent: "rose",
  },
];

/** The light each accent throws: a soft glow up top and fine rings at the right. */
const ACCENTS: Record<Accent, { glow: string; ring: string }> = {
  slate: { glow: "bg-slate-200/25", ring: "border-white/15" },
  gold: { glow: "bg-amber-300/25", ring: "border-amber-200/20" },
  rose: { glow: "bg-rose-300/20", ring: "border-rose-200/15" },
};

/** One card's frame: a link, its background growing under the pointer, the words at the foot. */
const CARD =
  "group relative isolate flex h-full overflow-hidden rounded-3xl bg-neutral-900 shadow-[0_24px_48px_-28px_rgb(0_0_0/0.55)] ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent dark:ring-white/10";

/** The gradient, the light and the rings — all of it scaling together under the pointer. */
function Backdrop({ backdrop, accent, compact = false }: Pick<Banner, "backdrop" | "accent"> & { compact?: boolean }) {
  const light = ACCENTS[accent];
  return (
    <>
      <div
        aria-hidden
        className={`absolute inset-0 -z-20 ${backdrop} transition-transform duration-500 ease-out motion-safe:group-hover:scale-105`}
      >
        <div className={`absolute -right-16 -top-24 h-72 w-72 rounded-full blur-3xl ${light.glow}`} />
        <div
          className={`absolute top-1/2 -translate-y-1/2 rounded-full border ${light.ring} ${compact ? "-right-16 h-48 w-48" : "-right-24 h-80 w-80"}`}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 rounded-full border ${light.ring} ${compact ? "-right-4 h-28 w-28" : "-right-10 h-52 w-52"}`}
        />
        {!compact && <div className={`absolute right-6 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border ${light.ring}`} />}
        {/* A fine diagonal sheen, so the flat gradient reads as a surface. */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_14px)]" />
      </div>
      {/* The words' ground: dark from the foot, clear at the top. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    </>
  );
}

/**
 * The campaign boxes under "Fırsatları Kaçırma": one big box on the left and,
 * on the right, a mini bento of three — two side by side over one across both.
 * From `md` the two columns share a row whose height the big box sets (its
 * fixed aspect ratio), and the bento's two rows split that height, so both
 * sides always end level. Below `md` the big box comes first and the bento
 * follows, its two small boxes still side by side.
 *
 * Every box is one link: its background — a placeholder gradient until the
 * shop's photos, with soft light and rings — grows to 105% under the pointer
 * (500ms; still for reduced motion), a dark gradient from the foot holds the
 * words, and the call nudges forward. The big box keeps its label and pill
 * call; the small ones are tighter, with the arrow chip the category tiles use.
 */
export function CampaignBanners() {
  return (
    <section aria-labelledby="kampanyalar-baslik" className="bg-white py-10 md:py-12 dark:bg-transparent">
      <h2 id="kampanyalar-baslik" className="sr-only">
        Kampanyalar
      </h2>
      <ul className={`${PAGE_CONTAINER} grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8`}>
        {/* The big box: its aspect ratio sets the row's height. */}
        <li>
          <Link
            href={LEAD.href}
            // Square on a tablet, where half the row is too narrow for the words at
            // a wider ratio; 16:10 again from lg.
            className={`${CARD} aspect-[16/10] sm:aspect-[16/9] md:aspect-square lg:aspect-[16/10]`}
          >
            <Backdrop backdrop={LEAD.backdrop} accent={LEAD.accent} />
            <div className="flex h-full flex-col justify-end p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">{LEAD.eyebrow}</p>
              <h3 className="mt-2 max-w-md text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                {LEAD.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">{LEAD.subtitle}</p>
              <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/20 transition-colors duration-200 group-hover:bg-red-600 group-hover:text-white">
                {LEAD.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </Link>
        </li>

        {/* The mini bento: two rows splitting the big box's height. */}
        <li>
          <ul className="grid h-full grid-cols-2 grid-rows-[10rem_10rem] gap-4 md:grid-rows-2 lg:gap-5">
            {MINIS.map((mini, i) => (
              <li key={mini.href} className={i === 2 ? "col-span-2" : undefined}>
                <Link href={mini.href} className={CARD}>
                  <Backdrop backdrop={mini.backdrop} accent={mini.accent} compact />
                  <div className="flex w-full items-end justify-between gap-3 p-4 sm:p-5 lg:p-6">
                    <div className="min-w-0">
                      <h3 className="text-balance text-lg font-extrabold leading-tight tracking-tight text-white lg:text-xl">
                        {mini.title}
                      </h3>
                      <p className="mt-1 text-xs leading-snug text-white/75 lg:text-sm">{mini.subtitle}</p>
                    </div>
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur-md transition-colors duration-300 group-hover:bg-white group-hover:text-neutral-950"
                    >
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:rotate-45" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </section>
  );
}
