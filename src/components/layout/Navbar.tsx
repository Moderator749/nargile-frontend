"use client";

import { Suspense, useEffect, useRef } from "react";
import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PackageSearch, Search, ShoppingCart } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { CurrencySelect } from "@/components/layout/CurrencySelect";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { TopNav } from "@/components/layout/TopNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { SIDEBAR_WIDTH_LG } from "@/components/layout/CategorySidebar";
import type { ResolvedNav } from "@/lib/storefrontNav";
import { B2B_SEGMENTS } from "@/types";

const iconButton =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

interface SearchProps {
  id: string;
  className?: string;
}

/** Header search: a GET form to /catalog?q=…, with client-side navigation (next/form). */
function SearchForm({ id, className = "", q }: SearchProps & { q: string }) {
  return (
    <Form action="/catalog" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Ürün ara
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={q}
        maxLength={100}
        placeholder="Ürün, marka veya kod ara"
        className="h-10 w-full rounded-full bg-foreground/[0.05] pl-10 pr-4 text-sm text-foreground ring-1 ring-inset ring-transparent transition-[background-color,box-shadow] duration-200 placeholder:text-muted-foreground hover:bg-foreground/[0.07] focus:bg-background focus:outline-none focus:ring-foreground/20 [&::-webkit-search-cancel-button]:hidden"
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
 * Below it sits the horizontal menu (`TopNav`), whose every item is a link.
 * There is no hover menu and nothing that floats over the page: the categories
 * are in the column down the left of the storefront, open at all times.
 */
export function Navbar({
  categories,
  links,
}: {
  /** The sidebar's fifteen, for the bar's drawer on a phone. */
  categories: ResolvedNav[];
  /** The horizontal bar's own items. */
  links: ResolvedNav[];
}) {
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);
  const headerRef = useRef<HTMLElement>(null);

  // Sticky toolbars (catalog filters) sit right under the header: publish its live height.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("--header-height", `${el.offsetHeight}px`));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isB2B = !!user?.segment_code && B2B_SEGMENTS.includes(user.segment_code);
  // Doors only some accounts have; the menu below is the same for everyone.
  const accountLinks = [
    ...(isB2B ? [{ href: "/b2b", label: "B2B Portal" }] : []),
    ...(isAdminRole(user?.role) ? [{ href: "/admin", label: "Yönetim" }] : []),
  ];
  const trackHref = user ? "/orders" : "/login?next=/orders";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 text-foreground backdrop-blur-lg backdrop-saturate-150"
    >
      {/* Module 2: logo · search · currency · order tracking · account · cart */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-1.5 px-4 sm:gap-2 sm:px-6">
        {/* The logo sits in the category column's width, so what follows it
            starts exactly on that column's line — which is where
            "KAMPANYALAR" starts in the bar below. */}
        <div className={`mr-2 shrink-0 lg:mr-0 ${SIDEBAR_WIDTH_LG}`}>
          <Link
            href="/"
            aria-label="Nargile Malzemesi ana sayfa"
            className="inline-block rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <Logo />
          </Link>
        </div>

        <HeaderSearch id="header-search" className="hidden max-w-2xl flex-1 md:block lg:mr-4" />
        <div className="flex-1 md:hidden" />

        <CurrencySelect />

        <Link href={trackHref} className={`${iconButton} lg:w-auto lg:gap-1.5 lg:px-3`} title="Kargo takip">
          <PackageSearch className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
          <span className="sr-only lg:not-sr-only lg:text-[13px]">Kargo Takip</span>
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
          <UserMenu user={user} />
        ) : (
          <Link
            href="/login"
            className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Giriş Yap
          </Link>
        )}

        <Link
          href="/cart"
          aria-label={`Sepet (${cartCount} ürün)`}
          className={`${iconButton} text-accent hover:bg-accent/10 hover:text-accent`}
        >
          <ShoppingCart className="h-[21px] w-[21px]" strokeWidth={2} aria-hidden />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold leading-none text-white ring-2 ring-background tabular-nums">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile: search gets its own row. */}
      <div className="px-4 pb-3 md:hidden">
        <HeaderSearch id="header-search-mobile" />
      </div>

      {/* Module 3: the horizontal menu. Links only — no dropdowns. */}
      <TopNav categories={categories} links={links} />
    </header>
  );
}
