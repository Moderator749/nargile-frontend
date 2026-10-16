import { createElement, type ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import { homeIcon } from "@/lib/homeIcons";
import type { HomeAdvantageCard, HomeIconKey, Homepage } from "@/types";

/*
 * "Avantajlar": each advantage as its own small piece of design rather than a
 * box with an icon in it. The figure is the hero, set large and tight; beside
 * or beneath it, a quiet visual that says the same thing — a parcel on its
 * route, a delivery window, three equal instalments, a discount staircase, a
 * transfer slip, a loyalty coin, a filling money box.
 *
 * Every card is still the admin's ("Ana Sayfa Düzenleme"): the theme is read
 * from what the card says (a "Kumbara" or "SultanPuan" badge) and otherwise
 * from the icon chosen for it, and the visuals are drawn from the card's own
 * words — the tiers in a discount card are its description's lines. A card
 * that fits no theme is shown plain.
 */

type Theme = "shipping" | "courier" | "installments" | "tiers" | "transfer" | "points" | "piggy" | "plain";

function themeOf(card: HomeAdvantageCard): Theme {
  const label = `${card.badge} ${card.title}`.toLocaleLowerCase("tr-TR");
  if (label.includes("kumbara")) return "piggy";
  if (label.includes("sultanpuan")) return "points";
  const byIcon: Partial<Record<HomeIconKey, Theme>> = {
    truck: "shipping",
    bike: "courier",
    "credit-card": "installments",
    "trending-up": "tiers",
    landmark: "transfer",
    "badge-check": "points",
  };
  return byIcon[card.icon] ?? "plain";
}

/**
 * The grid is six columns on a desktop: shipping runs four (with the courier's
 * two beside it), the three money cards two each, the two loyalty cards three
 * each. Two columns on a tablet, one on a phone. `grid-flow-dense` packs any
 * other mix of cards the admin makes.
 */
const SPAN: Record<Theme, string> = {
  shipping: "md:col-span-2 lg:col-span-4",
  courier: "lg:col-span-2",
  installments: "lg:col-span-2",
  tiers: "lg:col-span-2",
  transfer: "lg:col-span-2",
  points: "lg:col-span-3",
  piggy: "lg:col-span-3",
  plain: "lg:col-span-2",
};

const CARD = [
  "group relative isolate flex min-w-0 flex-col overflow-hidden rounded-3xl p-5 md:p-6",
  "border shadow-sm transition-[transform,border-color,box-shadow] duration-500 ease-out",
  "motion-safe:hover:scale-[1.01] hover:shadow-md",
].join(" ");
const SURFACE = {
  neutral:
    "border-gray-100 bg-white hover:border-gray-200 dark:border-white/[0.06] dark:bg-zinc-900/60 dark:hover:border-white/[0.12]",
  gold: "border-amber-100/80 bg-gradient-to-br from-amber-50/60 via-white to-white hover:border-amber-200 dark:border-amber-400/10 dark:from-amber-400/[0.06] dark:via-zinc-900/60 dark:to-zinc-900/60 dark:hover:border-amber-400/20",
};

/** The hero figure: large, tight, in graphite fading to grey (or gold). */
const FIGURE = "bg-clip-text font-semibold leading-none tracking-tighter text-transparent";
const INK = "bg-gradient-to-br from-gray-950 to-gray-500 dark:from-white dark:to-zinc-500";
const GOLD = "bg-gradient-to-br from-amber-500 to-amber-800 dark:from-amber-200 dark:to-amber-500";

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.18em]";
const TITLE = "text-base font-semibold tracking-tight text-gray-900 dark:text-white";
const BODY = "text-sm leading-relaxed text-gray-500 dark:text-zinc-400";
const NOTE = "text-xs leading-relaxed text-gray-400 dark:text-zinc-500";

