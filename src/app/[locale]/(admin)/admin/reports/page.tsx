import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminReportsView } from "@/components/admin/reports/AdminReportsView";

export const metadata: Metadata = {
  title: "Raporlar",
  description: "Satış ve kârlılık raporları: ciro, müşteri grupları, en çok satanlar, ödeme yöntemleri, marjlar ve maliyet eksikleri.",
};

export default function Page() {
  // The period, the filters and the tab live in the URL (useSearchParams).
  return (
    <Suspense>
      <AdminReportsView />
    </Suspense>
  );
}
