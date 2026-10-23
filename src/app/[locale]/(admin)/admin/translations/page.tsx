import { Suspense } from "react";
import type { Metadata } from "next";

import { AdminTranslationsWorkspace } from "@/components/admin/AdminTranslationsWorkspace";

export const metadata: Metadata = { title: "Çeviriler" };

export default function Page() {
  // The tab is read from the URL (useSearchParams).
  return (
    <Suspense>
      <AdminTranslationsWorkspace />
    </Suspense>
  );
}
