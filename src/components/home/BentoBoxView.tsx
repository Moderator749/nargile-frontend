import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import Image from "next/image";

import { canOptimiseImage } from "@/lib/home";
import type { HomeBentoBox, HomeBoxText } from "@/types";

/**
 * One "Görsel Vitrin" box, as the homepage shows it and as the admin edits it
 * — the same markup in both, so what is placed in the drawer is what ships
 * (as HeroSlideView is for the slider).
 *
 * The box keeps one shape, 3:4, at every width, and everything on it is a
 * fraction of its width (`cqw`): a text's x/y is in % of the box, its size in
 * px of a 400px-wide box (the box on a desktop) — so the drawer's smaller
 * preview, a phone and a wide screen all show the same composition, scaled.
 */

/** Px per cqw on the 400px-wide box the sizes are given for. */
const REFERENCE = 4;

/** Each text's size where the admin has set none: what a resize starts from. */
export const BOX_DEFAULT_PX: Record<HomeBoxText, number> = { eyebrow: 11, title: 34, subtitle: 15 };

export const BOX_TEXTS: { part: HomeBoxText; label: string }[] = [
  { part: "eyebrow", label: "Üst etiket" },
  { part: "title", label: "Başlık" },
  { part: "subtitle", label: "Alt metin" },
];

/** A part placed on the box: centred on its point, as wide as its content. */
const PLACED = "absolute left-(--x) top-(--y) m-0 w-max max-w-[88cqw] -translate-x-1/2 -translate-y-1/2";

export interface BoxEditorBinding {
  /** Event handlers and a11y props that make a text draggable. */
  bind: (part: HomeBoxText) => HTMLAttributes<HTMLElement>;
  selected: HomeBoxText | null;
  /** The corner handle that resizes a selected text, by dragging. */
  resize: (part: HomeBoxText) => HTMLAttributes<HTMLElement>;
}

/** The dark wash: darkest at the bottom, where the words usually sit, fading upwards. */
export function overlayStyle(strength: number): CSSProperties {
  const a = strength / 100;
  return {
    background: `linear-gradient(to top, rgb(0 0 0 / ${a}) 0%, rgb(0 0 0 / ${(a * 0.55).toFixed(3)}) 45%, rgb(0 0 0 / ${(a * 0.2).toFixed(3)}) 100%)`,
  };
}

function ResizeHandle({ editor, part }: { editor?: BoxEditorBinding; part: HomeBoxText }) {
  if (!editor || editor.selected !== part) return null;
  return (
    <span
      {...editor.resize(part)}
      data-resize={part}
      className="absolute -end-2 -bottom-2 z-10 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-red-500 shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rtl:cursor-nesw-resize"
    />
  );
}

export function BentoBoxView({
  box,
  sizes,
  eager = false,
  editor,
  className = "",
  frameProps,
  children,
}: {
  box: HomeBentoBox;
  /** The photo's `sizes`: how wide it is drawn, for the image optimiser. */
  sizes: string;
  eager?: boolean;
  /** Present in the drawer: the texts become draggable and resizable. */
  editor?: BoxEditorBinding;
  className?: string;
  frameProps?: HTMLAttributes<HTMLDivElement>;
  /** Extra layers (the editor's guides). */
  children?: ReactNode;
}) {
  const placed = box.layout !== null;
  const has: Record<HomeBoxText, boolean> = {
    eyebrow: !!box.eyebrow.trim(),
    title: !!box.title.trim(),
    subtitle: !!box.subtitle.trim(),
  };

  const part = (name: HomeBoxText, own: string) => {
    const px = box.font_sizes?.[name] ?? BOX_DEFAULT_PX[name];
    const color = box.text_colors?.[name];
    const editing = editor
      ? `relative cursor-grab touch-none select-none outline-dashed outline-1 outline-offset-4 active:cursor-grabbing ${
          editor.selected === name ? "outline-2 outline-red-500" : "outline-white/40 hover:outline-white/80"
        }`
      : "";
    return {
      ...(editor?.bind(name) ?? {}),
      "data-part": name,
      className: `${placed ? PLACED : ""} block whitespace-pre-line text-left text-[length:var(--fs)] ${own} ${editing}`,
      style: {
        ...(box.layout ? { "--x": `${box.layout[name].x}%`, "--y": `${box.layout[name].y}%` } : {}),
        "--fs": `${(px / REFERENCE).toFixed(4)}cqw`,
        ...(color ? { color } : {}),
      } as CSSProperties,
    };
  };

  return (
    <div
      {...frameProps}
      className={`@container relative isolate aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-900 text-white ${className}`}
    >
      <Image
        src={box.image}
        alt={box.alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        unoptimized={!canOptimiseImage(box.image)}
        style={{ objectPosition: `${box.focus_x}% ${box.focus_y}%` }}
        className="pointer-events-none -z-20 object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
      />
      {box.overlay && <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={overlayStyle(box.overlay_strength)} />}

      {/* Stacked at the bottom until a text is moved; then each sits on its own point. */}
      <div
        className={
          placed
            ? "contents"
            : // Bottom left in Arabic too: a composition is a side of the photo, as a hero slide's is.
              "absolute inset-x-0 bottom-0 flex flex-col items-start gap-[2.5cqw] p-[7cqw] rtl:items-end [&>*]:max-w-full"
        }
      >
        {has.eyebrow && (
          <p {...part("eyebrow", "font-semibold uppercase tracking-[0.3em] text-white/85 [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]")}>
            {box.eyebrow}
            <ResizeHandle editor={editor} part="eyebrow" />
          </p>
        )}
        {has.title && (
          <p {...part("title", "font-semibold leading-[1.05] tracking-tight text-white [text-shadow:0_2px_20px_rgb(0_0_0/0.45)]")}>
            {box.title}
            <ResizeHandle editor={editor} part="title" />
          </p>
        )}
        {has.subtitle && (
          <p {...part("subtitle", "font-light leading-snug text-white/90 [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]")}>
            {box.subtitle}
            <ResizeHandle editor={editor} part="subtitle" />
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
