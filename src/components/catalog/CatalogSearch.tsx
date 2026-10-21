"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { catalogMessages } from "@/lib/i18n/messages/catalog";

const DEBOUNCE_MS = 300;

interface CatalogSearchProps {
  onSearch: (query: string) => void;
  busy: boolean;
  placeholder: string;
  /** What is being searched, for the screen reader and the field's id. */
  label?: string;
  id?: string;
  /**
   * The search to start with, when the caller keeps it itself (the admin
   * product list restores it from its own URL). Without it, ?q= is read and a
   * new ?q= remounts the field — fine for a search that navigates, not for one
   * whose every keystroke rewrites the URL.
   */
  initial?: string;
}

function CatalogSearchField({
  onSearch,
  busy,
  placeholder,
  initial,
  label,
  id = "catalog-search",
}: CatalogSearchProps & { initial: string }) {
  const t = useMessages(catalogMessages).search;
  const [value, setValue] = useState(initial);

  // A search from the URL (?q=, e.g. the header search or a brand filter) applies at once.
  useEffect(() => {
    if (initial) onSearch(initial);
  }, [initial, onSearch]);

  useEffect(() => {
    const t = setTimeout(() => onSearch(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, onSearch]);

  return (
    <div role="search" className="relative w-full sm:w-72">
      <label htmlFor={id} className="sr-only">
        {label ?? t.label}
      </label>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        autoComplete="off"
        className="h-10 w-full rounded-full border border-slate-200 bg-white ps-9 pe-9 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute end-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-zinc-500" aria-hidden />
        ) : value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            aria-label={t.clear}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </span>
    </div>
  );
}

function CatalogSearchFromUrl(props: CatalogSearchProps) {
  const q = (useSearchParams().get("q") ?? "").trim();
  // Keyed on ?q: a new URL search remounts the field with it.
  return <CatalogSearchField key={q} {...props} initial={q} />;
}

/**
 * Search within the catalog, seeded from ?q=. Only this field waits for the URL's
 * search params, so the statically rendered product grid is unaffected.
 */
export function CatalogSearch(props: CatalogSearchProps) {
  if (props.initial !== undefined) return <CatalogSearchField {...props} initial={props.initial} />;
  return (
    <Suspense fallback={<CatalogSearchField {...props} initial="" />}>
      <CatalogSearchFromUrl {...props} />
    </Suspense>
  );
}
