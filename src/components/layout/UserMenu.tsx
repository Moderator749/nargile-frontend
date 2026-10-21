"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, PackageSearch, UserRound } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages, useT } from "@/components/i18n/LocaleProvider";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/types";

const itemClass =
  "flex items-center gap-2.5 px-3 py-2.5 text-start text-[13px] text-foreground/85 transition-colors duration-200 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

/**
 * Who is signed in, and what they can do about it.
 *
 * The name is the handle: it opens a card with the two places an account goes
 * — their profile and their orders — and the way out. Logging out used to be a
 * bare arrow beside the name, one slip away from ending a session somebody was
 * in the middle of using; behind this it takes a deliberate second click.
 *
 * Closes on Escape and on a click anywhere else, and hands focus back to the
 * button it came from, so a keyboard never loses its place.
 */
export function UserMenu({ user }: { user: User }) {
  const logout = useAuthStore((s) => s.logout);
  const t = useT();
  const m = useMessages(chromeMessages);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="user-menu"
        className="flex h-9 items-center gap-1.5 rounded-full px-2 text-[13px] text-foreground/80 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <UserRound className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} aria-hidden />
        {/* The name on wide screens; the icon alone carries it on narrow ones. */}
        <span className="hidden max-w-36 truncate xl:block">{user.full_name || user.email}</span>
        <span className="sr-only xl:hidden">{t.nav.account}</span>
        <ChevronDown
          className={`hidden h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 xl:block ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id="user-menu"
          role="menu"
          aria-label={m.accountMenu}
          // Under the button, its end edge on the button's: the right in
          // Turkish and English, the left in Arabic.
          className="absolute end-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
          <p className="truncate border-b border-border px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {user.email}
          </p>
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            {m.profile}
          </Link>
          <Link href="/orders" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <PackageSearch className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            {m.orders}
          </Link>
          <div className="border-t border-border" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`${itemClass} w-full text-accent hover:bg-accent/10 hover:text-accent`}
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
            {m.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
