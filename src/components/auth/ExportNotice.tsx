"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { exportNoticeKey, isExportAccount } from "@/lib/exportAccount";
import { exportNoticeMessages } from "@/lib/i18n/messages/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";

/** Whether this account already clicked through the notice on this browser. */
function wasAccepted(userId: string): boolean {
  try {
    return window.localStorage.getItem(exportNoticeKey(userId)) === "1";
  } catch {
    // Private window, blocked storage: show it rather than swallow it.
    return false;
  }
}

/**
 * What an export customer is told before they browse.
 *
 * It is a condition of the account rather than a notification: no payment
 * screen, export prices, and an order that is a request for a quote. So it is
 * modal, it has one button, and it cannot be dismissed any other way —
 * there is no close cross and Escape does nothing.
 *
 * Shown once per account per browser. The acknowledgement is kept in
 * localStorage under the account's id: another account on the same machine
 * gets its own, and clearing site data simply shows it again, which is the
 * right failure.
 */
export function ExportNotice() {
  const m = useMessages(exportNoticeMessages);
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const dialog = useRef<HTMLDialogElement>(null);
  // Set by the button; the stored acknowledgement is read during render.
  const [accepted, setAccepted] = useState<string | null>(null);

  const userId = user?.id ?? null;
  const applies = hydrated && isExportAccount(user) && userId !== null;
  // Read while rendering rather than in an effect: there is no server render to
  // disagree with (nothing renders until the auth store has hydrated), and a
  // state write in an effect would only cascade a second render.
  const open = applies && userId !== null && accepted !== userId && !wasAccepted(userId);

  // A modal <dialog> is the browser's own: it traps focus and dims the page
  // without a library. `showModal` has to be called, not rendered.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function accept() {
    if (userId) {
      try {
        window.localStorage.setItem(exportNoticeKey(userId), "1");
      } catch {
        // Not remembering it is better than not letting them past it.
      }
    }
    setAccepted(userId);
  }

  if (!applies) return null;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="export-notice-title"
      // Escape would dismiss it without the customer having read it.
      onCancel={(e) => e.preventDefault()}
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start gap-3 border-b border-border px-6 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <h2 id="export-notice-title" className="text-base font-semibold tracking-tight">
            {m.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {m.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-6 py-5 text-sm leading-relaxed text-foreground/90">
        {m.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <div className="flex justify-end border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={accept}
          autoFocus
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {m.accept}
        </button>
      </div>
    </dialog>
  );
}
