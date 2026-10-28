"use client";

import { usePathname } from "next/navigation";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { LOCALES } from "@/lib/i18n/config";
import { storeMessages } from "@/lib/i18n/messages/stores";
import { STORES, WHATSAPP_STORE, storeHref, whatsappLink } from "@/lib/stores";

/** Where a shopper is paying or reviewing the basket: nothing should float over its buttons. */
const HIDDEN_ON = ["/cart", "/sepet", "/checkout", "/odeme"];

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
 * is not shown on the basket and checkout.
 */
export function FloatingWhatsApp() {
  const path = withoutLocale(usePathname() ?? "/");
  const m = useMessages(storeMessages);
  if (HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  const store = STORES.find((s) => path === storeHref(s)) ?? STORES.find((s) => s.slug === WHATSAPP_STORE);
  if (!store?.whatsapp) return null;

  return (
    <a
      href={whatsappLink(store.whatsapp, m.whatsappGreeting)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={m.floatingWhatsapp}
      title={m.floatingWhatsapp}
      className="fixed right-4 bottom-[calc(4rem+1rem+env(safe-area-inset-bottom,0px)+var(--buy-bar-height,0px))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] motion-reduce:transition-none md:right-6 md:bottom-6 print:hidden"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
