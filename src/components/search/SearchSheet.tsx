"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { useT } from "@/components/i18n/LocaleProvider";
import { SearchField } from "@/components/search/SearchField";
import { useSearchSheet } from "@/store/useSearchSheet";

function FieldFromUrl({ onDone }: { onDone: () => void }) {
  const q = useSearchParams().get("q") ?? "";
  return <SearchField key={q} id="sheet-search" q={q} inline autoFocus onDone={onDone} />;
}

/**
 * The phone's search, opened from the tab bar's "Ara" wherever the visitor
 * is on the page: a sheet over everything with the field at its top (its
 * keyboard up at once) and the suggestions under it. A native dialog, for
 * the focus trap, Escape and the inert page behind.
 */
export function SearchSheet() {
  const t = useT();
  const open = useSearchSheet((s) => s.open);
  const setOpen = useSearchSheet((s) => s.setOpen);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      id="search-sheet"
      aria-label={t.nav.search}
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClose={() => setOpen(false)}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-background p-0 text-foreground backdrop:bg-black/40 md:hidden"
    >
      <div className="flex items-start gap-2 border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Mounted with the sheet, so the field takes the focus as it opens. */}
        {open && (
          <Suspense fallback={null}>
            <FieldFromUrl onDone={() => setOpen(false)} />
          </Suspense>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.nav.close}
          className="-me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </dialog>
  );
}
