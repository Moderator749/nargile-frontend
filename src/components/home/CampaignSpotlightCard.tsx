"use client";

import { ArrowRight, Crown, Truck } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useShippingPerks } from "@/hooks/useShippingPerks";
import { homeMessages } from "@/lib/i18n/messages/home";

/**
 * A collection's campaign card, at a product card's size: obsidian, a slow red
 * and gold mesh behind gold rings like a bowl seen from above, the
 * collection's name, the shipping perks, and "Tümünü Keşfet" into it. Made as
 * the lüle row's first slot; not used anywhere now — kept for a later
 * campaign (put it in a `flex` slot of a product card's width: it stretches
 * to the height of the cards beside it).
 *
 * The perks (`useShippingPerks`) quote the live free-shipping threshold and
 * are left out for a signed-in B2B account; the card keeps its size either way.
 */
export function CampaignSpotlightCard({ href }: { href: string }) {
  const { show: perks, threshold } = useShippingPerks();
  const { spotlight: t } = useMessages(homeMessages);
  const shipping = t.shipping(threshold);

  return (
    <article className="group relative isolate flex flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-950 p-6 text-white ring-1 ring-white/10 shadow-[0_18px_36px_-20px_rgb(0_0_0/0.5)] transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_18px_36px_-18px_rgb(220_38_38/0.45)] motion-safe:hover:-translate-y-1">
      {/* The mesh: red from the top, gold from the foot, drifting. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -start-20 -top-24 h-64 w-64 rounded-full bg-red-700/45 blur-3xl motion-safe:animate-glow-drift" />
        <div className="absolute -bottom-28 -end-16 h-64 w-64 rounded-full bg-amber-500/25 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-70 motion-safe:animate-glow-drift [animation-delay:-7s]" />
        {/* A bowl from above: gold rings, off the card's end edge. */}
        <svg viewBox="0 0 200 200" className="absolute -end-16 top-10 h-56 w-56 text-amber-200/20 transition-transform duration-500 ease-out motion-safe:group-hover:rotate-12">
          <g fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="96" strokeWidth="0.75" />
            <circle cx="100" cy="100" r="74" strokeWidth="0.75" strokeDasharray="1 5" strokeLinecap="round" />
            <circle cx="100" cy="100" r="52" strokeWidth="0.75" />
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <circle
                key={deg}
                cx={Math.round(100 + 30 * Math.cos((deg * Math.PI) / 180))}
                cy={Math.round(100 + 30 * Math.sin((deg * Math.PI) / 180))}
                r="4"
                strokeWidth="0.75"
              />
            ))}
            <circle cx="100" cy="100" r="4" strokeWidth="0.75" />
          </g>
        </svg>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/80">{t.eyebrow}</p>
      <h3 className="mt-4 text-3xl font-extralight leading-[1.05] tracking-tight text-white/85">
        {t.titleLead}
        <span className="block bg-gradient-to-r from-white via-white to-amber-200 bg-clip-text pb-1 font-semibold text-transparent rtl:bg-gradient-to-l">
          {t.titleAccent}
        </span>
      </h3>

      {perks && (
        <ul className="mt-6 space-y-2.5 rounded-xl border border-white/10 bg-white/[0.05] p-3.5 text-xs leading-snug text-white/75 backdrop-blur-sm">
          <li className="flex items-start gap-2.5">
            <Truck className="mt-px h-4 w-4 shrink-0 text-red-400" strokeWidth={1.75} aria-hidden />
            <span>
              {shipping.before}
              <span className="font-semibold text-white">{shipping.strong}</span>
              {shipping.after}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Crown className="mt-px h-4 w-4 shrink-0 text-amber-300" strokeWidth={1.75} aria-hidden />
            <span>
              {t.courier.before}
              <span className="font-semibold text-white">{t.courier.strong}</span>
              {t.courier.after}
            </span>
          </li>
        </ul>
      )}

      {/* At the foot, however tall the products make the card. */}
      <div className="mt-auto pt-6">
      <Link
        href={href}
        className="group/cta inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/30 transition-colors duration-200 hover:bg-red-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {t.cta}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 rtl:-scale-x-100 motion-safe:group-hover/cta:translate-x-0.5 rtl:motion-safe:group-hover/cta:-translate-x-0.5"
          aria-hidden
        />
      </Link>
      </div>
    </article>
  );
}
