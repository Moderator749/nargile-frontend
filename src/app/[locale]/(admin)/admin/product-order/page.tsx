import type { Metadata } from "next";

import { AdminProductOrderView } from "@/components/admin/AdminProductOrderView";

export const metadata: Metadata = { title: "Ürün Sıralaması" };

export default function Page() {
  return <AdminProductOrderView />;
}
