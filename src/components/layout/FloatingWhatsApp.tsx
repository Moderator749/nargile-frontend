"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { LOCALES } from "@/lib/i18n/config";
import { storeMessages } from "@/lib/i18n/messages/stores";
import { STORES, WHATSAPP_STORE, storeHref, whatsappLink } from "@/lib/stores";

/** Where a shopper is paying or reviewing the basket: nothing should float over its buttons. */
const HIDDEN_ON = ["/cart", "/sepet", "/checkout", "/odeme"];

/**
 * Whether the button would cover something marked `data-float-clear` (the
 * homepage's cards beside the slider): on a laptop the page's margin is
 * narrower than the button, so where the cards end, it sits on their corner.
 * Checked as the page scrolls or resizes, one frame at a time.
 */
function useCovers(button: RefObject<HTMLAnchorElement | null>, path: string): boolean {
  const [covers, setCovers] = useState(false);
  useEffect(() => {
    let frame = 0;
    let settle = 0;
    const check = () => {
      frame = 0;
      const own = button.current?.getBoundingClientRect();
      if (!own) return;
      const hit = [...document.querySelectorAll("[data-float-clear]")].some((el) => {
        const r = el.getBoundingClientRect();
        // A small margin, so it leaves before it touches.
        return r.width > 0 && r.left < own.right + 8 && r.right > own.left - 8 && r.top < own.bottom + 8 && r.bottom > own.top - 8;
      });
      setCovers(hit);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // The cards fade in and out as the category column closes and opens:
    // checked again once their 300ms transition is over.
    const observer = new MutationObserver(() => {
      schedule();
      window.clearTimeout(settle);
      settle = window.setTimeout(schedule, 350);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-sidebar"] });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [button, path]);
  return covers;
}

/**
 * On a phone, whether the page is being scrolled down: the button steps aside
 * then, so it never sits on a card's "+" while the visitor reads down the
 * grid, and comes back the moment they scroll up or stop near the top.
 */
function useScrollingDown(): boolean {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)");
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (!phone.matches || y < 120) setDown(false);
      else if (Math.abs(y - last) > 8) setDown(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return down;
}

/** The path without its language prefix ("/en/cart" → "/cart"). */
function withoutLocale(path: string): string {
  const first = path.split("/")[1];
  return (LOCALES as readonly string[]).includes(first) ? path.slice(first.length + 1) || "/" : path;
}

/**
 * The round green WhatsApp button in the bottom corner of every storefront
 * page: Bahçelievler's line, or the store's own on a store's page. On a
 * phone it rides above the bottom tab bar — and above a product's or the
 * cart's buy bar (--buy-bar-height) — so it never covers their buttons; it
 * is not shown on the basket and checkout, and it steps aside (fades out)
 * while it would cover the homepage's cards beside the slider, and on a phone
 * while the page is scrolled down. In Arabic it sits in the left corner,
 * where a right-to-left line ends, so it never covers the start of a title.
 */
export function FloatingWhatsApp() {
  const path = withoutLocale(usePathname() ?? "/");
  const m = useMessages(storeMessages);
  const ref = useRef<HTMLAnchorElement>(null);
  const covers = useCovers(ref, path);
  const scrollingDown = useScrollingDown();
  const away = covers || scrollingDown;
  if (HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  const store = STORES.find((s) => path === storeHref(s)) ?? STORES.find((s) => s.slug === WHATSAPP_STORE);
  if (!store?.whatsapp) return null;

  return (
    <a
      ref={ref}
      href={whatsappLink(store.whatsapp, m.whatsappGreeting)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={m.floatingWhatsapp}
      title={m.floatingWhatsapp}
      aria-hidden={away || undefined}
      tabIndex={away ? -1 : undefined}
      className={`fixed right-4 bottom-[calc(4rem+1rem+env(safe-area-inset-bottom,0px)+var(--buy-bar-height,0px))] z-40 flex h-12 w-12 items-center rtl:right-auto rtl:left-4 md:h-14 md:w-14 justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-[transform,opacity] duration-200 hover:scale-105 ${
        away ? "pointer-events-none translate-y-2 opacity-0" : ""
      } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] motion-reduce:transition-none md:right-6 md:bottom-6 md:rtl:right-auto md:rtl:left-6 print:hidden`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
