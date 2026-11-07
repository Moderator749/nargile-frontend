"use client";

import { useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { CreditCard, Landmark, PackageSearch, X, type LucideIcon } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { isExportAccount } from "@/lib/exportAccount";
import { b2bWelcomeMessages } from "@/lib/i18n/messages/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";
import type { SegmentType, User } from "@/types";

/** Set once the welcome is closed: not again in this browser session (tab). */
export const B2B_WELCOME_SEEN_KEY = "b2b_welcome_popup_seen";

/** The price lists a business buys on: kafe, toptan, bayi. Perakende is everyone else's. */
const B2B_SEGMENTS: readonly SegmentType[] = ["CAFE", "WHOLESALE", "DEALER"];

/**
 * A customer buying on a business price list. Not an export account: it has
 * its own notice (ExportNotice) and no payment screen, so none of this applies.
 */
export const isB2BCustomer = (user: User | null | undefined): boolean =>
  !!user &&
  user.role === "CUSTOMER" &&
  !user.is_guest &&
  !isExportAccount(user) &&
  !!user.segment_code &&
  B2B_SEGMENTS.includes(user.segment_code);

function seenThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(B2B_WELCOME_SEEN_KEY) === "true";
  } catch {
    // Storage blocked: treat it as seen rather than show it on every page.
    return true;
  }
}

const ICONS: readonly LucideIcon[] = [CreditCard, Landmark, PackageSearch];

/**
 * The welcome a kafe, toptan or bayi customer gets: once per browser session,
 * on the first storefront page after signing in or opening the shop with a
 * session. Guests and retail customers never see it.
 *
 * A modal `<dialog>`: the browser traps focus and makes the page behind it
 * inert, and it sits above the landing popup ("Açılış duyurusu") when both
 * are due, which then follows once this one is closed. The X, "Alışverişe
 * Devam Et", Escape and the backdrop all close it, and all remember it.
 */
export function B2BWelcome() {
  const m = useMessages(b2bWelcomeMessages);
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const dialog = useRef<HTMLDialogElement>(null);
  const [closed, setClosed] = useState(false);

  // Read while rendering, as ExportNotice does: nothing renders before the auth
  // store hydrates, so there is no server render to disagree with.
  const open = hydrated && !closed && isB2BCustomer(user) && !seenThisSession();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      // The dialog itself, not its first control: read from its title, and no
      // focus ring on the close button the moment it appears. Tab moves on as usual.
      element.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  function close() {
    try {
      window.sessionStorage.setItem(B2B_WELCOME_SEEN_KEY, "true");
    } catch {
      // Storage blocked: closed for this page only.
    }
    setClosed(true);
  }

  // Escape: the dialog reports it, and closing stays this component's call.
  // Kept from the landing popup's own Escape handler on the document.
  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    close();
  }

  // A click on the dialog element itself is a click on its backdrop: the card fills the rest.
  function onBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) close();
  }

  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      tabIndex={-1}
      aria-labelledby="b2b-welcome-title"
      aria-describedby="b2b-welcome-note"
      onCancel={onCancel}
      onKeyDown={(e) => e.key === "Escape" && e.stopPropagation()}
      onClick={onBackdrop}
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-visible bg-transparent p-0 outline-none text-slate-900 backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm open:motion-safe:animate-[popup-in_240ms_ease-out] dark:text-zinc-100"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 dark:bg-zinc-900 dark:ring-white/10">
        <div className="h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-amber-500 rtl:bg-gradient-to-l" aria-hidden />
        <button
          type="button"
          onClick={close}
          aria-label={m.close}
          className="absolute end-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-8">
          <h2 id="b2b-welcome-title" className="pe-10 text-xl font-semibold tracking-tight text-balance sm:text-2xl">
            {m.title}
          </h2>

          <ul className="mt-6 space-y-4">
            {m.items.map((item, i) => {
              const Icon = ICONS[i] ?? PackageSearch;
              return (
                <li key={item.title} className="flex gap-3.5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-slate-600 dark:text-zinc-300">{item.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <p
            id="b2b-welcome-note"
            className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10"
          >
            {m.note}
          </p>

          <button
            type="button"
            onClick={close}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            {m.continue}
          </button>
        </div>
      </div>
    </dialog>
  );
}
