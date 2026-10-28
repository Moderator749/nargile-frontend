"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, CircleCheck, Trash2, Undo2, X } from "lucide-react";
import { usePathname } from "next/navigation";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { dismissCartToast, useCartToast } from "@/lib/cartToast";
import { canOptimiseImage } from "@/lib/home";
import { cartMessages } from "@/lib/i18n/messages/cart";

/** Long enough to read the name and reach the link; a new add starts it over. */
const SHOWN_MS = 3500;
/** A removal's "Geri Al" stays this long. */
const UNDO_MS = 5000;

/**
 * The notice an add-to-cart gives (`showCartToast`): what went in, and the
 * way to the cart. Above the phone's tab bar (and a product page's buy bar or
 * the cart's checkout bar), at the bottom corner on a wider screen; announced
 * politely to a screen reader. On the cart page itself only a removal's: the
 * line gone, and "Geri Al" to put it back as it was, for five seconds.
 */
const TOAST_ACTION =
  "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function CartToast() {
  const toast = useCartToast();
  const t = useMessages(cartMessages).toast;
  const pathname = usePathname();
  const onCart = /\/(cart|checkout)\/?$/.test(pathname);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissCartToast(toast.id), toast.message.kind === "removed" ? UNDO_MS : SHOWN_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const message = toast?.message;
  const text = !message
    ? ""
    : message.kind === "added"
      ? t.added(message.name)
      : message.kind === "addedMany"
        ? t.addedMany(message.count)
        : message.kind === "removed"
          ? t.removed(message.name)
          : t.updated;
  const image = message?.kind === "added" || message?.kind === "removed" ? message.image : null;
  const removed = message?.kind === "removed" ? message : null;
  // On the cart page, where "Sepete Git" leads nowhere, only a removal speaks.
  const shown = toast && (removed || !onCart);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px)+var(--buy-bar-height,0px))] z-[60] flex justify-center md:inset-x-auto md:end-6 md:bottom-24 md:justify-end"
    >
      {toast && shown && (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-zinc-900 py-2.5 ps-2.5 pe-2 text-white shadow-2xl ring-1 ring-white/10 motion-safe:animate-[toast-in_200ms_ease-out] dark:bg-zinc-800"
        >
          {image ? (
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image src={image} alt="" fill sizes="44px" unoptimized={!canOptimiseImage(image)} className="object-contain p-1" />
            </span>
          ) : removed ? (
            <Trash2 className="ms-1 h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
          ) : (
            <CircleCheck className="ms-1 h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
          )}
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
            <span className="line-clamp-2">{text}</span>
          </p>
          {removed ? (
            <button
              type="button"
              onClick={() => {
                removed.undo();
                dismissCartToast(toast.id);
              }}
              aria-label={t.undoFor(removed.name)}
              className={TOAST_ACTION}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              {t.undo}
            </button>
          ) : (
            <Link href="/cart" onClick={() => dismissCartToast(toast.id)} className={TOAST_ACTION}>
              {t.goToCart}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          )}
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
