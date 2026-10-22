"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlignCenter, AlignLeft, AlignRight, Monitor, Move, RotateCcw, Smartphone } from "lucide-react";

import type { MobilePreviewState, PreviewMessage } from "@/components/admin/hero/MobileSlidePreview";
import { HERO_PARTS, mobileBg, presentParts, previewSlide, useHeroCanvas, type HeroDevice } from "@/components/admin/hero/useHeroCanvas";
import { HERO_FRAME, HeroBackdrop, HeroSlideView } from "@/components/home/HeroSlideView";
import type { HeroLayout, HeroSlideWrite, HeroTextAlign } from "@/types";

const ALIGNMENTS: { value: HeroTextAlign; label: string; Icon: typeof AlignLeft }[] = [
  { value: "left", label: "Sola", Icon: AlignLeft },
  { value: "center", label: "Ortaya", Icon: AlignCenter },
  { value: "right", label: "Sağa", Icon: AlignRight },
];

const DEVICES: { value: HeroDevice; label: string; Icon: typeof Monitor }[] = [
  { value: "desktop", label: "Masaüstü", Icon: Monitor },
  { value: "mobile", label: "Mobil", Icon: Smartphone },
];

export const rangeClass = "h-2 w-full cursor-pointer accent-red-600";

/** A phone's width for the "Mobil" view: the storefront's phone styles apply below 768px. */
const PHONE_WIDTH = 375;

const pill = (active: boolean) =>
  `inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
    active
      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
  }`;

/**
 * "Yerleşim & görsel kırpma": the slide on a live canvas — the storefront's own
 * slide component — in two views. "Masaüstü" is the wide screen at the
 * storefront's own proportions; "Mobil" is a phone (an iframe a phone wide, so
 * the storefront's phone styles apply). In either, drag a text to place it,
 * drag a selected text's red corner to size it, drag the photo to move its
 * focal point. Each view edits its own design only: a phone's positions,
 * sizes and crop are kept apart from the wide screen's.
 */
