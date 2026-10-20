"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronDown, LayoutGrid, X } from "lucide-react";

import { CategoryList } from "@/components/layout/CategoryList";
import { SIDEBAR_WIDTH } from "@/components/layout/CategorySidebar";

import { applySidebarFor, isSidebarCollapsed, opensByDefault, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar";
import type { ResolvedNav } from "@/lib/storefrontNav";
import { PAGE_CONTAINER } from "@/lib/layout";

/**
 * One link, plain text: the shop's red arrives on hover, with a 2px rule under
 * the word, and stays on the page the visitor is on. The type is a step
 * smaller under `xl`, where the width is scarcest — the category column takes
 * 16rem of the row and the seven labels have to fit on one line in the rest.
 */
const LINK =
  "whitespace-nowrap border-b-2 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent xl:text-sm";

/**
 * The horizontal bar under the header: every destination is a link, and a click
 * goes there. Nothing opens on hover and nothing floats over the page — the
 * categories it used to hide are down the left instead, always open.
 *
 * "KATEGORİLER" is the cell above that column, the same width as it so the two
 * read as one shape — and the handle for it: on a desktop it collapses the
 * column and gives its width to the page, and the choice is remembered for the
 * next visit (the catalog's pages open with it whatever was chosen, and a
 * product's page closes it; see `lib/sidebar`). Its chevron points the way the column will go and turns over
 * as it does; on hover it nudges that way, on a lighter disc. While the column
 * is closed the button breathes a soft red glow and the chevron sinks a hair
 * with it — one slow rhythm, so it reads as something to open. Below `lg` the
 * column lives in a drawer, and the same cell opens it.
 */
export function TopNav({ categories, links }: { categories: ResolvedNav[]; links: ResolvedNav[] }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  // The column's own state lives on <html>, set before first paint; this only
  // follows it, so the chevron and the label always say what is on screen.
  const collapsed = useSyncExternalStore(subscribeSidebar, isSidebarCollapsed, () => !opensByDefault(pathname));

  // Arriving on a page by a link: the column as that page opens with. Before
  // paint, so a category page never shows a frame without it.
  useLayoutEffect(() => applySidebarFor(pathname), [pathname]);

  // The native dialog brings the focus trap, Escape and the inert background.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (drawer && !element.open) element.showModal();
    if (!drawer && element.open) element.close();
  }, [drawer]);

  // Checkout is a corridor, not a shop floor: the seven categories, the
  // drawer and the column's handle all come off on /cart, and the red button
  // becomes the one thing a customer there might want from a menu — the way
  // back out. Every other page keeps the bar exactly as it is.
  if (pathname === "/cart") {
    return (
      <nav aria-label="Alışverişe dön" className="border-t border-gray-200 bg-background dark:border-border">
        <div className={`${PAGE_CONTAINER} flex items-center py-2`}>
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md bg-red-700 px-6 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            Alışverişe Devam Et
          </Link>
        </div>
      </nav>
    );
  }

  // A band under the white logo row in the category column's grey, framing
  // the page with it; a hairline between the two rows.
  return (
    <nav aria-label="Ana menü" className="border-t border-gray-200 bg-background dark:border-border">
      {/* The gap after the red button is the category column's right margin,
          not a gap of its own choosing: 16rem of button plus 1.5rem of gap is
          what puts the first link on the hero's left edge, exactly as the
          column below puts the hero there. */}
      <div className={`${PAGE_CONTAINER} flex items-center gap-3 py-2 lg:gap-6`}>
        {/* The column's header cell, and the button that gives up its width. */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Kategori sütununu aç" : "Kategori sütununu kapat"}
          className={`group hidden shrink-0 items-center gap-2.5 rounded-md bg-red-700 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:flex ${SIDEBAR_WIDTH} ${
            collapsed ? "motion-safe:animate-kategori-glow" : ""
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-white" aria-hidden />
          Kategoriler
          <span
            aria-hidden
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition-[background-color,box-shadow] duration-300 group-hover:bg-white/30 group-hover:ring-white/60 group-focus-visible:bg-white/30"
          >
            {/* Down while the column is closed (floating with the glow); once it
                is open it turns to point left, the way the column folds away,
                and on hover it nudges that way (`--bob-x`). With reduced
                motion it neither turns nor moves. */}
            <ChevronDown
              strokeWidth={2.75}
              className={`h-4 w-4 text-white transition-transform duration-300 ease-out motion-reduce:transition-none motion-safe:group-hover:animate-chevron-bob ${
                collapsed ? "motion-safe:animate-chevron-float" : "rotate-90 [--bob:0px] [--bob-x:-2px]"
              }`}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
          aria-controls="category-drawer"
          className="flex shrink-0 items-center gap-2.5 rounded-md bg-red-700 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:animate-kategori-glow lg:hidden"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-white" aria-hidden />
          Kategoriler
          <ChevronDown className="h-4 w-4 shrink-0 text-white/75 motion-safe:animate-chevron-float" aria-hidden />
        </button>

        {/* All seven are on screen at once and nothing scrolls sideways. From
            `lg` they spread across the bar's width, the first on the hero's
            left edge and the last on its right; below it, where the bar has no
            room for a single line, they wrap onto a second rather than
            disappear off the edge — the one arrangement that cannot truncate a
            label whatever the viewport. The gap is only a floor: at `lg` the
            seven come to about 600px of a 696px bar, so it has to stay small
            there for them to keep to one line. */}
        <ul className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:justify-between lg:gap-x-3 xl:gap-x-6">
          {links.map(({ label, href, accent }) => {
            const current = href.startsWith("/catalog/") && pathname === href;
            return (
              <li key={label} className="shrink-0">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`${LINK} ${
                    current
                      ? "border-red-700 text-red-700 dark:border-red-400 dark:text-red-400"
                      : accent
                        ? "border-transparent text-red-700 hover:border-red-700 dark:text-red-400 dark:hover:border-red-400"
                        : "border-transparent text-gray-600 hover:border-red-700 hover:text-red-700 dark:text-neutral-300 dark:hover:border-red-400 dark:hover:text-red-400"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* The same list as the sidebar's, for the screens it steps aside on. */}
      <dialog
        ref={dialog}
        id="category-drawer"
        aria-label="Kategoriler"
        onCancel={(event) => {
          event.preventDefault();
          setDrawer(false);
        }}
        onClose={() => setDrawer(false)}
        onClick={(event) => {
          if (event.target === dialog.current) setDrawer(false);
        }}
        className="m-0 h-full max-h-none w-[18rem] max-w-[85vw] bg-background text-foreground backdrop:bg-black/50 lg:hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Kategoriler</p>
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <Suspense fallback={null}>
          <CategoryList items={categories} onNavigate={() => setDrawer(false)} />
        </Suspense>
      </dialog>
    </nav>
  );
}
