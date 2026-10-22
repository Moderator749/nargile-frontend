"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, LayoutGrid, X } from "lucide-react";

import { usePagePath } from "@/components/i18n/navigation";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import Link from "@/components/i18n/Link";
import { CategoryList } from "@/components/layout/CategoryList";
import { SIDEBAR_WIDTH } from "@/components/layout/CategorySidebar";

import { applySidebarFor, isSidebarCollapsed, opensByDefault, setSidebarCollapsed, subscribeSidebar } from "@/lib/sidebar";
import { navLabel, type ResolvedNav } from "@/lib/storefrontNav";
import { PAGE_CONTAINER } from "@/lib/layout";
import { useCategoryDrawer } from "@/store/useCategoryDrawer";

/**
 * The same list as the sidebar's, in a drawer for the screens it steps aside
 * on (below `lg`). Opened from the menu bar's "KATEGORİLER" on a tablet and
 * from the header's menu button on a phone, so it is drawn on every page —
 * /cart too, where the menu bar itself steps aside.
 *
 * On a phone the menu bar is not shown at all, so its links (`links`: "Fırsat
 * Ürünleri", "Nargile Kömürleri"…) head the drawer instead: a phone has the one
 * menu, behind the header's button.
 */
function CategoryDrawer({ categories, links = [] }: { categories: ResolvedNav[]; links?: ResolvedNav[] }) {
  const t = useT();
  const locale = useLocale();
  const open = useCategoryDrawer((s) => s.open);
  const setOpen = useCategoryDrawer((s) => s.setOpen);
  const dialog = useRef<HTMLDialogElement>(null);

  // The native dialog brings the focus trap, Escape and the inert background.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      id="category-drawer"
      aria-label={t.nav.categories}
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClose={() => setOpen(false)}
      onClick={(event) => {
        if (event.target === dialog.current) setOpen(false);
      }}
      className="m-0 h-full max-h-none w-[18rem] max-w-[85vw] bg-background text-foreground backdrop:bg-black/50 lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{t.nav.categories}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.nav.close}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {links.length > 0 && (
        <nav aria-label={t.nav.mainMenu} className="border-b-4 border-border md:hidden">
          <ul>
            {links.map(({ label, href, accent }) => (
              <li key={`${href}-${label}`} className="border-b border-border last:border-0">
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-2 px-3 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors hover:bg-foreground/[0.04] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                    accent ? "text-red-700 dark:text-red-400" : "text-foreground"
                  }`}
                >
                  <span className="min-w-0 truncate">{navLabel(label, locale)}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400 rtl:rotate-180 dark:text-neutral-500" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <Suspense fallback={null}>
        <CategoryList items={categories} onNavigate={() => setOpen(false)} />
      </Suspense>
      {/* A phone's language picker: the header has no room for it there. */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 md:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t.nav.language}</p>
        <LanguageSelect id="drawer-language" />
      </div>
    </dialog>
  );
}

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
 * next visit (the catalog's pages and the deals open with it whatever was
 * chosen, and a product's page closes it; see `lib/sidebar`). Its chevron points the way the column will go and turns over
 * as it does; on hover it nudges that way, on a lighter disc. While the column
 * is closed the button breathes a soft red glow and the chevron sinks a hair
 * with it — one slow rhythm, so it reads as something to open. Below `lg` the
 * column lives in a drawer, and the same cell opens it.
 */
export function TopNav({ categories, links }: { categories: ResolvedNav[]; links: ResolvedNav[] }) {
  // Without its language (/en/cart is /cart), as every check below expects.
  const pathname = usePagePath();
  const t = useT();
  const locale = useLocale();
  const drawer = useCategoryDrawer((s) => s.open);
  const setDrawer = useCategoryDrawer((s) => s.setOpen);
  // The column's own state lives on <html>, set before first paint; this only
  // follows it, so the chevron and the label always say what is on screen.
  const collapsed = useSyncExternalStore(subscribeSidebar, isSidebarCollapsed, () => !opensByDefault(pathname));

  // Arriving on a page by a link: the column as that page opens with. Before
  // paint, so a category page never shows a frame without it.
  useLayoutEffect(() => applySidebarFor(pathname), [pathname]);

  // Checkout is a corridor, not a shop floor: the seven categories, the
  // drawer and the column's handle all come off on /cart, and the red button
  // becomes the one thing a customer there might want from a menu — the way
  // back out. Every other page keeps the bar exactly as it is.
  if (pathname === "/cart") {
    return (
      <nav aria-label={t.nav.backToShop} className="border-t border-gray-200 bg-background dark:border-border">
        <div className={`${PAGE_CONTAINER} flex items-center py-2`}>
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-md bg-red-700 px-6 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 rtl:rotate-180" strokeWidth={2.25} aria-hidden />
            {t.nav.continueShopping}
          </Link>
        </div>
        <CategoryDrawer categories={categories} links={links} />
      </nav>
    );
  }

  // A band under the white logo row in the category column's grey, framing
  // the page with it; a hairline between the two rows. Not on a phone: there
  // its links are in the menu drawer (the header's button), one menu, and the
  // page starts right under the search.
  return (
    <nav aria-label={t.nav.mainMenu} className="bg-background md:border-t md:border-gray-200 dark:md:border-border">
      {/* The gap after the red button is the category column's end margin,
          not a gap of its own choosing: 16rem of button plus 1.5rem of gap is
          what puts the first link on the hero's left edge, exactly as the
          column below puts the hero there. */}
      <div className={`${PAGE_CONTAINER} hidden items-center gap-3 py-2 md:flex lg:gap-6`}>
        {/* The column's header cell, and the button that gives up its width. */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t.nav.openColumn : t.nav.closeColumn}
          className={`group hidden shrink-0 items-center gap-2.5 rounded-md bg-red-700 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:flex ${SIDEBAR_WIDTH} ${
            collapsed ? "motion-safe:animate-kategori-glow" : ""
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-white" aria-hidden />
          {t.nav.categories}
          <span
            aria-hidden
            className="ms-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition-[background-color,box-shadow] duration-300 group-hover:bg-white/30 group-hover:ring-white/60 group-focus-visible:bg-white/30"
          >
            {/* Down while the column is closed (floating with the glow); once it
                is open it turns to point left, the way the column folds away,
                and on hover it nudges that way (`--bob-x`) — right in Arabic,
                where the column is down the right. With reduced motion it
                neither turns nor moves. */}
            <ChevronDown
              strokeWidth={2.75}
              className={`h-4 w-4 text-white transition-transform duration-300 ease-out motion-reduce:transition-none motion-safe:group-hover:animate-chevron-bob ${
                collapsed
                  ? "motion-safe:animate-chevron-float"
                  : "rotate-90 [--bob:0px] [--bob-x:-2px] rtl:-rotate-90 rtl:[--bob-x:2px]"
              }`}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-expanded={drawer}
          aria-controls="category-drawer"
          // A tablet's way to the drawer; a phone has the header's menu button.
          className="hidden shrink-0 items-center gap-2.5 rounded-md bg-red-700 px-6 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:animate-kategori-glow md:flex lg:hidden"
        >
          <LayoutGrid className="h-4 w-4 shrink-0 text-white" aria-hidden />
          {t.nav.categories}
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
                  {navLabel(label, locale)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <CategoryDrawer categories={categories} links={links} />
    </nav>
  );
}
