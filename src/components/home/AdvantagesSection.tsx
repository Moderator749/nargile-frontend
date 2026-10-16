import { createElement, type ReactNode } from "react";
import type { LucideProps } from "lucide-react";

import { homeIcon } from "@/lib/homeIcons";
import type { HomeAdvantageCard, HomeIconKey, Homepage } from "@/types";

/*
 * "Avantajlar": each advantage as its own small widget rather than a box with
 * an icon in it — compact, and laid out across rather than down. Every card
 * puts its figure on the left and a quiet visual that says the same thing on
 * the right, on one line (a parcel on its route, a delivery window, three
 * equal instalments, a discount staircase, a transfer slip, a loyalty coin, a
 * filling money box), with its words packed tight beneath.
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
 * Six columns on a desktop: shipping runs four (with the courier's two beside
 * it), the three money cards two each, the two loyalty cards three each. Two
 * columns on a tablet, one on a phone. `grid-flow-dense` packs any other mix
 * of cards the admin makes.
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
  "group relative isolate flex min-w-0 flex-col overflow-hidden rounded-2xl p-4 md:p-5",
  "border shadow-sm transition-[transform,border-color,box-shadow] duration-500 ease-out",
  "motion-safe:hover:scale-[1.01] hover:shadow-md",
].join(" ");
const SURFACE = {
  neutral:
    "border-gray-100 bg-white hover:border-gray-200 dark:border-white/[0.06] dark:bg-zinc-900/60 dark:hover:border-white/[0.12]",
  gold: "border-amber-100/80 bg-gradient-to-br from-amber-50/60 via-white to-white hover:border-amber-200 dark:border-amber-400/10 dark:from-amber-400/[0.06] dark:via-zinc-900/60 dark:to-zinc-900/60 dark:hover:border-amber-400/20",
};

/** The figure: tight, in graphite fading to grey (or gold). */
const FIGURE =
  "bg-clip-text py-0.5 text-2xl font-semibold leading-none tracking-tighter text-transparent tabular-nums md:text-3xl";
const INK = "bg-gradient-to-br from-gray-950 to-gray-500 dark:from-white dark:to-zinc-500";
const GOLD = "bg-gradient-to-br from-amber-500 to-amber-800 dark:from-amber-200 dark:to-amber-500";

const LABEL = "text-[10px] font-semibold uppercase tracking-[0.16em]";
const TITLE = "text-sm font-semibold tracking-tight text-gray-900 dark:text-white";
const BODY = "text-xs leading-snug text-gray-500 dark:text-zinc-400";
const NOTE = "text-[11px] leading-snug text-gray-400 dark:text-zinc-500";
/** Room for the visual on the right of the figure. */
const VISUAL = "w-[45%] max-w-40 shrink-0";

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
      <div className="mx-auto mb-6 max-w-2xl text-center">
        {content.eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
            {content.eyebrow}
          </p>
        )}
        <h2
          id="advantages-heading"
          className="mt-2 text-balance text-3xl font-semibold tracking-tighter text-foreground md:text-4xl"
        >
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="mt-2 text-balance text-sm text-gray-500 dark:text-zinc-400">{content.subtitle}</p>
        )}
      </div>

      <ul className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
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

/** "30.000" → "30K", "49.999" → "50K": the short form the visuals have room for. */
const short = (amount: string) => `${Math.round(Number(amount.replace(/\./g, "")) / 1000)}K`;

interface Tier {
  /** Who it applies to, in full: "30.000 TL+", "≤ 29.999 TL", "30.000–49.999 TL". */
  range: string;
  /** The same, short: "30K+", "≤30K", "30–50K". */
  brief: string;
  percent: number;
}

