"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Google Maps, only once the visitor asks for it: the page stays light and
 * nothing is loaded from Google (or sets its cookies) before a click. The
 * "Yol Tarifi Al" link beside it works without it.
 */
export function StoreMap({ src, title, label, note }: { src: string; title: string; label: string; note: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-neutral-100 dark:bg-zinc-900">
      {shown ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <MapPin className="h-8 w-8 text-red-600" aria-hidden />
          <button
            type="button"
            onClick={() => setShown(true)}
            className="inline-flex h-10 items-center rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {label}
          </button>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      )}
    </div>
  );
}
