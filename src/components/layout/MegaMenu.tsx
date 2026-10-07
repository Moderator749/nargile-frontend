"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";

import { categoryCopy } from "@/lib/categories";
import { catalogSearchHref } from "@/lib/home";
import type { Brand, CategoryNode } from "@/types";

export interface MenuLink {
  href: string;
  label: string;
  accent?: boolean;
}

interface MegaMenuProps {
  groups: CategoryNode[];
  brands: Brand[];
  /** Plain links after the dropdowns (deals, advantages, admin…). */
  links: MenuLink[];
}


const itemClass =
  "relative flex h-11 shrink-0 items-center gap-1 whitespace-nowrap px-3 text-[13px] tracking-tight transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";
const subLinkClass =
  "group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors duration-200 hover:bg-foreground/[0.05] focus-visible:outline-2 focus-visible:outline-accent";

const isUnder = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/**
 * Module 3: primary navigation with two-level dropdowns ("mega menu").
 * Hover opens on devices that hover and snaps shut the instant the pointer
 * leaves the menu: no timers anywhere. Click/tap toggles everywhere (a click
 * pins a hover-opened panel). Escape, an outside click or navigating closes it. Panels render under the (horizontally
 * scrollable) row, full width, so they're never clipped.
 */
export function MegaMenu({ groups, brands, links }: MegaMenuProps) {
  const pathname = usePathname();
  const baseId = useId();
  const navRef = useRef<HTMLElement>(null);
  // Tied to the path it was opened on, so navigating closes it without an effect.
  const [open, setOpen] = useState<{ id: string; path: string; by: "hover" | "click" } | null>(null);
  const openId = open?.path === pathname ? open.id : null;

  const close = () => setOpen(null);
  const hoverOpen = (id: string) => setOpen({ id, path: pathname, by: "hover" });
  const clickToggle = (id: string) =>
    // A click on a hover-opened panel pins it rather than closing it under the pointer.
    setOpen(openId === id && open?.by === "click" ? null : { id, path: pathname, by: "click" });

  // Close the instant a mouse leaves the menu. A native DOM listener on purpose:
  // React computes enter/leave over the component tree, where the portalled page
  // scrim counts as *inside* the nav, so React's onPointerLeave never fired when
  // the cursor moved from the panel onto the page. That was the "stuck open" bug.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setOpen(null);
    };
    nav.addEventListener("pointerleave", onLeave);
    return () => nav.removeEventListener("pointerleave", onLeave);
  }, []);

  // Outside click and Escape close the open panel.
  useEffect(() => {
    if (!openId) return;
    const onPointer = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      document.getElementById(`${baseId}-${openId}-trigger`)?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId, baseId]);

  const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const dropdowns = [
    ...groups.map((g) => ({ id: g.slug, label: g.name, active: isUnder(pathname, `/catalog/${g.slug}`) || g.children.some((c) => isUnder(pathname, `/catalog/${c.slug}`)) })),
    ...(brands.length > 0 ? [{ id: "markalar", label: "Markalar", active: false }] : []),
  ];

  const trigger = (d: { id: string; label: string; active: boolean }) => {
    const expanded = openId === d.id;
    return (
      <button
        key={d.id}
        id={`${baseId}-${d.id}-trigger`}
        type="button"
        aria-expanded={expanded}
        aria-controls={`${baseId}-${d.id}-panel`}
        onClick={() => clickToggle(d.id)}
        onPointerEnter={(e) => e.pointerType === "mouse" && canHover() && hoverOpen(d.id)}
        className={`${itemClass} ${d.active || expanded ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        {d.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          strokeWidth={1.75}
          aria-hidden
        />
        {d.active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-foreground" />}
      </button>
    );
  };

  const group = groups.find((g) => g.slug === openId);

  return (
    <nav
      ref={navRef}
      aria-label="Ana menü"
      className="relative border-t border-border"
    >
      <div className="mx-auto flex max-w-7xl items-center overflow-x-auto px-2 [scrollbar-width:none] sm:px-3 [&::-webkit-scrollbar]:hidden">
        {dropdowns.map(trigger)}
        {links.map((l) => {
          const active = !l.href.includes("#") && isUnder(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && close()}
              className={`${itemClass} ${
                active
                  ? "font-medium text-foreground"
                  : l.accent
                    ? "text-accent hover:text-accent-hover"
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
              {active && <span aria-hidden className="absolute inset-x-3 bottom-0 h-px bg-foreground" />}
            </Link>
          );
        })}
      </div>

      {/* Dims and blurs the page behind the open panel. Portalled to <body>: inside the
          header, the header's backdrop-filter would confine a fixed element to it. */}
      {openId &&
        createPortal(
          <div
            aria-hidden
            // Belt and braces: any pointer on the page outside the menu closes it.
            onPointerEnter={close}
            onPointerMove={close}
            onClick={close}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm motion-safe:animate-[scrim-in_200ms_ease-out]"
          />,
          document.body,
        )}

      {openId && (
        <div
          id={`${baseId}-${openId}-panel`}
          role="region"
          aria-labelledby={`${baseId}-${openId}-trigger`}
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-white/95 shadow-2xl shadow-black/[0.12] backdrop-blur-3xl backdrop-saturate-150 motion-safe:animate-[menu-in_200ms_ease-out] dark:bg-zinc-950/95"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            {group ? (
              <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
                <Link
                  href={`/catalog/${group.slug}`}
                  className="group flex flex-col justify-between rounded-2xl bg-[#f5f5f7] p-5 transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-accent dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  {(() => {
                    const Icon = categoryCopy(group.slug).icon;
                    return <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.25} aria-hidden />;
                  })()}
                  <span className="mt-8">
                    <span className="block text-xl font-semibold tracking-tighter text-foreground">{group.name}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                      Tümünü gör
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </span>
                </Link>
                {group.children.length > 0 && (
                  <ul className="grid content-start gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {group.children.map((c) => (
                      <li key={c.id}>
                        <Link href={`/catalog/${c.slug}`} className={subLinkClass}>
                          {c.name}
                          <ArrowRight
                            className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 motion-safe:group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {brands.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={catalogSearchHref(b.search_term)}
                      className="flex h-20 items-center justify-center rounded-2xl bg-[#f5f5f7] px-4 transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-accent dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                    >
                      {b.logo_url ? (
                        <Image
                          src={b.logo_url}
                          alt={b.name}
                          width={120}
                          height={40}
                          unoptimized
                          className="h-10 w-auto max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-lg font-semibold uppercase tracking-[0.2em] text-foreground">{b.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
