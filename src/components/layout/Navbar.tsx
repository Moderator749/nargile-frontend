"use client";

import { Suspense, useEffect, useRef } from "react";
import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogOut, PackageSearch, Search, ShoppingBag, UserRound } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { CurrencySelect } from "@/components/layout/CurrencySelect";
import { MegaMenu, type MenuLink } from "@/components/layout/MegaMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { categoryTree } from "@/lib/categories";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { B2B_SEGMENTS, type Brand, type Category } from "@/types";

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

export function Navbar({ categories, brands }: { categories: Category[]; brands: Brand[] }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
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
  const links: MenuLink[] = [
    { href: "/#firsat-urunleri", label: "Fırsat Ürünleri", accent: true },
    { href: "/#avantajlar", label: "Avantajlar" },
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
        <Link
          href="/"
          aria-label="Nargile Malzemesi ana sayfa"
          className="mr-2 shrink-0 rounded-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <Logo />
        </Link>

        <HeaderSearch id="header-search" className="mx-auto hidden max-w-xl flex-1 md:block" />
        <div className="flex-1 md:hidden" />

        <CurrencySelect />

        <Link href={trackHref} className={`${iconButton} lg:w-auto lg:gap-1.5 lg:px-3`} title="Sipariş takibi">
          <PackageSearch className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
          <span className="sr-only lg:not-sr-only lg:text-[13px]">Sipariş Takibi</span>
        </Link>

        <ThemeToggle />

        {user ? (
          <>
            <Link
              href="/account"
              className="hidden max-w-36 truncate rounded-full px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent xl:block"
              title="Hesabım ve puanlarım"
            >
              {user.full_name || user.email}
            </Link>
            <Link href="/account" aria-label="Hesabım" title="Hesabım ve puanlarım" className={`${iconButton} xl:hidden`}>
              <UserRound className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
            <button type="button" onClick={() => logout()} aria-label="Çıkış yap" title="Çıkış yap" className={iconButton}>
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-foreground px-4 text-[13px] font-medium text-background transition-opacity duration-200 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Giriş Yap
          </Link>
        )}

        <Link href="/cart" aria-label={`Sepet (${cartCount} ürün)`} className={iconButton}>
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium leading-none text-white tabular-nums">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile: search gets its own row. */}
      <div className="px-4 pb-3 md:hidden">
        <HeaderSearch id="header-search-mobile" />
      </div>

      {/* Module 3: two-level category dropdowns, brands, then deals. */}
      <MegaMenu groups={categoryTree(categories)} brands={brands} links={links} />
    </header>
  );
}
