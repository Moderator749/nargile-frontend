import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { canOptimiseImage, type PromoBox } from "@/lib/home";
import type { OverlayDirection, PromoPart } from "@/types";
import { SITE_NAME } from "@/lib/site";

/**
 * One promo card, as the storefront shows it and as /admin/promos edits it —
 * the same markup in both, so the preview is the card.
 *
 * Two layouts:
 * - The stacked card (no `layout`): eyebrow, title and text at the top, the
 *   link at the foot; the card is as tall as its row.
 * - Free positions (`layout` set), from `lg` up: the card is a 4:3 stage and
 *   each part is centred on its own x/y (in % of the card). Every size on the
 *   stage is a fraction of the card's width (`cqw`), taken from the card at its
 *   widest (≈307px, a third of the row beside the category column), so the
 *   card scales as one piece and the editor's preview matches it exactly.
 *   Below `lg` the card is the stacked one, where the type stays readable.
 */


/** A card's width on the storefront at its widest; the stage's unit of scale. */
export const PROMO_CARD_WIDTH = 920 / 3; // (952px row − 2 × 16px gaps) / 3

const SURFACE: Record<PromoBox["variant"], string> = {
  image:
    "bg-white shadow-sm shadow-black/[0.04] hover:shadow-xl hover:shadow-black/[0.08] dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.06]",
  text:
    "bg-white shadow-sm shadow-black/[0.04] hover:shadow-xl hover:shadow-black/[0.08] dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.06]",
  transparent:
    "bg-transparent ring-1 ring-inset ring-black/[0.08] hover:ring-black/20 dark:ring-white/10 dark:hover:ring-white/25",
  // Rendered by PromoSocialCard; here only so every variant has a surface.
  social: "bg-neutral-950 text-white",
};

const PLACED = "lg:absolute lg:left-(--x) lg:top-(--y) lg:m-0 lg:w-max lg:-translate-x-1/2 lg:-translate-y-1/2";

export interface PromoEditorBinding {
  bind: (part: PromoPart) => HTMLAttributes<HTMLElement>;
  selected: PromoPart | null;
}

/** The photo's dark veil, by direction: dark where the text is, clearing away from it. */
export const OVERLAY: Record<OverlayDirection, string> = {
  "to-r": "bg-gradient-to-r from-black/80 via-black/40 to-transparent",
  "to-l": "bg-gradient-to-l from-black/80 via-black/40 to-transparent",
  "to-b": "bg-gradient-to-b from-black/80 via-black/40 to-transparent",
  "to-t": "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
};

/**
 * A card with an image wears it full-bleed — cropped to the admin's focal
 * point and zoom — under a dark veil, with white type on top, whatever its
 * variant. A card without one keeps its variant's own surface.
 */
function Background({ box }: { box: PromoBox }) {
  if (!box.image) return null;
  return (
    <>
      <Image
        src={box.image}
        alt={box.title ? `${box.title} | ${SITE_NAME}` : SITE_NAME}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        unoptimized={!canOptimiseImage(box.image)}
        className="pointer-events-none -z-20 object-cover transition-[scale] duration-700 ease-out motion-safe:group-hover:scale-105"
        style={{
          objectPosition: `${box.focus.x}% ${box.focus.y}%`,
          transform: box.zoom > 100 ? `scale(${box.zoom / 100})` : undefined,
          transformOrigin: `${box.focus.x}% ${box.focus.y}%`,
        }}
      />
      <span aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${OVERLAY[box.overlay]}`} />
    </>
  );
}

export function PromoCardView({
  box,
  editor,
  className = "",
  children,
}: {
  box: PromoBox;
  /** Present in /admin/promos: parts become draggable and the card stops being a link. */
  editor?: PromoEditorBinding;
  className?: string;
  /** Extra layers on the card (the editor's guides). */
  children?: ReactNode;
}) {
  const placed = box.layout !== null;
  // Any card with a photo is a dark, white-type card.
  const onPhoto = !!box.image;

  const at = (name: PromoPart): CSSProperties | undefined =>
    box.layout ? ({ "--x": `${box.layout[name].x}%`, "--y": `${box.layout[name].y}%` } as CSSProperties) : undefined;
  const part = (name: PromoPart, own: string) => {
    const bound = editor?.bind(name) ?? {};
    const editing = editor
      ? `cursor-grab touch-none select-none outline-dashed outline-1 outline-offset-2 active:cursor-grabbing ${
          editor.selected === name ? "outline-2 outline-red-500" : onPhoto ? "outline-white/40 hover:outline-white/80" : "outline-black/25 hover:outline-black/60 dark:outline-white/30"
        }`
      : "";
    return { ...bound, "data-part": name, style: at(name), className: `${placed ? PLACED : ""} ${own} ${editing}` };
  };

  const frame = `group @container relative isolate flex min-h-48 w-full flex-col overflow-hidden rounded-3xl p-4 transition-[box-shadow,transform] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-5 ${
    editor ? "" : "motion-safe:hover:-translate-y-1"
  } ${placed ? "lg:block lg:aspect-[4/3] lg:min-h-0 lg:self-start lg:p-0" : ""} ${onPhoto ? "ring-0" : SURFACE[box.variant]} ${className}`;

  const content = (
    <>
      <Background box={box} />
      <div className={`flex flex-1 flex-col justify-between ${placed ? "lg:contents" : ""}`}>
        <div className={placed ? "lg:contents" : ""}>
          <div {...part("eyebrow", `flex items-center gap-2 ${placed ? "lg:gap-[2.609cqw]" : ""}`)}>
            <p
              className={`text-[11px] font-medium uppercase tracking-[0.25em] ${placed ? "lg:text-[3.587cqw]" : ""} ${onPhoto ? "text-white/75" : "text-muted-foreground"}`}
            >
              {box.eyebrow}
            </p>
            {box.badge === "sok" && (
              <span
                className={`rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white ${
                  placed ? "lg:px-[2.609cqw] lg:py-[0.652cqw] lg:text-[3.261cqw]" : ""
                }`}
              >
                Şok
              </span>
            )}
          </div>
          <h3
            {...part(
              "title",
              `mt-2 text-balance text-base font-bold leading-tight tracking-tight sm:text-lg ${placed ? "lg:max-w-[85cqw] lg:text-[5.870cqw]" : ""} ${
                onPhoto ? "text-white" : "text-foreground"
              }`,
            )}
          >
            {box.title}
          </h3>
          {box.text && (
            <p
              {...part(
                "text",
                `mt-1.5 text-[13px] font-light leading-relaxed ${placed ? "lg:max-w-[85cqw] lg:text-[4.239cqw]" : ""} ${
                  onPhoto ? "text-white/80" : "text-muted-foreground"
                }`,
              )}
            >
              {box.text}
            </p>
          )}
        </div>
        <span
          {...part(
            "button",
            `mt-4 inline-flex items-center gap-1 text-[13px] font-medium ${placed ? "lg:gap-[1.304cqw] lg:text-[4.239cqw]" : ""} ${
              onPhoto ? "text-white" : "text-foreground"
            }`,
          )}
        >
          İncele
          <ArrowUpRight
            className={`h-4 w-4 transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 ${
              placed ? "lg:h-[5.217cqw] lg:w-[5.217cqw]" : ""
            }`}
            strokeWidth={1.5}
            aria-hidden
          />
        </span>
      </div>
      {children}
    </>
  );

  if (editor) return <div className={frame}>{content}</div>;
  return (
    <Link href={box.href} className={frame}>
      {content}
    </Link>
  );
}
