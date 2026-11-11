"use client";

import { Cookie } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { usePagePath } from "@/components/i18n/navigation";
import {
  CONSENT_OPEN_EVENT,
  readConsent,
  saveConsent,
  subscribeConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { consentMessages } from "@/lib/i18n/messages/consent";
import { legalHref } from "@/lib/legalPages";

/** Not over the basket and checkout: nothing is tracked there until the visitor chooses (denied by default). */
const HIDDEN_ON = ["/cart", "/sepet", "/checkout", "/odeme"];

/** On the server and before hydration nothing is known yet: the banner is not drawn, so it never flashes. */
const UNKNOWN = "unknown" as const;
const serverSnapshot = () => UNKNOWN;

/**
 * KVKK cookie consent: a card that never covers the page behind it (no
 * overlay, nothing blocked) until the visitor picks one of two. On a phone
 * it spans the width above the bottom tab bar and a product's or the cart's
 * buy bar (--buy-bar-height); from md it sits in the bottom start corner,
 * away from the WhatsApp button in the other. Fixed, so it shifts nothing
 * (no CLS). The footer's "Çerez Tercihleri" opens it again.
 */
export function CookieConsentBanner() {
  const m = useMessages(consentMessages);
  const path = usePagePath();
  const stored = useSyncExternalStore<ConsentChoice | null | typeof UNKNOWN>(subscribeConsent, readConsent, serverSnapshot);
  const [reopened, setReopened] = useState(false);
  const card = useRef<HTMLElement>(null);

  useEffect(() => {
    const open = () => {
      setReopened(true);
      // The visitor asked for it: take them to it.
      requestAnimationFrame(() => card.current?.focus());
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  const hiddenHere = HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`));
  if (stored === UNKNOWN || (stored !== null && !reopened) || (hiddenHere && !reopened)) return null;

  const choose = (choice: ConsentChoice) => {
    saveConsent(choice);
    setReopened(false);
  };

  return (
    <section
      ref={card}
      tabIndex={-1}
      role="region"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-3 bottom-[calc(4rem+0.75rem+env(safe-area-inset-bottom,0px)+var(--buy-bar-height,0px))] z-50 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-xl outline-none shadow-black/10 backdrop-blur-md motion-safe:animate-[toast-in_200ms_ease-out] md:inset-x-auto md:start-6 md:bottom-6 md:w-[30rem] md:p-5 dark:border-border dark:bg-neutral-900/95 dark:shadow-black/40 print:hidden"
    >
      <h2 id="cookie-consent-title" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
        <Cookie className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
        {m.title}
      </h2>
      <p className="mt-2 text-[13px] leading-5 text-neutral-600 dark:text-neutral-300">
        {m.before}
        <Link
          href={legalHref("COOKIES")}
          className="font-semibold text-neutral-900 underline underline-offset-2 transition-colors duration-200 hover:text-red-600 dark:text-white dark:hover:text-red-400"
        >
          {m.policy}
        </Link>
        {m.after}
      </p>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl border border-gray-300 px-3 sm:flex-1 text-sm font-semibold text-neutral-800 transition-colors duration-200 hover:border-neutral-400 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500 dark:hover:bg-white/5"
        >
          {m.necessaryOnly}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl bg-red-600 px-3 sm:flex-1 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          {m.acceptAll}
        </button>
      </div>
    </section>
  );
}
