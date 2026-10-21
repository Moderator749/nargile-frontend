"use client";

import { Suspense, useEffect, useRef } from "react";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { Menu, PackageSearch, Search, ShoppingCart } from "lucide-react";

import Link from "@/components/i18n/Link";
import { Logo } from "@/components/brand/Logo";
import { useLocalePath } from "@/components/i18n/navigation";
import { useMessages, useT } from "@/components/i18n/LocaleProvider";
import { CurrencySelect } from "@/components/layout/CurrencySelect";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { TopNav } from "@/components/layout/TopNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { useCategoryDrawer } from "@/store/useCategoryDrawer";
import { SIDEBAR_WIDTH_LG } from "@/components/layout/CategorySidebar";
import type { ResolvedNav } from "@/lib/storefrontNav";
import { PAGE_CONTAINER } from "@/lib/layout";

const iconButton =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

interface SearchProps {
  id: string;
  className?: string;
}

/** Header search: a GET form to /catalog?q=…, with client-side navigation (next/form). */
function SearchForm({ id, className = "", q }: SearchProps & { q: string }) {
  const t = useT();
  const to = useLocalePath();
  return (
    <Form action={to("/catalog")} role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {t.nav.searchLabel}
      </label>
      <Search
        className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={q}
        maxLength={100}
        placeholder={t.nav.searchPlaceholder}
        className="h-10 w-full rounded-md border border-gray-300 bg-white ps-10 pe-4 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors placeholder:text-muted-foreground focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700 dark:border-white/10 dark:bg-white/[0.04] dark:focus:border-red-400 dark:focus:bg-background dark:focus:ring-red-400 [&::-webkit-search-cancel-button]:hidden"
      />
    </Form>
  );
}

function SearchFromUrl(props: SearchProps) {
  const q = useSearchParams().get("q") ?? "";
  // Keyed on ?q: remounts with the current search instead of syncing state.
  return <SearchForm key={q} {...props} q={q} />;
}

/** Statically rendered pages have no search params at build time: render an empty field until they're known. */
function HeaderSearch(props: SearchProps) {
  return (
    <Suspense fallback={<SearchForm {...props} q="" />}>
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
        {/* Module 2: logo · search · currency · order tracking · account · cart;
            on a phone: menu · logo · currency · order tracking · theme. */}
        <div className={`${PAGE_CONTAINER} flex h-16 items-center gap-1.5 sm:gap-2`}>
          {/* A phone's way to the categories: the drawer the menu bar's
              "KATEGORİLER" opens on a tablet. */}
          {showMenu && (
            <button
              type="button"
              onClick={() => openDrawer(true)}
              aria-label={t.nav.categories}
              aria-controls="category-drawer"
              className={`${iconButton} -ms-2 text-foreground md:hidden`}
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
            </button>
          )}
          {/* The logo sits in the category column's width, so what follows it
              starts exactly on that column's line — which is where
              the first entry of the bar below starts. */}
          <div className={`me-2 shrink-0 lg:me-0 ${SIDEBAR_WIDTH_LG}`}>
            <Link
              href="/"
              aria-label={t.nav.homeAria}
              className="inline-block rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <Logo />
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

          <ThemeToggle />

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
