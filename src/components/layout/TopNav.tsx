"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronDown, LayoutGrid, PanelLeftClose, X } from "lucide-react";

import { CategoryList } from "@/components/layout/CategoryList";
import { SIDEBAR_WIDTH } from "@/components/layout/CategorySidebar";

import { isSidebarCollapsed, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar";
import type { ResolvedNav } from "@/lib/storefrontNav";

/**
 * One link, one white pill — the same object the category column is built
 * from, so the two navigations read as one system. The padding and the type
 * step up at `xl`; below that the width is scarcest, because the category
 * column takes 16rem of the row and the seven labels have to fit in the rest.
 */
const PILL = [
  // The pills take the tray's leftover space instead of the gaps taking it.
  // `justify-between` used to hand every spare pixel to the air between them,
  // which is why the short labels looked stranded; now the row sets a fixed
  // 6px gap and each pill grows into its share of what remains. The short ones
  // gain the most in proportion — LÜLELER and SİPSİLER come out near 100px
  // wide against MALZEMELERİ's 182.
  //
  // The padding is at its measured ceiling: against the real Geist metrics the
  // seven come to 891px of a 952px tray at `xl` and 651px of 696px at `lg`,
  // and one step wider on either wraps the last pill onto a second line.
  "flex w-full items-center justify-center whitespace-nowrap rounded-xl border px-2.5 py-2 shadow-sm",
  "text-[10px] font-bold uppercase tracking-tight transition-all duration-200",
  "hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "xl:px-5 xl:py-2.5 xl:text-xs",
].join(" ");

/**
 * The horizontal bar under the header: every destination is a link, and a click
 * goes there. Nothing opens on hover and nothing floats over the page — the
 * categories it used to hide are down the left instead, always open.
 *
 * "KATAGORİLER" is the cell above that column, the same width as it so the two
 * read as one shape — and the handle for it: on a desktop it collapses the
 * column and gives its width to the page, and the choice is remembered for the
 * next visit. Below `lg` the column lives in a drawer, and the same cell opens
 * it.
 */
export function TopNav({ categories, links }: { categories: ResolvedNav[]; links: ResolvedNav[] }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  // The column's own state lives on <html>, set before first paint; this only
  // follows it, so the chevron and the label always say what is on screen.
  const collapsed = useSyncExternalStore(subscribeSidebar, isSidebarCollapsed, () => false);

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
      <nav
        aria-label="Alışverişe dön"
        className="border-t border-white/50 bg-[#82848a]/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/15"
      >
        <div className="mx-auto flex max-w-7xl items-center px-4 py-2 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-red-700/50 bg-gradient-to-b from-red-600 to-red-700 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-[0_4px_16px_rgba(220,38,38,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            Alışverişe Devam Et
          </Link>
        </div>
      </nav>
    );
  }

  // The strip itself is the tray now: the red button and the white pills stand
  // on one unbroken band of the same grey the category column is cut from,
  // instead of two grey islands in a white river.
  return (
    <nav
      aria-label="Ana menü"
      className="border-t border-white/50 bg-[#82848a]/25 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.05)] dark:border-white/15"
    >
      {/* The gap after the red button is the category column's right margin,
          not a gap of its own choosing: 16rem of button plus 1.5rem of gap is
          what puts the first pill on the hero's left edge, exactly as the
          column below puts the hero there. */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:gap-6">
        {/* The column's header cell, and the button that gives up its width. */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Kategori sütununu aç" : "Kategori sütununu kapat"}
          className={`hidden shrink-0 items-center gap-2 rounded-2xl border border-red-700/50 bg-gradient-to-b from-red-600 to-red-700 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(220,38,38,0.25)] transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-[0_4px_16px_rgba(220,38,38,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:flex ${SIDEBAR_WIDTH}`}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-white" aria-hidden />
          Katagoriler
          <PanelLeftClose
            className={`ml-auto h-3.5 w-3.5 shrink-0 text-white/75 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
          aria-controls="category-drawer"
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-red-700/50 bg-gradient-to-b from-red-600 to-red-700 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(220,38,38,0.25)] transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-[0_4px_16px_rgba(220,38,38,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-white" aria-hidden />
          Katagoriler
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/75" aria-hidden />
        </button>

        {/* The pills sit straight on the strip: a tray inside a tray was the
            awkward seam. Nothing divides them either — each pill is its own
            object, which is what the hairlines were standing in for.

            All seven are on screen at once and nothing scrolls sideways. From
            `lg` they spread across the tray's width; below it, where the bar
            has no room for a single line, they wrap onto a second rather than
            disappear off the edge — the one arrangement that cannot truncate a
            label whatever the viewport. The type and the padding tighten a
            step under `xl`, which is where the width is scarcest: the category
            column takes 16rem out of it and the dock keeps the rest. */}
        <ul className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1.5">
          {links.map(({ label, href, accent }) => {
            const current = href.startsWith("/catalog/") && pathname === href;
            return (
              <li key={label} className="flex shrink-0 grow basis-auto">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`${PILL} ${
                    current
                      ? "border-red-500/40 bg-red-50 text-red-600 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-300"
                      : accent
                        ? "border-neutral-200/70 bg-white text-red-600 hover:border-red-400/50 dark:border-white/10 dark:bg-neutral-800 dark:text-red-400"
                        : "border-neutral-200/70 bg-white text-neutral-800 hover:border-red-400/50 hover:text-red-600 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:text-red-400"
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Katagoriler</p>
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