/** A line that names an amount and a percentage, read as a tier ("50.000 TL ve üzeri … %8"). */
function tierOf(line: string): Tier | null {
  const percent = line.match(PERCENT);
  const amounts = [...line.matchAll(AMOUNT)].map((m) => m[1]);
  if (!percent || amounts.length === 0) return null;
  const upTo = line.toLocaleLowerCase("tr-TR").includes("kadar");
  const [from, to] = amounts;
  return {
    range: to ? `${from}–${to} TL` : upTo ? `≤ ${from} TL` : `${from} TL+`,
    brief: to ? `${short(from).replace("K", "")}–${short(to)}` : upTo ? `≤${short(from)}` : `${short(from)}+`,
    percent: Number(percent[1].replace(",", ".")),
  };
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

/** The words, packed tight under the figure. */
function Copy({ card, lead, className = "" }: { card: HomeAdvantageCard; lead?: string[]; className?: string }) {
  const body = lead ?? linesOf(card.description);
  return (
    <div className={className}>
      <h3 className={TITLE}>{card.title}</h3>
      {body.map((line, i) => (
        <p key={i} className={`mt-1 ${BODY}`}>
          {line}
        </p>
      ))}
      {card.note && <p className={`mt-1.5 ${NOTE}`}>{card.note}</p>}
    </div>
  );
}

/** The figure on the left (its label above it), the visual on the right, on one line. */
function Head({
  label,
  gold = false,
  figure,
  children,
}: {
  label: ReactNode;
  gold?: boolean;
  figure: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className={`${LABEL} ${gold ? "text-amber-700 dark:text-amber-400" : "text-gray-400 dark:text-zinc-500"}`}>
          {label}
        </p>
        <div className="mt-1.5">{figure}</div>
      </div>
      {children && (
        <div aria-hidden className={VISUAL}>
          {children}
        </div>
      )}
    </div>
  );
}

function AdvantageIcon({ icon, ...props }: { icon: HomeIconKey } & LucideProps) {
  return createElement(homeIcon(icon), props);
}

/* ── The cards ────────────────────────────────────────────────────────────── */

/** Free shipping: the threshold, the words beside it, a parcel crossing the route on the right. */
function ShippingCard({ card }: { card: HomeAdvantageCard }) {
  const stops = ["Sipariş", "Sevk", "Kapınızda"];
  return (
    <div className="grid h-full items-center gap-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.9fr)] md:gap-6">
      <div>
        <p className={`${LABEL} text-gray-400 dark:text-zinc-500`}>Ücretsiz kargo</p>
        <p className={`${FIGURE} ${INK} mt-1.5`}>{card.badge}</p>
      </div>
      <Copy card={card} />
      <div aria-hidden>
        <div className="relative mx-1.5">
          <div className="h-px w-full bg-[repeating-linear-gradient(90deg,var(--color-gray-300)_0_5px,transparent_5px_10px)] dark:bg-[repeating-linear-gradient(90deg,var(--color-zinc-700)_0_5px,transparent_5px_10px)]" />
          {stops.map((stop, i) => (
            <span
              key={stop}
              className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(i / (stops.length - 1)) * 100}%` }}
            >
              <span
                className={`block h-1.5 w-1.5 rounded-full ring-[3px] ring-white dark:ring-zinc-900 ${
                  i === stops.length - 1 ? "bg-gray-900 dark:bg-white" : "bg-gray-300 dark:bg-zinc-600"
                }`}
              />
            </span>
          ))}
          {/* The parcel: crosses once and waits at the door, then goes again. */}
          <span className="absolute top-0 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[advantage-route_4.5s_cubic-bezier(0.65,0,0.35,1)_infinite] motion-reduce:left-full">
            <span className="block h-2.5 w-2.5 rounded-[3px] bg-red-600 shadow-[0_4px_10px_-2px_rgba(220,38,38,0.6)]" />
          </span>
        </div>
        <div className="mt-2.5 flex justify-between text-[10px] font-medium text-gray-400 dark:text-zinc-500">
          {stops.map((stop) => (
            <span key={stop}>{stop}</span>
          ))}
        </div>
        <p className="mt-1.5 text-right text-xs font-medium text-gray-900 dark:text-white">
          Kargo <span className="tabular-nums">₺0</span>
        </p>
      </div>
    </div>
  );
}

/** Same-day courier: the delivery window as the figure, a line with a live dot on it. */
function CourierCard({ card }: { card: HomeAdvantageCard }) {
  const window = card.title.match(/(\d{1,2}[:.]\d{2})\s*[–-]\s*(\d{1,2}[:.]\d{2})/);
  if (!window) return <PlainCard card={card} />;
  const rest = card.title.replace(window[0], "").trim();
  return (
    <>
      <Head label={card.badge} figure={<p className={`${FIGURE} ${INK}`}>{`${window[1]}–${window[2]}`}</p>}>
        <div className="relative h-1 rounded-full bg-gray-100 dark:bg-white/[0.06]">
          <span className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-gradient-to-r from-gray-200 to-gray-900 dark:from-zinc-700 dark:to-white" />
          <span className="absolute left-[58%] top-1/2">
            <span className="absolute inline-flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
            <span className="relative block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 ring-[3px] ring-white dark:ring-zinc-900" />
          </span>
        </div>
        <p className="mt-2 text-right text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          Aynı gün kapınızda
        </p>
      </Head>
      <Copy card={{ ...card, title: rest || card.title }} className="mt-3" />
    </>
  );
}

/** Instalments: the count as the figure, that many equal payments beside it. */
function InstallmentsCard({ card }: { card: HomeAdvantageCard }) {
  const count = Math.min(Math.max(Number(card.badge.match(/\d+/)?.[0] ?? 0), 0), 12);
  if (!count) return <PlainCard card={card} />;
  return (
    <>
      <Head
        label="Taksit"
        figure={
          <p className="flex items-baseline gap-1.5">
            <span className={`${FIGURE} ${INK}`}>{count}</span>
            <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">eşit taksit</span>
          </p>
        }
      >
        <div className="flex gap-1">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="flex-1">
              <div className="h-1 rounded-full bg-gray-900 dark:bg-white" style={{ opacity: 1 - i * (0.55 / count) }} />
              <p className="mt-1.5 text-[10px] font-medium text-gray-400 tabular-nums dark:text-zinc-500">
                {i + 1}. ay
              </p>
            </div>
          ))}
        </div>
      </Head>
      <Copy card={card} className="mt-3" />
    </>
  );
}

/** A tiered discount: the range as the figure, a little staircase of its tiers beside it. */
function TiersCard({ card }: { card: HomeAdvantageCard }) {
  const { lead, tiers } = splitTiers(card.description);
  const top = Math.max(...tiers.map((t) => t.percent), 1);
  return (
    <>
      <Head label="Otomatik indirim" figure={<p className={`${FIGURE} ${INK}`}>{card.badge}</p>}>
        {tiers.length > 0 && (
          <div className="flex items-end justify-end gap-1.5">
            {tiers.map((tier) => (
              <div key={tier.range} className="w-9 text-center" title={`${tier.range}: %${tier.percent}`}>
                <p className="text-[10px] font-semibold tabular-nums text-gray-900 dark:text-white">%{tier.percent}</p>
                <div
                  className="mt-1 rounded-md bg-gradient-to-t from-gray-900 to-gray-600 dark:from-white dark:to-zinc-400"
                  style={{ height: `${Math.round(8 + (tier.percent / top) * 14)}px` }}
                />
                <p className="mt-1 text-[9px] font-medium text-gray-400 tabular-nums dark:text-zinc-500">
                  {tier.brief}
                </p>
              </div>
            ))}
          </div>
        )}
      </Head>
      {/* The tiers in full for anyone who cannot see the bars. */}
      {tiers.length > 0 && <p className="sr-only">{tiers.map((t) => `${t.range}: %${t.percent}`).join(", ")}</p>}
      <Copy card={card} lead={lead} className="mt-3" />
    </>
  );
}

/** Bank transfer: the range as the figure, the tiers as the lines of a small transfer slip. */
function TransferCard({ card }: { card: HomeAdvantageCard }) {
  const { lead, tiers } = splitTiers(card.description);
  return (
    <>
      <Head label="Havale & EFT" figure={<p className={`${FIGURE} ${INK}`}>{card.badge}</p>}>
        {tiers.length > 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 px-2 py-1 font-mono text-[10px] dark:border-white/10">
            {tiers.map((tier) => (
              <div key={tier.range} className="flex items-baseline gap-1.5">
                <span className="shrink-0 text-gray-500 dark:text-zinc-400">{tier.brief}</span>
                <span className="mb-0.5 flex-1 border-b border-dotted border-gray-200 dark:border-white/10" />
                <span className="font-semibold text-gray-900 dark:text-white">−%{tier.percent}</span>
              </div>
            ))}
          </div>
        )}
      </Head>
      {tiers.length > 0 && <p className="sr-only">{tiers.map((t) => `${t.range}: %${t.percent}`).join(", ")}</p>}
      <Copy card={card} lead={lead} className="mt-3" />
    </>
  );
}

/** Loyalty points: the earn rate in gold, beside a minted coin. */
function PointsCard({ card }: { card: HomeAdvantageCard }) {
  const { lead, tiers } = splitTiers(card.description);
  const rate = tiers[0];
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className={`${LABEL} text-amber-700 dark:text-amber-400`}>{card.badge}</p>
          {rate && (
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className={`${FIGURE} ${GOLD}`}>%{rate.percent}</span>
              <span className="text-[11px] font-medium text-amber-800/70 tabular-nums dark:text-amber-200/60">
                {rate.range} alışverişlerde
              </span>
            </p>
          )}
        </div>
        <Coin />
      </div>
      <Copy card={card} lead={lead} className="mt-3" />
    </>
  );
}

/** The money box: the amount that tips it into the wallet, and small purchases filling up towards it. */
function PiggyCard({ card }: { card: HomeAdvantageCard }) {
  const threshold = [...card.description.matchAll(AMOUNT)][0]?.[1];
  // Purchases of different sizes, adding up towards the threshold.
  const parts = [18, 11, 24, 15];
  return (
    <>
      <Head label={card.badge} gold figure={threshold ? <p className={`${FIGURE} ${GOLD}`}>{threshold} TL</p> : null}>
        {threshold && (
          <>
            <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-amber-100/70 dark:bg-amber-400/10">
              {parts.map((width, i) => (
                <span
                  key={i}
                  className="h-full bg-gradient-to-r from-amber-300 to-amber-500 first:rounded-l-full dark:from-amber-300/70 dark:to-amber-500/80"
                  style={{ width: `${width}%`, opacity: 0.55 + i * 0.15 }}
                />
              ))}
            </div>
            <p className="mt-2 text-right text-[10px] font-medium text-amber-800/70 dark:text-amber-200/60">
              cüzdana aktarım
            </p>
          </>
        )}
      </Head>
      <Copy card={card} className="mt-3" />
    </>
  );
}

/** A card the themes do not cover: its icon, label and words. */
function PlainCard({ card }: { card: HomeAdvantageCard }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <AdvantageIcon
          icon={card.icon}
          className="h-4 w-4 text-gray-900 dark:text-white"
          strokeWidth={1.5}
          aria-hidden
        />
        {card.badge && <p className={`${LABEL} text-gray-400 dark:text-zinc-500`}>{card.badge}</p>}
      </div>
      <Copy card={card} className="mt-3" />
    </>
  );
}

/** A minted SultanPuan coin: warm gold, a fine inner rim, a soft sheen. */
function Coin() {
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
