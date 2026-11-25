"use client";

import { Lock } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { accessMessages } from "@/lib/i18n/messages/access";

/**
 * "Bu sayfa veya ürün grubu hesap türünüz için görüntülemeye kapalıdır": in
 * place of a page, category, brand or product the viewer's customer group may
 * not see ("Grup Erişim Kısıtlamaları"). Says nothing of what is behind it.
 */
export function AccessRestricted({ signedIn }: { signedIn?: boolean }) {
  const m = useMessages(accessMessages);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <Lock className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-6 font-mono text-sm font-semibold tracking-widest text-red-600 dark:text-red-400">{m.eyebrow}</p>
      <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{m.title}</h1>
      <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground">{m.body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {m.home}
        </Link>
        {!signedIn && (
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-foreground ring-1 ring-inset ring-border transition-colors duration-200 hover:bg-foreground/[0.04]"
          >
            {m.signIn}
          </Link>
        )}
      </div>
    </main>
  );
}
