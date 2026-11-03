"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { MessagesSquare, X } from "lucide-react";

import { badgeText, titleWithCount } from "@/lib/teamChannel";
import { useTeamChannel } from "@/store/useTeamChannel";
import type { User } from "@/types";

import { Composer } from "./Composer";
import { DailyNoteBanner } from "./DailyNoteBanner";
import { MessageList } from "./MessageList";
import { useTeamChannelData } from "./useTeamChannelData";

/** Keeps "(3) " in front of the tab's title while there is unread news — Next.js rewrites the title on every page. */
function useTitleCount(count: number) {
  const pathname = usePathname();
  useEffect(() => {
    const apply = () => {
      const next = titleWithCount(document.title, count);
      if (next !== document.title) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      document.title = titleWithCount(document.title, 0);
    };
  }, [count, pathname]);
}

/**
 * "Ekip Kanalı": a round button at the bottom right of every panel page, with
 * the unread count on it, and the drawer it opens — non-modal: it slides over
 * the right edge of the page without dimming or locking it, so the order a
 * message is about can still be scrolled to and clicked. Escape (from inside
 * the drawer) or its close button shuts it, and the focus goes back to the
 * button. Mounted once by AdminShell, so it stays put across the panel's pages.
 */
export function TeamChannel({ user }: { user: User }) {
  const open = useTeamChannel((s) => s.open);
  const setOpen = useTeamChannel((s) => s.setOpen);
  const data = useTeamChannelData(open);
  const toggle = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  // Closed from inside the drawer: the focus goes back to the button once it shows again.
  const returnFocus = useRef(false);
  useTitleCount(data.unreadCount);

  useEffect(() => {
    if (!open) {
      if (returnFocus.current) {
        returnFocus.current = false;
        toggle.current?.focus();
      }
      return;
    }
    // After the slide has begun, so the browser does not scroll to the box.
    const timer = setTimeout(() => input.current?.focus({ preventScroll: true }), 50);
    return () => clearTimeout(timer);
  }, [open]);

  function close() {
    // The button is hidden while the drawer is open, so it cannot take the
    // focus yet: the effect above gives it once the drawer has closed.
    returnFocus.current = true;
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  }

  const count = data.unreadCount;
  return (
    <>
      <button
        ref={toggle}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="ekip-kanali"
        aria-label={count > 0 ? `Ekip Kanalı, ${count} okunmamış mesaj` : "Ekip Kanalı"}
        className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] end-5 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 transition-[transform,opacity] duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 motion-reduce:transition-none motion-reduce:hover:scale-100 dark:bg-white dark:text-zinc-900 ${
          open ? "invisible opacity-0" : "opacity-100"
        }`}
      >
        <MessagesSquare className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[11px] font-bold tabular-nums text-white ring-2 ring-white dark:ring-zinc-950"
          >
            {badgeText(count)}
          </span>
        )}
      </button>

      <aside
        id="ekip-kanali"
        role="dialog"
        aria-modal="false"
        aria-labelledby="ekip-kanali-baslik"
        inert={!open}
        onKeyDown={onKeyDown}
        className={`fixed inset-y-0 end-0 z-[60] flex w-full flex-col border-s border-slate-200 bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none sm:w-[380px] dark:border-white/10 dark:bg-zinc-950 ${
          open ? "visible translate-x-0" : "invisible translate-x-full rtl:-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <div className="min-w-0">
            <h2 id="ekip-kanali-baslik" className="text-sm font-semibold tracking-tight">
              Ekip Kanalı
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">Yöneticiler ve ekip · herkes görür</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Ekip Kanalı'nı kapat"
            className="rounded-lg p-1.5 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <DailyNoteBanner note={data.note} canEdit={user.role === "SUPER_ADMIN"} onSave={data.updateNote} />

        {data.error && (
          <p role="status" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {data.error}
          </p>
        )}

        <MessageList
          messages={data.messages}
          loaded={data.loaded}
          hasEarlier={data.hasEarlier}
          open={open}
          onLoadEarlier={data.loadEarlier}
          onDelete={data.remove}
        />

        <Composer onSend={data.send} inputRef={input} />
      </aside>
    </>
  );
}
