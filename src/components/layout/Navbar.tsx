"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Menu, PackageSearch, ShoppingCart } from "lucide-react";

import Link from "@/components/i18n/Link";
import { Logo } from "@/components/brand/Logo";
import { usePagePath } from "@/components/i18n/navigation";
import { useMessages, useT } from "@/components/i18n/LocaleProvider";
import { CurrencySelect } from "@/components/layout/CurrencySelect";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { TopNav } from "@/components/layout/TopNav";
import { SearchField } from "@/components/search/SearchField";
import { UserMenu } from "@/components/layout/UserMenu";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { useCategoryDrawer } from "@/store/useCategoryDrawer";
import { SIDEBAR_WIDTH_LG } from "@/components/layout/CategorySidebar";
import type { ResolvedNav } from "@/lib/storefrontNav";
import { PAGE_CONTAINER } from "@/lib/layout";

// 40px on a phone, the thumb's; 36px from md, under a pointer.
const iconButton =
  "relative flex h-10 w-10 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

interface SearchProps {
  id: string;
  className?: string;
}

function SearchFromUrl(props: SearchProps) {
  const q = useSearchParams().get("q") ?? "";
  // Keyed on ?q: remounts with the current search instead of syncing state.
  return <SearchField key={q} {...props} q={q} />;
}

/** Statically rendered pages have no search params at build time: render an empty field until they're known. */
function HeaderSearch(props: SearchProps) {
  return (
    <Suspense fallback={<SearchField {...props} q="" />}>
      <SearchFromUrl {...props} />
    </Suspense>
  );
}

/**
 * The storefront header: the shop's name, one search field, and the tools a
 * visitor reaches for — currency, cargo tracking, their account, their cart.
 *
 * Below it sits the horizontal menu (`TopNav`), whose every item is a link —
 * on the storefront only (`showMenu`): the admin panel has its own navigation.
 * There is no hover menu and nothing that floats over the page: the categories
 * are in the column down the left of the storefront, open at all times.
 */
