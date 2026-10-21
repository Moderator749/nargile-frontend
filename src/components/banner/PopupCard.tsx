"use client";

import type { Ref } from "react";
import { Megaphone, X } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { bannerMessages } from "@/lib/i18n/messages/home";

/**
 * The "Açılış duyurusu" card: the same markup on the storefront and in the
 * admin preview, so what the admin sees is what visitors get.
 */
export function PopupCard({
  title,
  message,
  onClose,
  titleId,
  closeRef,
  heading: Heading = "h2",
}: {
  title: string;
  message: string;
  onClose?: () => void;
  titleId?: string;
  closeRef?: Ref<HTMLButtonElement>;
  /** The title's level where the card sits (h2 on its own, deeper inside a page). */
  heading?: "h2" | "h3" | "h4";
}) {
  const t = useMessages(bannerMessages);
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10">
      <div className="h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-red-500 rtl:bg-gradient-to-l" aria-hidden />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        disabled={!onClose}
        aria-label={t.close}
        className="absolute end-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-default dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <div className="px-6 pb-6 pt-6 sm:px-7">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <Megaphone className="h-5 w-5" aria-hidden />
        </span>
        <Heading id={titleId} className="mt-4 pe-8 text-lg font-semibold tracking-tight">
          {title || t.announcement}
        </Heading>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600 dark:text-zinc-300">{message}</p>
        <button
          type="button"
          onClick={onClose}
          disabled={!onClose}
          className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-default disabled:hover:bg-red-600"
        >
          {t.ok}
        </button>
      </div>
    </div>
  );
}
