import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PAGE_CONTAINER } from "@/lib/layout";

interface Banner {
  /** The small label over the title. */
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  /**
   * The card's background until a photo takes its place: a gradient and the
   * shapes drawn over it (Tailwind classes, so they are generated).
   */
  backdrop: string;
  /** Decorative light over the gradient: `slate` (silver) or `crimson` (warm gold). */
  accent: "slate" | "crimson";
}

/**
 * The two boxes. Placeholder art: each background is CSS until the shop's own
 * photos replace it — swap `backdrop` for an image layer, the rest stays.
 */
const BANNERS: Banner[] = [
  {
    eyebrow: "Sınırlı Stok",
    title: "Premium Takımlarda Efsane Fırsat",
    subtitle: "Sınırlı stoklarla sunulan elit koleksiyonu keşfedin.",
    cta: "Hemen İncele",
    href: "/firsat-urunleri",
    backdrop: "bg-gradient-to-br from-slate-600 via-slate-800 to-zinc-950",
    accent: "slate",
  },
  {
    eyebrow: "Yeni Sezon",
    title: "Yeni Sezon Lüle Çeşitleri",
    subtitle: "Profesyonel seanslar için tasarlandı.",
    cta: "Koleksiyona Git",
    href: "/catalog/luleler",
    backdrop: "bg-gradient-to-br from-red-600 via-red-900 to-neutral-950",
    accent: "crimson",
  },
];

/** The light each accent throws: a soft glow up top and fine rings at the right. */
const ACCENTS = {
  slate: { glow: "bg-slate-200/25", ring: "border-white/15" },
  crimson: { glow: "bg-amber-300/25", ring: "border-amber-200/20" },
} as const;

/**
 * Two campaign boxes under "Fırsatları Kaçırma", side by side from `md`, one
 * over the other below it. Each box is one link: a fixed-ratio frame (so
 * nothing moves when the photos arrive), its background slowly growing under
 * the pointer, a dark gradient from the foot so the words hold on any
 * picture, and the words at the bottom left — a label, the title, a line, and
 * the call with its arrow nudging forward. Motion stops for reduced motion.
 */
export function CampaignBanners() {
  return (
    <section aria-labelledby="kampanyalar-baslik" className="bg-white py-10 md:py-12 dark:bg-transparent">
      <h2 id="kampanyalar-baslik" className="sr-only">
        Kampanyalar
      </h2>
      <ul className={`${PAGE_CONTAINER} grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8`}>
        {BANNERS.map((banner) => {
          const accent = ACCENTS[banner.accent];
          return (
            <li key={banner.href}>
              <Link
                href={banner.href}
                className="group relative isolate block aspect-[16/10] overflow-hidden rounded-3xl bg-neutral-900 shadow-[0_24px_48px_-28px_rgb(0_0_0/0.55)] ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:aspect-[16/9] md:aspect-[4/3] lg:aspect-[16/10] dark:ring-white/10"
              >
                {/* The background — and everything drawn on it — grows a little under the pointer. */}
                <div
                  aria-hidden
                  className={`absolute inset-0 -z-20 ${banner.backdrop} transition-transform duration-500 ease-out motion-safe:group-hover:scale-105`}
                >
                  <div className={`absolute -right-16 -top-24 h-72 w-72 rounded-full blur-3xl ${accent.glow}`} />
                  <div className={`absolute -right-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full border ${accent.ring}`} />
                  <div className={`absolute -right-10 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full border ${accent.ring}`} />
                  <div className={`absolute right-6 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border ${accent.ring}`} />
                  {/* A fine diagonal sheen, so the flat gradient reads as a surface. */}
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.035)_0_1px,transparent_1px_14px)]" />
                </div>

                {/* The words' ground: dark from the foot, clear at the top. */}
                <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="flex h-full flex-col justify-end p-6 sm:p-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">{banner.eyebrow}</p>
                  <h3 className="mt-2 max-w-md text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                    {banner.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">{banner.subtitle}</p>
                  <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/20 transition-colors duration-200 group-hover:bg-red-600 group-hover:text-white">
                    {banner.cta}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
