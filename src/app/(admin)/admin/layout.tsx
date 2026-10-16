import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/AdminShell";
import { Navbar } from "@/components/layout/Navbar";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim | Nargile Malzemesi" },
  description: "Sipariş, ürün, fiyat ve duyuru yönetimi.",
  robots: PRIVATE_ROBOTS,
};

/**
 * The admin panel, in its own route group: the site's header (the shop's
 * name, the account menu, sign-out) without the storefront's menus, and the
 * panel's own navigation down the side. No welcome strip, landing popup or
 * footer, and no catalog reads for menus the panel does not show.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <Navbar categories={[]} links={[]} showMenu={false} />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
