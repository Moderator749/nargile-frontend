"use client";

import Link from "next/link";
import { ArrowUpRight, Crown, Truck } from "lucide-react";

import { useStoreParameters } from "@/hooks/useStoreParameters";
import { formatMoneyCompact } from "@/lib/format";
import { PAGE_CONTAINER } from "@/lib/layout";
import { retailPerks } from "@/lib/perks";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";

/** The courier's route across the İstanbul panel, in the 200×44 box it runs in. */
const ROUTE = "M4 34 C 46 34, 52 8, 100 10 S 154 36, 196 14";

/**
 * One glass panel on the dark band. On hover it rises a little and its own red
 * glow warms; with reduced motion it only warms.
 */
const PANEL =
  "group relative isolate overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition-[transform,background-color,border-color] duration-300 ease-out hover:border-white/20 hover:bg-white/[0.07] motion-safe:hover:-translate-y-0.5 sm:p-8";
/** The panel's own glow, in a corner; brighter while the panel is hovered. */
const PANEL_GLOW =
  "pointer-events-none absolute -z-10 h-56 w-56 rounded-full bg-red-600/25 blur-3xl transition-opacity duration-300 opacity-60 group-hover:opacity-100";
const EYEBROW = "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-300/90";

/**
 * The shipping privileges, as a break between the homepage's two product rows:
 * a dark band with a slow red mesh behind two glass panels, set off-balance —
 * the free-shipping threshold as the band's one big figure, and İstanbul's
 * same-day courier beside it with its route drawn and a dot running it.
 *
 * The threshold is the live one ("Parametreler"), the figure checkout applies.
 * Both are retail promises: free shipping over the threshold is a retail
 * perk (`checkout_engine.shipping_quote`), and the courier is offered as one
 * on the product page (`RetailPerks`). So, as the SultanPuan row, the band is
 * not shown to a signed-in B2B account, which would be promised something
 * checkout will not honour; a visitor, a retail customer and the panel's
 * staff see it.
 */
export function PremiumShippingBanner() {
  const params = useStoreParameters();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  if (hydrated && user && !retailPerks(user) && !isAdminRole(user.role)) return null;

  const threshold = formatMoneyCompact(params.free_shipping_threshold);

  return (
    // The rows above and below stand on white: the band sits on it as an inset
    // jewel rather than running edge to edge.
    <div className="bg-white py-4 sm:py-6 dark:bg-transparent">
      <section aria-labelledby="kargo-ayricaliklari-baslik" className={PAGE_CONTAINER}>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-neutral-950 px-4 py-8 text-white shadow-2xl shadow-black/20 ring-1 ring-white/10 sm:px-8 sm:py-10 lg:px-12">
          {/* The mesh: two red glows and a cooler one, drifting. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-red-700/40 blur-[110px] motion-safe:animate-glow-drift" />
            <div className="absolute -bottom-40 right-[18%] h-[26rem] w-[26rem] rounded-full bg-rose-500/20 blur-[120px] motion-safe:animate-glow-drift [animation-delay:-7s]" />
            <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
            {/* A fine grid over it, fading out, so the dark reads as a surface. */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
          </div>

          <h2 id="kargo-ayricaliklari-baslik" className="sr-only">
            Kargo ayrıcalıkları
          </h2>

          {/* Off-balance: the threshold takes the wider share, the courier the
              rest; one under the other below `lg`. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
            <div className={PANEL}>
              <span aria-hidden className={`${PANEL_GLOW} -left-16 -top-20`} />
              <p className={EYEBROW}>
                <Truck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Ücretsiz Kargo
              </p>
              <p className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-1">
                <span className="bg-gradient-to-br from-white via-white to-red-200 bg-clip-text pr-1 pb-1 text-6xl font-black leading-none tracking-[-0.03em] text-transparent tabular-nums sm:text-7xl xl:text-8xl">
                  {threshold}
                </span>
                <span className="pb-1 text-2xl font-extralight tracking-tight text-white/80 sm:text-3xl">
                  üzeri <span className="font-semibold text-white">ücretsiz kargo</span>
                </span>
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
                Sepetiniz {threshold} ve üzerindeyse kargo bizden; kapınıza ya da seçtiğiniz Yurtiçi Kargo şubesine.
              </p>
            </div>

            <div className={PANEL}>
              <span aria-hidden className={`${PANEL_GLOW} -bottom-24 -right-16`} />
              <p className={EYEBROW}>
                <Crown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                İstanbul İçi · VIP
              </p>
              <p className="mt-5 text-3xl font-extralight leading-tight tracking-tight text-white/85 sm:text-4xl">
                Aynı gün
                <span className="block font-semibold text-white">kapınızda.</span>
              </p>

              {/* The route: a hairline from the shop to the door, the courier's
                  dot running it, and the door marked. Fixed size, so the dot's
                  path (`ROUTE`) is in the same pixels as the line. */}
              <div aria-hidden className="relative mt-5 h-11 w-[200px]">
                <svg viewBox="0 0 200 44" className="absolute inset-0 h-11 w-[200px] overflow-visible">
                  <path d={ROUTE} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />
                  <circle cx="4" cy="34" r="3" fill="rgb(255 255 255 / 0.5)" />
                  <circle cx="196" cy="14" r="5" fill="none" stroke="rgb(248 113 113)" strokeWidth="1.5" />
                </svg>
                <span
                  className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_3px_rgba(239,68,68,0.7)] motion-safe:animate-courier-run"
                  style={{ offsetPath: `path("${ROUTE}")`, offsetDistance: "100%" }}
                />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/55">
                Kurye ile 10:00 – 20:00 arası, siparişiniz aynı gün elinizde.
              </p>
            </div>
          </div>

          <Link
            href="/bilgi/kargo-ve-teslimat"
            className="group/link mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Kargo ve teslimat koşulları
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover/link:-translate-y-0.5 motion-safe:group-hover/link:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
