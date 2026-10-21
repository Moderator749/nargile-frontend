import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminProductsView } from "@/components/admin/AdminProductsView";

export const metadata: Metadata = { title: "Ürünler & Stok" };

export default function Page() {
  // The list reads its filters from the URL (useSearchParams).
  return (
    <Suspense>
      <AdminProductsView />
    </Suspense>
  );
}
