import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/AdminShell";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim | Nargile Malzemesi" },
  description: "Sipariş, ürün, fiyat ve duyuru yönetimi.",
  robots: PRIVATE_ROBOTS,
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