export function SlideCanvas({
  value: v,
  set,
  image,
  mobileImage = null,
}: {
  value: HeroSlideWrite;
  set: (patch: Partial<HeroSlideWrite>) => void;
  image: string | null;
  /** The slide's portrait photo for phones ("Mobil Yönetim"), if it has one. */
  mobileImage?: string | null;
}) {
  const [device, setDevice] = useState<HeroDevice>("desktop");
  const mobile = device === "mobile";
  const frame = useRef<HTMLDivElement>(null);
  const desktop = useHeroCanvas({ v, set, image, hasMobileImage: !!mobileImage, device: "desktop", frame });
  const present = presentParts(v);

  const layout: HeroLayout | null = mobile ? v.mobile_layout : v.layout;
  const bg = mobile ? mobileBg(v, !!mobileImage) : { x: v.image_focus_x, y: v.image_focus_y, zoom: v.image_zoom };
  const setBg = (patch: Partial<typeof bg>) =>
    mobile
      ? set({ mobile_bg_position: { ...bg, ...patch } })
      : set({
          ...(patch.x !== undefined ? { image_focus_x: patch.x } : {}),
          ...(patch.y !== undefined ? { image_focus_y: patch.y } : {}),
          ...(patch.zoom !== undefined ? { image_zoom: patch.zoom } : {}),
        });
  const mobileDesigned = !!(v.mobile_layout || v.mobile_font_sizes || v.mobile_bg_position);

  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
      <legend className="px-1 text-sm font-medium text-slate-700 dark:text-zinc-300">Yerleşim & görsel kırpma</legend>

      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Görünüm" className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {DEVICES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={device === value}
              onClick={() => {
                setDevice(value);
                desktop.setSelected(null);
              }}
              className={`${pill(device === value)} ${device === value ? "" : "border-transparent"}`}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Metin hizası" className="flex gap-1.5">
          {ALIGNMENTS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={v.text_align === value}
              onClick={() => set({ text_align: value })}
              className={pill(v.text_align === value)}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!layout}
          onClick={() => {
            set(mobile ? { mobile_layout: null } : { layout: null });
            desktop.setSelected(null);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Konumları Sıfırla
        </button>
      </div>
      <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
        <Move className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Yazıları sürükleyerek taşıyın; seçili yazıyı kırmızı köşesinden sürükleyerek büyütüp küçültün; fotoğrafı boş yerinden
          sürükleyerek kaydırın.{" "}
          {mobile
            ? "Bu görünümdeki değişiklikler yalnızca telefonda (768px altı) geçerlidir; masaüstü tasarımı değişmez."
            : "Bu görünümdeki değişiklikler geniş ekranda geçerlidir; mobil tasarımı değiştirmez."}
        </span>
      </p>

      {mobile ? (
        <PhoneCanvas v={v} set={set} image={image} mobileImage={mobileImage} />
      ) : (
        // The storefront's slide, in the storefront's frame.
        <div ref={frame} className={`${HERO_FRAME} mx-auto w-full max-w-[1024px]`}>
          <HeroBackdrop />
          <HeroSlideView
            slide={previewSlide(v, image, mobileImage)}
            heading="div"
            editor={{ selected: desktop.selected, bind: desktop.bind, resize: desktop.resize }}
            wrapperProps={desktop.pan}
            className={image ? "cursor-move touch-none" : ""}
          >
            {/* Where the slide's own controls sit, so nothing is dropped under them. */}
            {v.layout && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[38%] bottom-[2.52cqw] hidden h-[3.78cqw] items-center justify-center rounded-full border border-dashed border-white/25 text-[1cqw] text-white/40 lg:flex"
              >
                slayt kontrolleri
              </div>
            )}
          </HeroSlideView>
        </div>
      )}

      <ul className="grid gap-2 text-xs sm:grid-cols-4">
        {HERO_PARTS.map(({ part, label }) => (
          <li
            key={part}
            className={`rounded-lg border px-3 py-2 ${!mobile && desktop.selected === part ? "border-red-400 bg-red-50/60 dark:bg-red-500/10" : "border-slate-200 dark:border-white/10"}`}
          >
            <span className="font-medium">{label}</span>
            <span className="float-right font-mono tabular-nums text-slate-500">
              {!present[part] ? "yok" : layout ? `${layout[part].x.toFixed(1)}% · ${layout[part].y.toFixed(1)}%` : "ortalı"}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
        {mobile ? (
          <>
            Telefonda slayt 4:5 oranında gösterilir. Telefona özel dikey fotoğraf{" "}
            <Link href="/admin/homepage?tab=mobil-yonetim" className="font-medium text-red-600 hover:underline dark:text-red-400">
              Ana Sayfa Düzenleme › Mobil Yönetim
            </Link>
            ’den yüklenir{mobileImage ? " (bu slaytta var)" : "; yoksa geniş fotoğraf kırpılarak kullanılır"}.
          </>
        ) : (
          "Serbest konumlar geniş ekranlarda (1024px ve üzeri) uygulanır; tablette öğeler okunaklı kalması için ortalı dizilir. Telefonun kendi tasarımı “Mobil” görünümündedir."
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["x", "Görsel odağı — yatay", 0, 100],
            ["y", "Görsel odağı — dikey", 0, 100],
            ["zoom", "Yakınlaştırma", 100, 200],
          ] as const
        ).map(([key, label, min, max]) => (
          <label key={key} className="block space-y-1">
            <span className="flex justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
              <span>
                {label}
                {mobile && " (mobil)"}
              </span>
              <span className="font-mono tabular-nums">{bg[key]}%</span>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              value={bg[key]}
              onChange={(e) => setBg({ [key]: Number(e.target.value) })}
              className={rangeClass}
            />
          </label>
        ))}
      </div>
      {mobile && (
        <button
          type="button"
          disabled={!mobileDesigned}
          onClick={() => set({ mobile_layout: null, mobile_font_sizes: null, mobile_bg_position: null })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Mobil tasarımı sıfırla (telefon eskisi gibi gösterir)
        </button>
      )}
    </fieldset>
  );
}

/**
 * The "Mobil" view: the slide in an iframe a phone wide (/onizleme/slayt),
 * kept in step with the form both ways — the form's state goes in, the
 * phone's own edits come back — over same-origin messages only.
 */
function PhoneCanvas({
  v,
  set,
  image,
  mobileImage,
}: {
  v: HeroSlideWrite;
  set: (patch: Partial<HeroSlideWrite>) => void;
  image: string | null;
  mobileImage: string | null;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(480);
  const state: MobilePreviewState = { value: v, image, mobileImage };
  const latest = useRef(state);
  const setRef = useRef(set);
  useEffect(() => {
    latest.current = state;
    setRef.current = set;
  });

  const send = (s: MobilePreviewState) =>
    iframe.current?.contentWindow?.postMessage({ source: "hero-editor", type: "state", state: s } satisfies PreviewMessage, window.location.origin);

  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.source !== iframe.current?.contentWindow || e.origin !== window.location.origin) return;
      const m = e.data;
      if (m?.source !== "hero-preview") return;
      if (m.type === "ready") send(latest.current);
      else if (m.type === "height") setHeight(Math.max(200, Math.min(1200, m.height)));
      else if (m.type === "patch") {
        // Only a phone's own fields: the preview never writes the wide screen's design.
        const allowed: Partial<HeroSlideWrite> = {};
        if ("mobile_layout" in m.patch) allowed.mobile_layout = m.patch.mobile_layout ?? null;
        if ("mobile_font_sizes" in m.patch) allowed.mobile_font_sizes = m.patch.mobile_font_sizes ?? null;
        if ("mobile_bg_position" in m.patch) allowed.mobile_bg_position = m.patch.mobile_bg_position ?? null;
        setRef.current(allowed);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Every change of the form (or of the photos) goes to the phone.
  const serialised = JSON.stringify(state);
  useEffect(() => {
    send(JSON.parse(serialised) as MobilePreviewState);
  }, [serialised]);

  return (
    <div className="flex justify-center rounded-2xl bg-slate-100 py-6 dark:bg-white/5">
      <div className="rounded-[2.25rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-xl">
        <iframe
          ref={iframe}
          src="/onizleme/slayt"
          title="Telefon önizlemesi"
          className="block rounded-[1.9rem] bg-black"
          style={{ width: PHONE_WIDTH, height }}
        />
      </div>
    </div>
  );
}
