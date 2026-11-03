import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminOrdersView } from "@/components/admin/AdminOrdersView";

export const metadata: Metadata = { title: "Siparişler" };

export default function Page() {
  // `?siparis=` (an Ekip Kanalı link) is read from the URL (useSearchParams).
  return (
    <Suspense>
      <AdminOrdersView />
    </Suspense>
  );
}
