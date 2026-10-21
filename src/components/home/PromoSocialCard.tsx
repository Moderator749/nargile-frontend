"use client";

import type { ComponentType } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import { InstagramIcon, YouTubeIcon } from "@/components/icons/SocialIcons";
import { SmoothAnchor } from "@/components/home/SmoothAnchor";
import { useMessages } from "@/components/i18n/LocaleProvider";
import type { PromoBox } from "@/lib/home";
import { homeMessages } from "@/lib/i18n/messages/home";

/** The two channels, each with its brand's own colour behind the glyph. */
const CHANNELS: { key: "instagram" | "youtube"; Icon: ComponentType<{ className?: string }>; badge: string }[] = [
  { key: "instagram", Icon: InstagramIcon, badge: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" },
  { key: "youtube", Icon: YouTubeIcon, badge: "bg-red-600" },
];

/**
 * The promo card beside the hero, in two bands: a crimson band on top
 * with the jump to the advantages, and a dark glass band below with the shop's
 * channels.
 *
 * The two channel pills sit side by side wherever the card is wide enough for
 * both labels (a container query, not a breakpoint: the grid makes the card
 * narrowest on a tablet, not a phone) and stack otherwise, so nothing clips.
 * The card holds three links, so it is not one link as a whole.
 */
export function PromoSocialCard({ box, preview = false }: { box: PromoBox; preview?: boolean }) {
  const t = useMessages(homeMessages);
  const widget = box.widget;
  const channels = CHANNELS.flatMap(({ key, Icon, badge }) => {
    const href = widget?.[`${key}_href`];
    return href ? [{ key, href, label: widget![`${key}_label`], Icon, badge }] : [];
  });
  // The dots are drawn here; any the admin typed are dropped so they never double.
  const eyebrow = box.eyebrow.replace(/^[•·\s]+|[•·\s]+$/g, "");

  return (
    <div className="@container relative isolate flex min-h-48 w-full flex-col overflow-hidden rounded-3xl bg-neutral-950 text-white shadow-sm ring-1 ring-inset ring-white/10">
      {/* Top band: the jump to the advantages, crimson. */}
      <div className="relative flex flex-1 flex-col justify-between gap-3 overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-950 p-4 sm:p-5">
        <span aria-hidden className="pointer-events-none absolute -bottom-16 -end-10 h-40 w-40 rounded-full bg-black/25 blur-2xl" />
        <div className="relative">
          {eyebrow && (
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/75">
              <span aria-hidden>• </span>
              {eyebrow}
              <span aria-hidden> •</span>
            </p>
          )}
          <h3 className="mt-1.5 text-balance text-base font-bold leading-tight tracking-tight sm:text-lg">{box.title}</h3>
        </div>
        <SmoothAnchor
          href={box.href}
          className="relative inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[12px] font-semibold text-red-700 shadow-lg shadow-black/20 transition-[transform,box-shadow] duration-200 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:hover:-translate-y-0.5"
        >
          {widget?.anchor_label ?? t.explore}
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        </SmoothAnchor>
      </div>

      {/* Bottom band: the channels, on dark glass. */}
      {channels.length > 0 && (
        <div className="relative border-t border-white/10 bg-white/[0.03] p-4 backdrop-blur-md sm:px-5">
          <span aria-hidden className="pointer-events-none absolute -start-10 -top-12 -z-10 h-28 w-28 rounded-full bg-red-500/15 blur-3xl" />
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/60">{box.text || t.followUs}</p>
          <ul className={`mt-2.5 grid gap-2 ${channels.length > 1 ? "@min-[17rem]:grid-cols-2" : ""}`}>
            {channels.map(({ key, href, label, Icon, badge }) => (
              <li key={key} className="min-w-0">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={preview ? -1 : undefined}
                  className="group flex items-center gap-2 whitespace-nowrap rounded-full bg-white/[0.06] py-1.5 ps-1.5 pe-3 text-[12px] font-medium ring-1 ring-inset ring-white/10 transition-colors duration-200 hover:bg-white/[0.12] hover:ring-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${badge}`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-white/50 transition-transform duration-200 group-hover:text-white rtl:-scale-x-100 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                  <span className="sr-only">{t.newTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
