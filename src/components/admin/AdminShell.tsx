"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Calculator,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  House,
  Languages,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  NotebookPen,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  Landmark,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import { SortableList } from "@/components/admin/SortableList";
import { fetchMe } from "@/lib/authApi";
import { applySavedOrder, isDefaultOrder } from "@/lib/savedOrder";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthHydrated } from "@/store/useHasHydrated";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Other pages that light this entry up. */
  also?: readonly string[];
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Siparişler", icon: ClipboardList },
  {
    href: "/admin/products",
    label: "Ürünler & Stok",
    icon: Boxes,
    // A category page's own order and the brands are tabs of it
    // ("Kategori Vitrin Sıralaması", "Markalar").
  },
  // Claude's English and Arabic drafts, waiting to be read and approved.
  // The homepage's English and Arabic texts and Claude's drafts awaiting approval, as two tabs.
  { href: "/admin/translations?sekme=ceviriler", label: "Çeviriler", icon: Languages, also: ["/admin/translations"] },
  { href: "/admin/customers", label: "Müşteriler", icon: Users },
  // The hub; its editors that keep pages of their own light it up too.
  {
    href: "/admin/homepage",
    label: "Ana Sayfa Düzenleme",
    icon: House,
    also: ["/admin/hero", "/admin/promos", "/admin/flash-sales"],
  },
  // The special-day strip and the landing popup.
  { href: "/admin/banner", label: "Duyurular", icon: Megaphone },
  // Bulk SMS / e-mail and the log of everything sent.
  { href: "/admin/communications", label: "SMS & Mail", icon: MessagesSquare },
  // Every threshold the checkout applies, the İstanbul delivery limit included
  // (the old "Teslimat Ayarları" page, /admin/settings, redirects here).
  { href: "/admin/parameters", label: "Parametreler", icon: SlidersHorizontal },
  { href: "/admin/bank-accounts", label: "Banka Hesapları", icon: Landmark },
  { href: "/admin/settings/legal", label: "Sözleşmeler", icon: FileText },
  { href: "/admin/pricing-calculator", label: "Fiyat Hesaplama Cetveli", icon: Calculator },
  // Personal: each admin sees only their own notes.
  { href: "/admin/notes", label: "Not Defteri", icon: NotebookPen },
  { href: "/admin/pricing", label: "Excel Dosya Aktarımı", icon: FileSpreadsheet },
];

/** The menu's order as this admin arranged it, in their browser (no account setting: it is a convenience). */
const NAV_ORDER_KEY = "admin_sidebar_order";
const DEFAULT_NAV_ORDER = NAV.map((item) => item.href);
const NAV_BY_HREF = new Map(NAV.map((item) => [item.href, item]));

function readNavOrder(): string[] {
  try {
    const raw = localStorage.getItem(NAV_ORDER_KEY);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    return applySavedOrder(DEFAULT_NAV_ORDER, Array.isArray(saved) ? saved.filter((x): x is string => typeof x === "string") : null);
  } catch {
    // Storage blocked or the value garbled: the default order.
    return DEFAULT_NAV_ORDER;
  }
}

function writeNavOrder(order: string[] | null) {
  try {
    if (order) localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(order));
    else localStorage.removeItem(NAV_ORDER_KEY);
  } catch {
    // Kept for this visit only.
  }
}

const NAV_LINK =
  "group flex min-w-0 flex-1 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500";

/**
 * "Kontrol Merkezi": the panel's menu, in the order this admin dragged it
 * into (each row's handle, from `lg`, shown on hover or focus; the keyboard
 * moves a row too). The order lives in this browser (`admin_sidebar_order`)
 * and is applied to the menu as it is today (lib/savedOrder): an entry added
 * in an update takes its default place, one removed is gone. "Sırayı sıfırla"
 * puts the default back. On a phone the menu is a row swiped sideways, in the
 * same order, without handles.
 */
function AdminNav({ isActive }: { isActive: (href: string, exact?: boolean, also?: readonly string[]) => boolean }) {
  // Rendered only once the page is live in the browser (AdminShell waits for
  // the session), so the saved order is read from the first render.
  const [order, setOrder] = useState<string[]>(() => (typeof window === "undefined" ? DEFAULT_NAV_ORDER : readNavOrder()));
  const items = order.flatMap((href) => NAV_BY_HREF.get(href) ?? []);

  function reorder(next: NavItem[]) {
    const hrefs = next.map((item) => item.href);
    setOrder(hrefs);
    writeNavOrder(isDefaultOrder(DEFAULT_NAV_ORDER, hrefs) ? null : hrefs);
  }

  function reset() {
    setOrder(DEFAULT_NAV_ORDER);
    writeNavOrder(null);
  }

  const link = (item: NavItem, sub: boolean) => {
    const { href, label, icon: Icon, exact, also } = item;
    const active = isActive(href, exact, also);
    return (
      <Link
        href={href}
        draggable={false}
        aria-current={active ? "page" : undefined}
        className={`${NAV_LINK} ${sub ? "py-2 text-[13px] lg:ps-9" : "py-2.5 text-sm"} ${
          active
            ? "bg-red-50 font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400"
            : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
        }`}
      >
        <Icon
          className={`${sub ? "h-3.5 w-3.5" : "h-4 w-4"} shrink-0 transition-colors ${
            active
              ? "text-red-600 dark:text-red-400"
              : "text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
          }`}
          aria-hidden
        />
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label="Yönetim menüsü" className="lg:mt-4">
      <SortableList
        items={items}
        getId={(item) => item.href}
        getLabel={(item) => item.label}
        onReorder={reorder}
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        renderItem={(item, handle) => (
          <>
            <div className="group/row flex items-center">
              {link(item, false)}
              {/* The handle, from lg only (the phone's row is swiped, not sorted). */}
              <span className="hidden opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 lg:flex">{handle}</span>
            </div>
            {item.children?.map((child) => (
              <div key={child.href} className="flex">
                {link(child, true)}
              </div>
            ))}
          </>
        )}
      />
      {!isDefaultOrder(DEFAULT_NAV_ORDER, order) && (
        <button
          type="button"
          onClick={reset}
          className="mt-3 hidden w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-red-500 lg:flex dark:text-zinc-500 dark:hover:text-zinc-200"
        >
          <RotateCcw className="h-3 w-3" aria-hidden /> Sırayı sıfırla
        </button>
      )}
    </nav>
  );
}

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

  const under = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isActive = (href: string, exact?: boolean, also: readonly string[] = []) =>
    (exact ? pathname === href : under(href)) || also.some(under);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
      {/* The same card the content area is made of, so navigation sits in the
          layout rather than on top of it: white, a hairline border, soft shadow. */}
      <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:w-64 lg:shrink-0 lg:p-3 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <p className="hidden px-3 pt-2 pb-2 text-xs font-bold uppercase tracking-wider text-red-600 lg:block dark:text-red-500">
          Kontrol Merkezi
        </p>
        <AdminNav isActive={isActive} />
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
