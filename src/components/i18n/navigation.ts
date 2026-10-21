"use client";

import { usePathname } from "next/navigation";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { localePath, splitLocale } from "@/lib/i18n/config";

/** The page's path without its language: "/en/cart" → "/cart", for "which page am I on" checks. */
export function usePagePath(): string {
  return splitLocale(usePathname()).path;
}

/** A site path in the page's language, for router.push/replace and form actions. */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale();
  return (path: string) => localePath(locale, path);
}
