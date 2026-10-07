"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Boxes,
  FolderTree,
  GalleryHorizontal,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  ShieldAlert,
  Users,
  Landmark,
  Tags,
  Timer,
} from "lucide-react";

import { fetchMe } from "@/lib/authApi";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";

const NAV = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { href: "/admin/customers", label: "Müşteriler & Puanlar", icon: Users },
  { href: "/admin/bank-accounts", label: "Banka Hesapları", icon: Landmark },
  { href: "/admin/products", label: "Ürünler & Stok", icon: Boxes },
  { href: "/admin/categories", label: "Menü & Kategoriler", icon: FolderTree },
  { href: "/admin/brands", label: "Markalar", icon: Tags },
  { href: "/admin/hero", label: "Hero Slider", icon: GalleryHorizontal },
  { href: "/admin/promos", label: "Promo Kutuları", icon: LayoutGrid },
  { href: "/admin/advantages", label: "Avantajlar", icon: BadgeCheck },
  { href: "/admin/flash-sales", label: "Fırsat Ürünleri", icon: Timer },
  { href: "/admin/banner", label: "Özel Gün Duyurusu", icon: Megaphone },
];

function Gate({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="max-w-sm text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-600 dark:text-red-500" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{body}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </main>
  );
}

/**
 * Client-side gate + chrome for /admin. Real protection is server-side: every
 * admin API call is checked by get_current_admin_user and fails with 401/403.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // The persisted profile may be stale (e.g. role changed): refresh it.
  useEffect(() => {
    if (!token) return;
    fetchMe()
      .then((u) => useAuthStore.getState().setUser(u))
      .catch(() => {
        // A 401 logs out via the interceptor; other errors keep the cached profile.
      });
  }, [token]);

  if (!hydrated) return <main className="flex-1" aria-busy />;

  if (!user) {
    return (
      <Gate
        title="Yönetim paneli"
        body="Devam etmek için yönetici hesabınızla giriş yapın."
        action={
          <Link
            href="/login?next=/admin"
            className="inline-flex h-11 items-center rounded-lg bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            Giriş yap
          </Link>
        }
      />
    );
  }

  if (!isAdminRole(user.role)) {
    return <Gate title="Erişim yetkiniz yok" body="Bu sayfa yalnızca yönetici hesaplarına açıktır." />;
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
      {/* A distinct tinted panel, so navigation never blends into the white content. */}
      <aside className="h-fit rounded-2xl border border-zinc-200/80 bg-zinc-100 p-2 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:w-64 lg:shrink-0 lg:p-3 dark:border-white/10 dark:bg-zinc-900">
        <p className="hidden px-3 pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 lg:block dark:text-red-500">
          Kontrol Merkezi
        </p>
        <nav aria-label="Yönetim menüsü" className="lg:mt-4">
          <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
                      active
                        ? "bg-white text-zinc-900 shadow-sm ring-1 ring-black/[0.06] dark:bg-zinc-800 dark:text-white dark:ring-white/10"
                        : "text-zinc-600 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-red-600 dark:text-red-400" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"}`}
                      aria-hidden
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export const panelClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-none";
