import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { canOptimiseImage, type PromoBox } from "@/lib/home";

// The visible boxes always fill the row: 3 → thirds, 2 → halves, 1 → full width.
const COLS: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3" };

const SURFACE: Record<PromoBox["variant"], string> = {
  image:
    "bg-white shadow-sm shadow-black/[0.04] hover:shadow-xl hover:shadow-black/[0.08] dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.06]",
  text:
    "bg-white shadow-sm shadow-black/[0.04] hover:shadow-xl hover:shadow-black/[0.08] dark:bg-zinc-900 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.06]",
  transparent:
    "bg-transparent ring-1 ring-inset ring-black/[0.08] hover:ring-black/20 dark:ring-white/10 dark:hover:ring-white/25",
};

/**
 * How a box uses its image:
 * - image: a product photo beside the text (supplier photos are shot on white);
 * - text: a full-bleed background behind a light veil, so the dark text stays legible;
 * - transparent: a full-bleed photo behind a dark veil, with white text.
 */
function Background({ box }: { box: PromoBox }) {
  if (!box.image || box.variant === "image") return null;
  return (
    <>
      <Image
        src={box.image}
        alt=""
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        unoptimized={!canOptimiseImage(box.image)}
        className="-z-20 object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
      />
      <span
        aria-hidden
        className={`absolute inset-0 -z-10 ${
          box.variant === "text"
            ? "bg-gradient-to-r from-white via-white/85 to-white/40 dark:from-zinc-900 dark:via-zinc-900/85 dark:to-zinc-900/40"
            : "bg-gradient-to-t from-black/75 via-black/40 to-black/10"
        }`}
      />
    </>
  );
}

/** Modules 6 & 7: a row of up to 3 Apple-style feature cards; pass only the visible boxes. */
export function PromoGrid({ boxes, label }: { boxes: PromoBox[]; label: string }) {
  if (boxes.length === 0) return null;

  return (
    <section aria-label={label}>
      <ul className={`grid grid-cols-1 gap-4 ${COLS[Math.min(boxes.length, 3)]}`}>
        {boxes.map((box) => {
          // A photo behind a transparent box makes it a dark, white-text card.
          const onPhoto = box.variant === "transparent" && !!box.image;
          return (
            <li key={box.id} className="flex">
              <Link
                href={box.href}
                className={`group relative isolate flex min-h-64 w-full overflow-hidden rounded-[2rem] p-7 transition-[box-shadow,transform] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:hover:-translate-y-1 sm:p-8 ${
                  box.variant === "image" ? "flex-col sm:flex-row sm:items-center sm:gap-6" : "flex-col"
                } ${onPhoto ? "ring-0" : SURFACE[box.variant]}`}
              >
                <Background box={box} />
                <div className={`flex flex-1 flex-col ${box.variant === "image" ? "" : "justify-between"}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[11px] font-medium uppercase tracking-[0.25em] ${onPhoto ? "text-white/75" : "text-muted-foreground"}`}
                      >
                        {box.eyebrow}
                      </p>
                      {box.badge === "sok" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-white">
                          Şok
                        </span>
                      )}
                    </div>
                    <h3
                      className={`mt-3 text-balance text-2xl font-semibold leading-tight tracking-tighter sm:text-3xl ${onPhoto ? "text-white" : "text-foreground"}`}
                    >
                      {box.title}
                    </h3>
                    {box.text && (
                      <p className={`mt-2 text-sm font-light ${onPhoto ? "text-white/80" : "text-muted-foreground"}`}>{box.text}</p>
                    )}
                  </div>
                  <span className={`mt-6 inline-flex items-center gap-1 text-sm font-medium ${onPhoto ? "text-white" : "text-foreground"}`}>
                    İncele
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                </div>
                {box.variant === "image" && box.image && (
                  // Fixed square box: the photo never shifts the layout. Supplier photos are shot on
                  // white, so in dark mode they sit on a light plate instead of a harsh white square.
                  <div className="relative mx-auto mt-6 aspect-square w-40 shrink-0 rounded-2xl sm:mt-0 sm:w-44 lg:w-40 xl:w-48 dark:bg-zinc-100">
                    <Image
                      src={box.image}
                      alt=""
                      fill
                      sizes="200px"
                      unoptimized={!canOptimiseImage(box.image)}
                      className="object-contain p-2 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                    />
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
