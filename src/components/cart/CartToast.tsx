"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, CircleCheck, X } from "lucide-react";
import { usePathname } from "next/navigation";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { dismissCartToast, useCartToast } from "@/lib/cartToast";
import { canOptimiseImage } from "@/lib/home";
import { cartMessages } from "@/lib/i18n/messages/cart";

/** Long enough to read the name and reach the link; a new add starts it over. */
const SHOWN_MS = 3500;

/**
 * The notice an add-to-cart gives (`showCartToast`): what went in, and the
 * way to the cart. Above the phone's tab bar (and a product page's buy bar),
 * at the bottom corner on a wider screen; announced politely to a screen
 * reader. Not on the cart page itself.
 */
export function CartToast() {
  const toast = useCartToast();
  const t = useMessages(cartMessages).toast;
  const pathname = usePathname();
  const onCart = /\/cart\/?$/.test(pathname);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissCartToast(toast.id), SHOWN_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const message = toast?.message;
  const text = !message
    ? ""
    : message.kind === "added"
      ? t.added(message.name)
      : message.kind === "addedMany"
        ? t.addedMany(message.count)
        : t.updated;
  const image = message?.kind === "added" ? message.image : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px)+var(--buy-bar-height,0px))] z-[60] flex justify-center md:inset-x-auto md:end-6 md:bottom-6 md:justify-end"
    >
      {toast && !onCart && (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-zinc-900 py-2.5 ps-2.5 pe-2 text-white shadow-2xl ring-1 ring-white/10 motion-safe:animate-[toast-in_200ms_ease-out] dark:bg-zinc-800"
        >
          {image ? (
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image src={image} alt="" fill sizes="44px" unoptimized={!canOptimiseImage(image)} className="object-contain p-1" />
            </span>
          ) : (
            <CircleCheck className="ms-1 h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
          )}
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
            <span className="line-clamp-2">{text}</span>
          </p>
          <Link
            href="/cart"
            onClick={() => dismissCartToast(toast.id)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {t.goToCart}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => dismissCartToast(toast.id)}
            aria-label={t.close}
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
