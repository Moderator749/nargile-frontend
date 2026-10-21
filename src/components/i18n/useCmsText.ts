"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { API_URL } from "@/lib/config";
import type { HomeTranslations, TextMemory } from "@/lib/homeTranslations";

/** One request per page load, shared by every component that asks. */
let memory: Promise<HomeTranslations | null> | null = null;

/**
 * For texts the browser fetches itself (the live banner, the popup): the
 * homepage's translation memory (lib/homeTranslations) as a function, Turkish
 * in → the page's language out, the Turkish where there is no translation.
 * On a Turkish page it is the identity and fetches nothing.
 */
export function useCmsText(): (text: string) => string {
  const locale = useLocale();
  const [map, setMap] = useState<TextMemory | null>(null);

  useEffect(() => {
    if (locale === "tr") return;
    let live = true;
    memory ??= fetch(`${API_URL}/home/translations`)
      .then((res) => (res.ok ? (res.json() as Promise<HomeTranslations>) : null))
      .catch(() => null);
    void memory.then((all) => {
      if (live) setMap(all?.[locale] ?? {});
    });
    return () => {
      live = false;
    };
  }, [locale]);

  return (text: string) => (map && text ? (map[text.trim()] ?? text) : text);
}
