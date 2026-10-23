"use client";

import { useEffect, useRef, useState } from "react";
import Form from "next/form";
import { Search } from "lucide-react";

import { useLocalePath } from "@/components/i18n/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import { SuggestionPanel, useSuggestions } from "@/components/search/SearchSuggestions";

/**
 * The search field: a GET form to /catalog?q=…, with client-side navigation
 * (next/form), and suggestions as the visitor types (from the second letter).
 * In the header they drop down under the field and close on Escape, a click
 * elsewhere, or a pick; in the phone's search sheet (`inline`) they are the
 * sheet's own list, under the field.
 */
export function SearchField({
  id,
  q,
  className = "",
  inline = false,
  autoFocus = false,
  onDone,
}: {
  id: string;
  q: string;
  className?: string;
  inline?: boolean;
  autoFocus?: boolean;
  /** After a search is sent or a suggestion picked (the sheet closes). */
  onDone?: () => void;
}) {
  const t = useT();
  const to = useLocalePath();
  const [value, setValue] = useState(q);
  const [open, setOpen] = useState(false);
  const { data, term } = useSuggestions(value);
  const box = useRef<HTMLFormElement>(null);
  const listId = `${id}-suggestions`;

  useEffect(() => {
    if (!open || inline) return;
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, inline]);

  const shown = (inline || open) && data !== null;
  const done = () => {
    setOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    onDone?.();
  };

  return (
    <Form ref={box} action={to("/catalog")} role="search" onSubmit={done} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {t.nav.searchLabel}
      </label>
      <Search
        className="pointer-events-none absolute start-3.5 top-5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        id={id}
        name="q"
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-expanded={shown}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={100}
        placeholder={t.nav.searchPlaceholder}
        className="h-10 w-full rounded-md border border-gray-300 bg-white ps-10 pe-4 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors placeholder:text-muted-foreground focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700 dark:border-white/10 dark:bg-white/[0.04] dark:focus:border-red-400 dark:focus:bg-background dark:focus:ring-red-400 [&::-webkit-search-cancel-button]:hidden"
      />
      {shown && (
        <div
          id={listId}
          aria-label={t.nav.searchSuggestions}
          role="region"
          className={
            inline
              ? "mt-3"
              : "absolute inset-x-0 top-full z-50 mt-1.5 max-h-[min(70vh,34rem)] overflow-y-auto rounded-xl border border-border bg-background shadow-2xl"
          }
        >
          <SuggestionPanel data={data} term={term} onPick={done} />
        </div>
      )}
    </Form>
  );
}