export function AdvantagesSection({ content }: { content: Homepage["advantages"] }) {
  if (content.cards.length === 0 && !content.title) return null;
  return (
    <section
      id="avantajlar"
      aria-labelledby="advantages-heading"
      // The bottom space belongs to the section that follows: this one used to
      // be the last before the footer and still carried the padding for it.
      className="mx-auto w-full max-w-7xl scroll-mt-[var(--header-height)] px-4 pb-4 pt-5 sm:px-6 sm:pt-6"
    >
      <div className="mx-auto mb-8 max-w-2xl text-center">
        {content.eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
            {content.eyebrow}
          </p>
        )}
        <h2
          id="advantages-heading"
          className="mt-3 text-balance text-3xl font-semibold tracking-tighter text-foreground md:text-5xl"
        >
          {content.title}
        </h2>
        {content.subtitle && <p className={`mt-4 text-balance text-base ${BODY}`}>{content.subtitle}</p>}
      </div>

      <ul className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        {content.cards.map((card, i) => {
          const theme = themeOf(card);
          const gold = theme === "points" || theme === "piggy";
          return (
            <li
              key={`${card.title}-${i}`}
              className={`${CARD} ${gold ? SURFACE.gold : SURFACE.neutral} ${SPAN[theme]}`}
            >
              <AdvantageCard card={card} theme={theme} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AdvantageCard({ card, theme }: { card: HomeAdvantageCard; theme: Theme }) {
  switch (theme) {
    case "shipping":
      return <ShippingCard card={card} />;
    case "courier":
      return <CourierCard card={card} />;
    case "installments":
      return <InstallmentsCard card={card} />;
    case "tiers":
      return <TiersCard card={card} />;
    case "transfer":
      return <TransferCard card={card} />;
    case "points":
      return <PointsCard card={card} />;
    case "piggy":
      return <PiggyCard card={card} />;
    default:
      return <PlainCard card={card} />;
  }
}

/* ── Reading the card's own words ─────────────────────────────────────────── */

/** The description's lines: the first is the lead, the rest its detail. */
const linesOf = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean);

const AMOUNT = /(\d{1,3}(?:\.\d{3})+)\s*TL/g;
const PERCENT = /%\s?(\d+(?:[.,]\d+)?)/;

interface Tier {
  /** Who it applies to, in short: "30.000 TL+", "≤ 29.999 TL", "30.000–49.999 TL". */
  range: string;
  percent: number;
}

/** A line that names an amount and a percentage, read as a tier ("50.000 TL ve üzeri … %8"). */
function tierOf(line: string): Tier | null {
  const percent = line.match(PERCENT);
  const amounts = [...line.matchAll(AMOUNT)].map((m) => m[1]);
  if (!percent || amounts.length === 0) return null;
  const lower = line.toLocaleLowerCase("tr-TR");
  const range =
    amounts.length > 1
      ? `${amounts[0]}–${amounts[1]} TL`
      : lower.includes("kadar")
        ? `≤ ${amounts[0]} TL`
        : `${amounts[0]} TL+`;
  return { range, percent: Number(percent[1].replace(",", ".")) };
}

function splitTiers(description: string) {
  const lines = linesOf(description);
  const tiers = lines.map(tierOf);
  return {
    lead: lines.filter((_, i) => !tiers[i]),
    tiers: tiers.filter((t): t is Tier => !!t),
  };
}

/* ── Shared pieces ────────────────────────────────────────────────────────── */

function Copy({ card, lead, className = "" }: { card: HomeAdvantageCard; lead?: string[]; className?: string }) {
  const body = lead ?? linesOf(card.description);
  return (
    <div className={className}>
      <h3 className={TITLE}>{card.title}</h3>
      {body.map((line, i) => (
        <p key={i} className={`mt-1.5 ${BODY}`}>
          {line}
        </p>
      ))}
      {card.note && <p className={`mt-2.5 ${NOTE}`}>{card.note}</p>}
    </div>
  );
}

function AdvantageIcon({ icon, ...props }: { icon: HomeIconKey } & LucideProps) {
  return createElement(homeIcon(icon), props);
}

function Eyebrow({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return (
    <p className={`${LABEL} ${gold ? "text-amber-700 dark:text-amber-400" : "text-gray-400 dark:text-zinc-500"}`}>
      {children}
    </p>
  );
}

/* ── The cards ────────────────────────────────────────────────────────────── */

/** Free shipping: the threshold as the figure, a parcel crossing the route on the right. */
function ShippingCard({ card }: { card: HomeAdvantageCard }) {
  const stops = ["Sipariş", "Sevk", "Kapınızda"];
  return (
    <div className="flex h-full flex-col gap-6 md:flex-row md:items-center">
      <div className="flex-1">
        <Eyebrow>Ücretsiz kargo</Eyebrow>
        <p className={`${FIGURE} ${INK} mt-2 py-1 text-4xl md:text-5xl`}>{card.badge}</p>
        <Copy card={card} className="mt-3 max-w-sm" />
      </div>
      <div aria-hidden className="w-full md:w-[46%]">
        <div className="relative mx-3">
          <div className="h-px w-full bg-[repeating-linear-gradient(90deg,var(--color-gray-300)_0_6px,transparent_6px_12px)] dark:bg-[repeating-linear-gradient(90deg,var(--color-zinc-700)_0_6px,transparent_6px_12px)]" />
          {stops.map((stop, i) => (
            <span
              key={stop}
              className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(i / (stops.length - 1)) * 100}%` }}
            >
              <span
                className={`block h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                  i === stops.length - 1 ? "bg-gray-900 dark:bg-white" : "bg-gray-300 dark:bg-zinc-600"
                }`}
              />
            </span>
          ))}
          {/* The parcel: crosses once and waits at the door, then goes again. */}
          <span className="absolute top-0 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[advantage-route_4.5s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:left-full">
            <span className="block h-4 w-4 rounded-[5px] bg-red-600 shadow-[0_6px_16px_-4px_rgba(220,38,38,0.6)]" />
          </span>
        </div>
        <div className="mt-3 flex justify-between text-[10px] font-medium text-gray-400 dark:text-zinc-500">
          {stops.map((stop) => (
            <span key={stop}>{stop}</span>
          ))}
        </div>
        <p className="mt-4 text-right text-sm font-medium text-gray-900 dark:text-white">
          Kargo <span className="tabular-nums">₺0</span>
        </p>
      </div>
    </div>
  );
}

/** Same-day courier: the delivery window as a line with a live dot on it. */
function CourierCard({ card }: { card: HomeAdvantageCard }) {
  const window = card.title.match(/(\d{1,2}[:.]\d{2})\s*[–-]\s*(\d{1,2}[:.]\d{2})/);
  if (!window) return <PlainCard card={card} />;
  const rest = card.title.replace(window[0], "").trim();
  return (
    <>
      <Eyebrow>{card.badge}</Eyebrow>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className={`${FIGURE} ${INK} text-2xl tabular-nums md:text-3xl`}>{window[1]}</span>
        <span className={`${FIGURE} ${INK} text-2xl tabular-nums md:text-3xl`}>{window[2]}</span>
      </div>
      <div aria-hidden className="relative mt-3 h-1 rounded-full bg-gray-100 dark:bg-white/[0.06]">
        <span className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-gradient-to-r from-gray-200 to-gray-900 dark:from-zinc-700 dark:to-white" />
        <span className="absolute left-[58%] top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inline-flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
          <span className="relative block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-zinc-900" />
        </span>
      </div>
      <p className="mt-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Aynı gün kapınızda</p>
      <Copy card={{ ...card, title: rest || card.title }} className="mt-auto pt-4" />
    </>
  );
}

/** Instalments: the count as the figure, and that many equal payments under it. */
function InstallmentsCard({ card }: { card: HomeAdvantageCard }) {
  const count = Math.min(Math.max(Number(card.badge.match(/\d+/)?.[0] ?? 0), 0), 12);
  if (!count) return <PlainCard card={card} />;
  return (
    <>
      <Eyebrow>Taksit</Eyebrow>
      <div className="mt-2 flex items-end gap-3">
        <span className={`${FIGURE} ${INK} text-4xl md:text-5xl`}>{count}</span>
        <span className="pb-1 text-sm font-medium text-gray-500 dark:text-zinc-400">eşit taksit, sıfır fark</span>
      </div>
      <div aria-hidden className="mt-3 flex gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex-1">
            <div
              className="h-1 rounded-full bg-gray-900 transition-opacity duration-500 dark:bg-white"
              style={{ opacity: 1 - i * (0.55 / count) }}
            />
            <p className="mt-1.5 text-[10px] font-medium text-gray-400 tabular-nums dark:text-zinc-500">{i + 1}. ay</p>
          </div>
        ))}
      </div>
      <Copy card={card} className="mt-auto pt-4" />
    </>
  );
}

/** A tiered discount: the range as the figure, a staircase of its tiers beneath. */
function TiersCard({ card }: { card: HomeAdvantageCard }) {
  const { lead, tiers } = splitTiers(card.description);
  const top = Math.max(...tiers.map((t) => t.percent), 1);
  return (
    <>
      <Eyebrow>Otomatik indirim</Eyebrow>
      <p className={`${FIGURE} ${INK} mt-2 py-1 text-3xl md:text-4xl`}>{card.badge}</p>
      {tiers.length > 0 && (
        <div className="mt-3 flex items-end gap-3" aria-label="İndirim kademeleri">
          {tiers.map((tier) => (
            <div key={tier.range} className="flex-1">
              <p className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white">%{tier.percent}</p>
              <div
                className="mt-1.5 rounded-lg bg-gradient-to-t from-gray-900 to-gray-600 dark:from-white dark:to-zinc-400"
                style={{ height: `${Math.round(14 + (tier.percent / top) * 22)}px` }}
              />
              <p className="mt-1.5 text-[10px] font-medium leading-tight text-gray-400 tabular-nums dark:text-zinc-500">
                {tier.range}
              </p>
            </div>
          ))}
        </div>
      )}
      <Copy card={card} lead={lead} className="mt-auto pt-4" />
    </>
  );
}

/** Bank transfer: the range as the figure, the tiers as the lines of a transfer slip. */
function TransferCard({ card }: { card: HomeAdvantageCard }) {
  const { lead, tiers } = splitTiers(card.description);
  return (
    <>
      <Eyebrow>Havale & EFT</Eyebrow>
      <p className={`${FIGURE} ${INK} mt-2 py-1 text-3xl md:text-4xl`}>{card.badge}</p>
      {tiers.length > 0 && (
        <dl className="mt-3 rounded-xl border border-dashed border-gray-200 px-3 py-1.5 font-mono text-[11px] dark:border-white/10">
          {tiers.map((tier) => (
            <div key={tier.range} className="flex items-baseline gap-2 py-0.5">
              <dt className="shrink-0 text-gray-500 dark:text-zinc-400">{tier.range}</dt>
              <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-gray-200 dark:border-white/10" />
              <dd className="font-semibold text-gray-900 dark:text-white">−%{tier.percent}</dd>
            </div>
          ))}
        </dl>
      )}
      <Copy card={card} lead={lead} className="mt-auto pt-4" />
    </>
  );
}

/** Loyalty points: the earn rate in gold, beside a minted coin. */
function PointsCard({ card }: { card: HomeAdvantageCard }) {
  const { lead, tiers } = splitTiers(card.description);
  const rate = tiers[0];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Eyebrow gold>{card.badge}</Eyebrow>
          {rate && (
            <>
              <p className={`${FIGURE} ${GOLD} mt-2 py-1 text-3xl md:text-4xl`}>%{rate.percent}</p>
              <p className="mt-1 text-xs font-medium text-amber-800/70 tabular-nums dark:text-amber-200/60">
                {rate.range} alışverişlerde
              </p>
            </>
          )}
        </div>
        <Coin />
      </div>
      <Copy card={card} lead={lead} className="mt-auto pt-4" />
    </div>
  );
}

/** The money box: small purchases filling up to the amount that tips them into the wallet. */
function PiggyCard({ card }: { card: HomeAdvantageCard }) {
  const threshold = [...card.description.matchAll(AMOUNT)][0]?.[1];
  // Purchases of different sizes, adding up towards the threshold.
  const parts = [18, 11, 24, 15];
  return (
    <div className="flex h-full flex-col">
      <Eyebrow gold>{card.badge}</Eyebrow>
      {threshold && (
        <div className="mt-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`${FIGURE} ${GOLD} py-1 text-3xl tabular-nums md:text-4xl`}>{threshold} TL</p>
            <p className="text-xs font-medium text-amber-800/70 dark:text-amber-200/60">cüzdana aktarım</p>
          </div>
          <div
            aria-hidden
            className="mt-3 flex h-1.5 gap-1 overflow-hidden rounded-full bg-amber-100/70 dark:bg-amber-400/10"
          >
            {parts.map((width, i) => (
              <span
                key={i}
                className="h-full bg-gradient-to-r from-amber-300 to-amber-500 first:rounded-l-full dark:from-amber-300/70 dark:to-amber-500/80"
                style={{ width: `${width}%`, opacity: 0.55 + i * 0.15 }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-amber-800/60 dark:text-amber-200/50">
            Her alışveriş kumbaraya eklenir
          </p>
        </div>
      )}
      <Copy card={card} className="mt-auto pt-4" />
    </div>
  );
}

/** A card the themes do not cover: its icon, label and words. */
function PlainCard({ card }: { card: HomeAdvantageCard }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <AdvantageIcon
          icon={card.icon}
          className="h-5 w-5 text-gray-900 dark:text-white"
          strokeWidth={1.5}
          aria-hidden
        />
        {card.badge && <Eyebrow>{card.badge}</Eyebrow>}
      </div>
      <Copy card={card} className="mt-auto pt-6" />
    </>
  );
}

/** A minted SultanPuan coin: warm gold, a fine inner rim, a soft sheen. */
function Coin() {
  return (
    <span
      aria-hidden
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_12px_30px_-10px_rgba(217,119,6,0.55)] transition-transform duration-700 ease-out motion-safe:group-hover:rotate-12"
    >
      <span className="absolute inset-1 rounded-full border border-white/50" />
      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent" />
      <span className="relative text-sm font-bold tracking-tight text-amber-950/80">SP</span>
    </span>
  );
}
