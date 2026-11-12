"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { prefetchByDefault } from "@/lib/prefetch";

/**
 * next/link that stays in the page's language: a site path ("/catalog/x")
 * gets the language's prefix on an English or Arabic page, so the storefront's
 * components write their links once, unprefixed, as they always have. External
 * links, anchors and the admin and API paths go through untouched.
 *
 * Utility pages (sign-in, cargo tracking, contracts…) are not fetched ahead
 * unless the caller asks (lib/prefetch); everything else keeps next/link's default.
 */
export default function Link({ href, prefetch, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const target =
    typeof href === "string"
      ? localePath(locale, href)
      : href.pathname
        ? { ...href, pathname: localePath(locale, href.pathname) }
        : href;
  const path = typeof href === "string" ? href : (href.pathname ?? "");
  const ahead = prefetch !== undefined ? prefetch : path.startsWith("/") && !prefetchByDefault(path) ? false : undefined;
  return <NextLink href={target} prefetch={ahead} {...props} />;
}
