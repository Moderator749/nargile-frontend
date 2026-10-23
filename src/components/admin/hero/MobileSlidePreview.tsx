"use client";

import { useEffect, useRef, useState } from "react";

import { previewSlide, useHeroCanvas } from "@/components/admin/hero/useHeroCanvas";
import { HERO_FRAME, HeroBackdrop, HeroSlideView } from "@/components/home/HeroSlideView";
import type { HeroSlideWrite } from "@/types";

/** What the editor sends: the slide as it is being edited, and its photos. */
export interface MobilePreviewState {
  value: HeroSlideWrite;
  image: string | null;
  mobileImage: string | null;
}

/** The messages between /admin/hero and this page (same origin only). */
export type PreviewMessage =
  | { source: "hero-editor"; type: "state"; state: MobilePreviewState }
  | { source: "hero-preview"; type: "ready" }
  | { source: "hero-preview"; type: "patch"; patch: Partial<HeroSlideWrite> }
  | { source: "hero-preview"; type: "height"; height: number };

/**
 * A phone's view of the slide being edited, for /admin/hero's "Mobil" view.
 * It runs in an iframe as wide as a phone, so the storefront's own phone
 * styles apply — what is placed here is what a phone shows — and its edits
 * (place, size, crop) are a phone's own fields only, sent to the editor,
 * which holds the slide. It reads nothing itself: everything comes from the
 * editor's window, and goes back only to it.
 */
export function MobileSlidePreview() {
  const [state, setState] = useState<MobilePreviewState | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  // While a drag is under way the editor's echo of an earlier step would pull
  // the slide back; the latest one waits until the drag ends.
  const dragging = useRef(false);
  const pending = useRef<MobilePreviewState | null>(null);

  useEffect(() => {
    const post = (message: PreviewMessage) => window.parent.postMessage(message, window.location.origin);
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.source !== window.parent || e.origin !== window.location.origin) return;
      const m = e.data;
      if (m?.source !== "hero-editor" || m.type !== "state") return;
      if (dragging.current) pending.current = m.state;
      else setState(m.state);
    };
    const release = () => {
      dragging.current = false;
      if (pending.current) {
        setState(pending.current);
        pending.current = null;
      }
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    post({ source: "hero-preview", type: "ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);

  // The editor sizes the iframe to the slide itself (not the page, which is
  // as tall as the iframe: that would never shrink).
  const shown = !!state;
  useEffect(() => {
    const el = frame.current;
    if (!shown || !el) return;
    const observer = new ResizeObserver(() =>
      window.parent.postMessage(
        { source: "hero-preview", type: "height", height: Math.ceil(el.getBoundingClientRect().height) } satisfies PreviewMessage,
        window.location.origin,
      ),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  const set = (patch: Partial<HeroSlideWrite>) => {
    setState((s) => (s ? { ...s, value: { ...s.value, ...patch } } : s));
    window.parent.postMessage({ source: "hero-preview", type: "patch", patch } satisfies PreviewMessage, window.location.origin);
  };

  const v = state?.value;
  const canvas = useHeroCanvas({
    v: v ?? EMPTY,
    set,
    image: state?.image ?? null,
    hasMobileImage: !!state?.mobileImage,
    device: "mobile",
    frame,
  });
  if (!v || !state) return null;

  return (
    <div
      onPointerDownCapture={() => {
        dragging.current = true;
      }}
    >
      <div ref={frame} className={HERO_FRAME}>
        <HeroBackdrop />
        <HeroSlideView
          slide={previewSlide(v, state.image, state.mobileImage)}
          heading="div"
          editor={{ selected: canvas.selected, bind: canvas.bind, resize: canvas.resize }}
          wrapperProps={canvas.pan}
          className={state.image ? "cursor-move touch-none" : ""}
        />
      </div>
    </div>
  );
}

/** Until the editor's first message: a slide with nothing on it. */
const EMPTY: HeroSlideWrite = {
  eyebrow: "",
  title: "",
  subtitle: "",
  cta_label: "",
  cta_href: "",
  guest_cta_label: null,
  guest_cta_href: null,
  image_url: null,
  requires: null,
  text_align: "center",
  image_focus_x: 50,
  image_focus_y: 50,
  image_zoom: 100,
  layout: null,
  enable_overlay: true,
  font_sizes: null,
  text_colors: null,
  mobile_layout: null,
  mobile_font_sizes: null,
  mobile_bg_position: null,
  mobile_image: null,
  button_size_desktop: "md",
  button_size_mobile: "md",
  is_active: true,
  sort_order: 0,
};