export function Navbar({
  categories,
  links,
  showMenu = true,
}: {
  /** The sidebar's fifteen, for the bar's drawer on a phone. */
  categories: ResolvedNav[];
  /** The horizontal bar's own items. */
  links: ResolvedNav[];
  /** The horizontal menu under the header; the admin panel's layout turns it off. */
  showMenu?: boolean;
}) {
  const t = useT();
  const m = useMessages(chromeMessages);
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);
  const openDrawer = useCategoryDrawer((s) => s.setOpen);
  // Without its language: "/" is the homepage in every language.
  const pagePath = usePagePath();
  // On a storefront phone the account and the cart are the bottom bar's
  // (MobileTabBar), so the header leaves them to it; the admin panel, which
  // has no bottom bar, keeps both.
  const desktopOnly = showMenu ? "max-md:hidden" : "";
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // What stays on screen as the page scrolls — the logo row, and the menu
  // rows only where they are sticky too (from md) — published as
  // --header-height, for the anchors and sticky columns that sit under it.
  useEffect(() => {
    const header = headerRef.current;
    const menu = menuRef.current;
    if (!header || !menu) return;
    const root = document.documentElement;
    const update = () => {
      const pinned = getComputedStyle(menu).position === "sticky" ? menu.offsetHeight : 0;
      root.style.setProperty("--header-height", `${header.offsetHeight + pinned}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(menu);
    const wide = window.matchMedia("(min-width: 48rem)");
    wide.addEventListener("change", update);
    return () => {
      observer.disconnect();
      wide.removeEventListener("change", update);
    };
  }, []);

  // Doors only some accounts have; the menu below is the same for everyone.
  const accountLinks = [
    ...(isAdminRole(user?.role) ? [{ href: "/admin", label: m.admin }] : []),
  ];
  // Open to everyone: a tracking number works without an account, and a
  // signed-in customer sees their own shipments there too.
  const trackHref = "/kargo-takip";

  // Two blocks, pinned differently. From md both stay on screen, the menu
  // rows held right under the 64px logo row, and read as one header. On a
  // phone only the logo row stays: the search row and the menu bar scroll away
  // with the page, and the menu button at the logo's left keeps the categories
  // a tap away — so a phone keeps 65px of header, not a third of its screen.
  return (
    <>
      <header
        ref={headerRef}
        // White behind the logo row; the menu row under it (TopNav) has the
        // category column's grey, framing the page with the column.
        className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white text-foreground md:border-b-0 dark:border-border dark:bg-background"
      >
        {/* Module 2: logo · search · currency · order tracking · theme · account · cart;
            on a phone: menu · logo · currency · order tracking — the theme and
            the language are in the menu's drawer there. A phone's row keeps
            12px clear at each edge and clips anything that would cross it. */}
        <div className={`${PAGE_CONTAINER} flex h-16 items-center gap-1.5 max-md:overflow-x-clip max-md:px-3 sm:gap-2`}>
          {/* A phone's way to the categories: the drawer the menu bar's
              "KATEGORİLER" opens on a tablet. */}
          {showMenu && (
            <button
              type="button"
              onClick={() => openDrawer(true)}
              aria-label={t.nav.categories}
              aria-controls="category-drawer"
              className={`${iconButton} text-foreground md:hidden`}
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
            </button>
          )}
          {/* The logo sits in the category column's width, so what follows it
              starts exactly on that column's line — which is where
              the first entry of the bar below starts. */}
          <div className={`min-w-0 md:shrink-0 sm:me-2 lg:me-0 ${SIDEBAR_WIDTH_LG}`}>
            {/* The emblem and the name are one link, with a 44px-tall target
                above its neighbours, to the homepage in the page's language.
                On the homepage itself it would go nowhere, so it goes to the
                top instead; either way it closes the drawer and the search's
                suggestions first, so a tap always shows an answer. */}
            <Link
              href="/"
              prefetch
              aria-label={t.nav.homeAria}
              onClick={(event) => {
                openDrawer(false);
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                if (pagePath === "/" && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="relative z-20 flex min-h-[44px] cursor-pointer items-center rounded-sm text-foreground [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <Logo emblemOnPhone={!showMenu} />
            </Link>
          </div>

          <HeaderSearch id="header-search" className="hidden max-w-2xl flex-1 md:block lg:me-4" />
          <div className="flex-1 md:hidden" />

          {/* The storefront's language; on a phone it is in the menu drawer.
              The admin panel is Turkish only. */}
          {showMenu && <LanguageSelect className="max-md:hidden" />}
          <CurrencySelect />

          <Link href={trackHref} className={`${iconButton} lg:w-auto lg:gap-1.5 lg:px-3`} title={t.nav.tracking}>
            <PackageSearch className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
            <span className="sr-only lg:not-sr-only lg:text-[13px]">{t.nav.tracking}</span>
          </Link>

          {accountLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hidden whitespace-nowrap rounded-full px-2 py-1 text-[13px] text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent lg:block"
            >
              {label}
            </Link>
          ))}

          {/* A storefront phone has it in the drawer; the admin panel has no drawer. */}
          <ThemeToggle className={`h-9 w-9 ${showMenu ? "max-md:hidden" : ""}`} />

          {user ? (
            <div className={desktopOnly}>
              <UserMenu user={user} />
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex ${desktopOnly} h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
            >
              {t.nav.signIn}
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={t.nav.cartWithCount(cartCount)}
            className={`${iconButton} ${desktopOnly} text-accent hover:bg-accent/10 hover:text-accent`}
          >
            <ShoppingCart className="h-[21px] w-[21px]" strokeWidth={2} aria-hidden />
            {cartCount > 0 && (
              <span className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold leading-none text-white ring-2 ring-background tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div
        ref={menuRef}
        className="z-40 w-full border-b border-gray-200 bg-white text-foreground md:sticky md:top-16 dark:border-border dark:bg-background"
      >
        {/* Mobile: search gets its own row. */}
        <div className="px-4 py-3 md:hidden">
          <HeaderSearch id="header-search-mobile" />
        </div>

        {/* Module 3: the horizontal menu. Links only — no dropdowns. Not in the
            admin panel. */}
        {showMenu && <TopNav categories={categories} links={links} />}
      </div>
    </>
  );
}
