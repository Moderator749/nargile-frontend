"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { catalogMessages } from "@/lib/i18n/messages/catalog";
import { useSearchCount } from "@/lib/searchCount";

/**
 * The catalog's heading, which says what was searched for while there is a
 * search ("‘lule’ için 48 sonuç") rather than the page's own name. The name
 * is what the page is rendered with; the search is read in the browser.
 */
export function SearchTitle({ title }: { title: string }) {
  return (
    <Suspense fallback={title}>
      <TitleFromUrl title={title} />
    </Suspense>
  );
}

function TitleFromUrl({ title }: { title: string }) {
  const query = (useSearchParams().get("q") ?? "").trim();
  const found = useSearchCount();
  const t = useMessages(catalogMessages).grid;
  if (!query) return title;
  const result = found?.query === query ? found : null;
  return t.searchTitle(query, result ? `${result.count}${result.more ? "+" : ""}` : null);
}
