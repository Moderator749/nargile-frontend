"use client";

import { ShoppingBag } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { cartMessages } from "@/lib/i18n/messages/cart";

export function EmptyCart() {
  const t = useMessages(cartMessages).empty;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
        <ShoppingBag className="h-9 w-9" strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{t.title}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{t.body}</p>
      <Link
        href="/catalog"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
      >
        {t.cta}
      </Link>
    </div>
  );
}
