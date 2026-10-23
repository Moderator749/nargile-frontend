"use client";

import { House, LayoutGrid, Search, ShoppingCart, UserRound, type LucideIcon } from "lucide-react";

import { usePagePath } from "@/components/i18n/navigation";
import { useMessages, useT } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { useCategoryDrawer } from "@/store/useCategoryDrawer";
import { useSearchSheet } from "@/store/useSearchSheet";

/** One tab: the icon over its label, the whole fifth of the bar a target. */
const TAB =
  "relative flex h-16 min-w-11 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent";

function tabTone(active: boolean) {
  return active ? "text-red-600 dark:text-red-400" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white";
}

/** The red rule over the tab the visitor is on. */
function Indicator({ active }: { active: boolean }) {
  return active ? <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-red-600 dark:bg-red-400" /> : null;
}

function TabLink({ href, label, Icon, active, badge }: { href: string; label: string; Icon: LucideIcon; active: boolean; badge?: number }) {
  const m = useMessages(chromeMessages);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={badge ? m.withCount(label, badge) : undefined}
      className={`${TAB} ${tabTone(active)}`}
    >
      <Indicator active={active} />
      <span className="relative">
        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
        {!!badge && (
          <span className="absolute -end-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold leading-none text-white ring-2 ring-white tabular-nums dark:ring-background">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}

/** A tab that opens something on the page rather than going anywhere: the drawer, the search. */
function TabButton({ label, Icon, active, onClick, controls }: { label: string; Icon: LucideIcon; active: boolean; onClick: () => void; controls: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-controls={controls}
      aria-expanded={active}
      className={`${TAB} w-full ${tabTone(active)}`}
    >
      <Indicator active={active} />
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
      {label}
    </button>
  );
}

/** Where the bar steps aside: a sign-in or sign-up form, whose own links sit where the bar would. */
const NO_BAR = ["/login", "/register"];

/**
 * The phone's bottom bar (below `md`), as an app has: Ana Sayfa, Kategoriler
 * (the drawer the header's menu button opens), Ara (the search sheet, from
 * anywhere on a long page), Sepetim with the live count, and Hesabım (the
 * account, or the sign-in page for a guest). Five tabs, each a fifth of the
 * bar and 64px tall. Fixed to the foot of the screen over a frosted white,
 * with the room it takes kept free under the page (its height, the home
 * indicator's included), so nothing ends up behind it. Not on the sign-in and
 * sign-up pages.
 */
export function MobileTabBar() {
  // Without its language (/en/cart is /cart), as every check below expects.
  const pathname = usePagePath();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);
  const drawer = useCategoryDrawer((s) => s.open);
  const openDrawer = useCategoryDrawer((s) => s.setOpen);
  const searching = useSearchSheet((s) => s.open);
  const openSearch = useSearchSheet((s) => s.setOpen);

  if (NO_BAR.includes(pathname)) return null;
  const account = user ? "/account" : "/login";
  const onAccount = ["/account", "/orders"].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      <div aria-hidden className="h-[calc(4rem+1px+env(safe-area-inset-bottom))] shrink-0 md:hidden" />
      <nav
        aria-label={t.nav.mobileMenu}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-border dark:bg-background/90"
      >
        <ul className="grid grid-cols-5">
          <li>
            <TabLink href="/" label={t.nav.home} Icon={House} active={pathname === "/" && !drawer && !searching} />
          </li>
          <li>
            <TabButton
              label={t.nav.categories}
              Icon={LayoutGrid}
              active={drawer}
              controls="category-drawer"
              onClick={() => {
                openSearch(false);
                openDrawer(true);
              }}
            />
          </li>
          <li>
            <TabButton
              label={t.nav.search}
              Icon={Search}
              active={searching}
              controls="search-sheet"
              onClick={() => {
                openDrawer(false);
                openSearch(true);
              }}
            />
          </li>
          <li>
            <TabLink href="/cart" label={t.nav.cart} Icon={ShoppingCart} active={pathname === "/cart" || pathname === "/checkout"} badge={cartCount} />
          </li>
          <li>
            <TabLink href={account} label={t.nav.account} Icon={UserRound} active={onAccount} />
          </li>
        </ul>
      </nav>
    </>
  );
}
