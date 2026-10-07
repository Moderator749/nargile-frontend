import type { Metadata } from "next";

import { AdminProductsView } from "@/components/admin/AdminProductsView";

export const metadata: Metadata = { title: "Ürünler & Stok" };

export default function Page() {
  return <AdminProductsView />;
}
