"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, ShieldCheck, Thermometer, Wind } from "lucide-react";

import { ProductImage } from "@/components/catalog/ProductImage";
import { ShowcasePrice } from "@/components/home/ShowcasePrice";
import { useOwnPrices } from "@/hooks/useOwnPrices";
import { KOZLUK_CATEGORY_SLUG, type KozlukShowcaseData } from "@/lib/homeShowcases";
import { PAGE_CONTAINER } from "@/lib/layout";
import { productHref, productImageAlt } from "@/lib/seo";
import type { CatalogProduct } from "@/types";

/** What a közlük does, said plainly: the band's case for buying one. */
const FACTS = [
  { Icon: Thermometer, text: "Isıyı lüleye dengeli dağıtır" },
  { Icon: ShieldCheck, text: "Tütünü yanmaktan korur" },
  { Icon: Wind, text: "Közü rüzgârdan ve külden saklar" },
];

const PHOTO = "object-contain mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105";

function Tile({ product, featured, own }: { product: CatalogProduct; featured: boolean; own: Map<string, CatalogProduct> | null }) {
  return (
    <Link
      href={productHref(product)}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-white/[0.04] p-2 ring-1 ring-inset ring-white/10 transition-[background-color,box-shadow,transform] duration-300 ease-out hover:bg-white/[0.07] hover:ring-orange-400/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 motion-safe:hover:-translate-y-1 sm:p-2.5"
    >
      {/* The ember: a warm glow rising from the foot of the tile under the pointer. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-[radial-gradient(ellipse_at_bottom,rgb(249_115_22/0.38),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* Supplier photos are shot on white: they sit on a light plate, as in the dark theme. */}
      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-white to-stone-200 ${
          featured ? "aspect-[4/3] md:aspect-auto md:min-h-0 md:flex-1" : "aspect-square"
        }`}
      >
        <ProductImage
          src={product.image_url}
          alt={productImageAlt(product, { name: "Közlükler" })}
          fallback={<Flame className="m-auto h-10 w-10 text-stone-400" strokeWidth={1.25} aria-hidden />}
          sizes={featured ? "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 200px, (min-width: 768px) 25vw, 50vw"}
          imageClassName={`${PHOTO} ${featured ? "p-6 sm:p-10" : "p-3 sm:p-4"}`}
          surfaceClassName="bg-transparent"
        />
      </div>
      <div className={`relative flex flex-1 flex-col px-1 pt-3 pb-1 ${featured ? "md:flex-none md:px-2 md:pt-4" : ""}`}>
        {featured && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300">Öne çıkan</p>
        )}
        <h3
          className={`line-clamp-2 font-semibold leading-snug tracking-tight text-white ${
            featured ? "text-base md:text-xl" : "text-[13px] sm:text-sm"
          }`}
        >
          {product.name}
        </h3>
        <span className="mt-auto pt-2">
          <ShowcasePrice
            product={product}
            own={own}
            className={`font-mono font-medium text-orange-200 ${featured ? "text-base md:text-lg" : "text-[13px] sm:text-sm"}`}
            wasClassName="text-xs text-stone-500"
          />
        </span>
      </div>
    </Link>
  );
}

/**
 * "Közlükler": the heat-management band. A dark, ember-lit stage, apart from
 * the white product rows: the case for a közlük on the left — what it does,
 * the two kinds as tabs, the way to the whole category — and on the right an
 * editorial grid, one featured piece beside four. The devices (from ₺700,
 * PREMIUM_KOZLUK_MIN) and the everyday accessories are separate tabs, so a
 * ₺15 screen never sits beside a ₺2,650 device.
 *
 * Two blurred embers drift behind it (still for reduced motion); under the
 * pointer a tile lifts, its edge warms and a glow rises from its foot.
 * Server-rendered at the public price, re-priced for a signed-in visitor.
 */
export function KozluklerShowcase({ data }: { data: KozlukShowcaseData }) {
  const [tabKey, setTabKey] = useState(data.tabs[0].key);
  const own = useOwnPrices(data.tabs.flatMap((t) => t.products));
  const tab = data.tabs.find((t) => t.key === tabKey) ?? data.tabs[0];
  const [featured, ...rest] = tab.products;

  return (
    <section aria-labelledby="kozlukler-baslik" className="relative isolate overflow-hidden bg-stone-950 py-14 text-white sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-orange-600/25 blur-3xl motion-safe:animate-glow-drift" />
        <div className="absolute -right-24 -top-32 h-[24rem] w-[24rem] rounded-full bg-red-700/20 blur-3xl motion-safe:animate-glow-drift [animation-delay:-7s]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.05)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
      </div>

      <div className={`${PAGE_CONTAINER} grid gap-10 lg:grid-cols-12 lg:gap-12`}>
        <div className="flex flex-col lg:col-span-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-300">
            <Flame className="h-3.5 w-3.5" aria-hidden /> Isı Yönetimi
          </p>
          <h2 id="kozlukler-baslik" className="mt-3 text-4xl font-semibold tracking-tighter sm:text-5xl">
            Közlükler
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-300 sm:text-base">
            Kömür doğru ısıda kalsın, lüle yanmasın: ilk nefesten sonuncusuna aynı lezzet. Isı yöneticilerinden elek ve
            başlıklara, közün tüm aparatları.
          </p>
          <ul className="mt-6 space-y-2.5">
            {FACTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-stone-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-400/20">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {data.tabs.length > 1 && (
            <div role="tablist" aria-label="Közlük türleri" className="mt-8 inline-flex w-fit gap-1 rounded-full bg-white/5 p-1 ring-1 ring-inset ring-white/10">
              {data.tabs.map((t) => {
                const active = t.key === tab.key;
                return (
                  <button
                    key={t.key}
                    id={`kozluk-tab-${t.key}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="kozluk-panel"
                    onClick={() => setTabKey(t.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
                      active ? "bg-white text-stone-950 shadow-sm" : "text-stone-300 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          <Link
            href={`/catalog/${KOZLUK_CATEGORY_SLUG}`}
            className="group mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-orange-300 transition-colors hover:text-orange-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 lg:mt-auto"
          >
            Tüm Közlükler ({data.total})
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        {/* Keyed on the tab: a switch fades the new five in. */}
        <ul
          key={tab.key}
          id="kozluk-panel"
          role="tabpanel"
          aria-labelledby={data.tabs.length > 1 ? `kozluk-tab-${tab.key}` : "kozlukler-baslik"}
          className="grid grid-cols-2 gap-3 motion-safe:animate-perks-in sm:gap-4 md:grid-cols-4 md:grid-rows-2 lg:col-span-8"
        >
          {featured && (
            <li className="col-span-2 md:row-span-2">
              <Tile product={featured} featured own={own} />
            </li>
          )}
          {rest.map((p) => (
            <li key={p.id}>
              <Tile product={p} featured={false} own={own} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
