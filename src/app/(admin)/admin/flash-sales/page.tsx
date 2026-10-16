import type { Metadata } from "next";

import { AdminFlashSalesView } from "@/components/admin/AdminFlashSalesView";

export const metadata: Metadata = { title: "Fırsat Ürünleri" };

export default function Page() {
  return <AdminFlashSalesView />;
}
