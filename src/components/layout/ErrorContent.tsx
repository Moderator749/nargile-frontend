"use client";

import { useEffect } from "react";
import { CloudOff, RotateCw } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { PrePaintFallback } from "@/components/layout/PrePaintFallback";
import { errorMessages } from "@/lib/i18n/messages/layout";

/**
 * What the error boundaries show — app/(storefront)/error.tsx inside the
 * shop's chrome, app/global-error.tsx with only the logo — in the 404's
 * layout (NotFoundContent): the fault is ours and passing, so try again or go
 * home. "Tekrar Dene" calls `retry`, which re-fetches and re-renders the
 * failed segment. The digest is the server log's id for the error, for
 * whoever reports it.
 */
export function ErrorContent({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const m = useMessages(errorMessages);
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
      <PrePaintFallback />
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <CloudOff className="h-8 w-8" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-red-600 dark:text-red-400">{m.eyebrow}</p>
      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{m.title}</h1>
      <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground">{m.body}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          <RotateCw className="h-4 w-4 transition-transform duration-500 motion-safe:group-hover:rotate-180" aria-hidden />
          {m.retry}
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-foreground ring-1 ring-inset ring-border transition-colors duration-200 hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
        >
          {m.home}
        </Link>
      </div>

      {error.digest && <p className="mt-10 font-mono text-[11px] text-muted-foreground">{m.code} {error.digest}</p>}
    </main>
  );
}
