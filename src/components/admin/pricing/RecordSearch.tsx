"use client";

import { Search, X } from "lucide-react";
import { foldSearch } from "@/lib/searchFold";

/** The text as compared: Turkish letters folded ("komur" = "Kömür"), spaces, hyphens and dots aside ("LH031-V1" = "lh031 v1"). */
export const foldRecord = (text: string | null | undefined) => foldSearch(text).replace(/[\s\-_.]/g, "");

/** Whether any of the texts contains the query, as `foldRecord` compares them. */
export function matchesSearch(query: string, ...texts: (string | null | undefined)[]): boolean {
  const q = foldRecord(query);
  return !q || texts.some((t) => foldRecord(t).includes(q));
}

/**
 * A filter over a list already on the page — the drafts, the files, a file's
 * rows — narrowing it as the admin types. Nothing goes to the server.
 */
export function RecordSearch({
  value,
  onChange,
  placeholder,
  shown,
  total,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** How many of `total` are left, said while a query is typed. */
  shown: number;
  total: number;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onChange("")}
          placeholder={placeholder}
          aria-label={placeholder}
          // The browser's own clear button is hidden: the one below does the same, in the app's look.
          className="block h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 text-sm shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Aramayı temizle"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
      {value.trim() && (
        <p className="text-xs text-slate-500 dark:text-zinc-400" aria-live="polite">
          {shown} / {total} gösteriliyor
        </p>
      )}
    </div>
  );
}
