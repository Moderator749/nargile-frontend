import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminProductsWorkspace } from "@/components/admin/AdminProductsWorkspace";

export const metadata: Metadata = { title: "Ürünler & Stok" };

export default function Page() {
  // The tabs and the list read their state from the URL (useSearchParams).
  return (
    <Suspense>
      <AdminProductsWorkspace />
    </Suspense>
  );
}
