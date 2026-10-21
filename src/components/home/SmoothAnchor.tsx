"use client";

import type { MouseEvent, ReactNode } from "react";

import Link from "@/components/i18n/Link";
import { usePagePath } from "@/components/i18n/navigation";

/**
 * A link to a section of a page ("/#avantajlar"). On that page it glides to
 * the section instead of jumping — unless the visitor has asked for less
 * motion — and leaves the hash in the address bar; anywhere else it is an
 * ordinary link that lands on the section. "This page" is the path without its
 * language, so "/#avantajlar" glides on /en and /ar too.
 */
export function SmoothAnchor({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const page = usePagePath();
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const [path, hash] = href.split("#");
    if (!hash || (path && path !== page)) return;
    const target = document.getElementById(hash);
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${hash}`);
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
