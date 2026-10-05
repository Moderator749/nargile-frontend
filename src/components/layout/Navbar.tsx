"use client";

import Link from "next/link";
import { LogOut, ShoppingCart, User as UserIcon } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";
import { selectCartCount, useCartStore } from "@/store/useCartStore";
import { B2B_SEGMENTS } from "@/types";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartCount = useCartStore(selectCartCount);

  const isB2B = !!user?.segment_code && B2B_SEGMENTS.includes(user.segment_code);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight sm:text-xl">
          Nargile <span className="text-indigo-600">SaaS</span>
        </Link>

        <div className="flex flex-1 items-center gap-1">
          <Link href="/catalog" className={navLinkClass}>
            Katalog
          </Link>
          {isB2B && (
            <Link href="/b2b" className={navLinkClass}>
              B2B Portal
            </Link>
          )}
        </div>

        <Link
          href="/cart"
          aria-label={`Sepet (${cartCount} ürün)`}
          className="relative rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-semibold leading-none text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 items-center gap-1.5 truncate text-sm text-slate-700 md:flex">
              <UserIcon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{user.email}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 sm:px-4"
          >
            Giriş Yap
          </Link>
        )}
      </nav>
    </header>
  );
}
