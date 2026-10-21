import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminHomepageView } from "@/components/admin/homepage/AdminHomepageView";

export const metadata: Metadata = { title: "Ana Sayfa Düzenleme" };

export default function Page() {
  // The editor reads ?tab= to open on a given tab; that needs a boundary.
  return (
    <Suspense fallback={null}>
      <AdminHomepageView />
    </Suspense>
  );
}
