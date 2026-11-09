"use client";

import { ChevronRight, LayoutDashboard } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { isTeamRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * "Yönetim Paneli": the way into /admin for the panel team (admins and
 * staff) on a phone, where the header's "Yönetim" link has no room — at the
 * top of the ☰ drawer (`row`) and of "Hesabım", the bottom bar's account tab
 * (`card`). Nothing for anyone else.
 */
export function AdminPanelLink({ variant, onNavigate, className = "" }: { variant: "row" | "card"; onNavigate?: () => void; className?: string }) {
  const m = useMessages(chromeMessages);
  const role = useAuthStore((s) => s.user?.role);
  if (!isTeamRole(role)) return null;

  if (variant === "row") {
    return (
      <Link
        href="/admin"
        onClick={onNavigate}
        className={`flex min-h-12 items-center gap-3 bg-red-50 px-3 text-sm font-bold text-red-700 transition-colors duration-200 hover:bg-red-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15 ${className}`}
      >
        <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="flex-1">{m.adminPanel}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-60 rtl:rotate-180" aria-hidden />
      </Link>
    );
  }
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 transition-colors duration-200 hover:border-red-300 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/15 ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
        <LayoutDashboard className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-red-700 dark:text-red-300">{m.adminPanel}</span>
        <span className="block text-xs text-red-700/70 dark:text-red-300/70">{m.adminPanelHint}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-red-600 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 dark:text-red-400" aria-hidden />
    </Link>
  );
}
