"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

/**
 * next/link that stays in the page's language: a site path ("/catalog/x")
 * gets the language's prefix on an English or Arabic page, so the storefront's
 * components write their links once, unprefixed, as they always have. External
 * links, anchors and the admin and API paths go through untouched.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const target =
    typeof href === "string"
      ? localePath(locale, href)
      : href.pathname
        ? { ...href, pathname: localePath(locale, href.pathname) }
        : href;
  return <NextLink href={target} {...props} />;
}
