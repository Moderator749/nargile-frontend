"use client";

import { House, ShoppingCart, UserRound, type LucideIcon } from "lucide-react";

import { usePagePath } from "@/components/i18n/navigation";
import { useMessages, useT } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { chromeMessages } from "@/lib/i18n/messages/layout";
import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";

/** One tab: the icon over its label, the whole third of the bar a target. */
const TAB =
  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent";

function tabTone(active: boolean) {
  return active ? "text-red-600 dark:text-red-400" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white";
}

/** The red rule over the tab the visitor is on. */
function Indicator({ active }: { active: boolean }) {
  return active ? <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-red-600 dark:bg-red-400" /> : null;
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

/**
 * The phone's bottom bar (below `md`), as an app has: Ana Sayfa, Sepetim with
 * the live count, and Hesabım (the account, or the sign-in page for a guest);
 * the categories are the header's menu button, at the logo's left. Fixed to
 * the foot of the screen over a frosted white; StorefrontChrome leaves room
 * for it under the footer, so nothing on a page ends up behind it. The
 * iPhone's home indicator gets its own room under the tabs.
 */
export function MobileTabBar() {
  // Without its language (/en/cart is /cart), as every check below expects.
  const pathname = usePagePath();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore(selectCartCount);

  const account = user ? "/account" : "/login";
  const onAccount = ["/account", "/orders", "/login", "/register"].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <nav
      aria-label={t.nav.mobileMenu}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-border dark:bg-background/90"
    >
      <ul className="grid grid-cols-3">
        <li>
          <TabLink href="/" label={t.nav.home} Icon={House} active={pathname === "/"} />
        </li>
        <li>
          <TabLink href="/cart" label={t.nav.cart} Icon={ShoppingCart} active={pathname === "/cart"} badge={cartCount} />
        </li>
        <li>
          <TabLink href={account} label={t.nav.account} Icon={UserRound} active={onAccount} />
        </li>
      </ul>
    </nav>
  );
}
