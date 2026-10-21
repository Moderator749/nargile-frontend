import type { Metadata } from "next";

import { AdminTranslationDraftsView } from "@/components/admin/AdminTranslationDraftsView";

export const metadata: Metadata = { title: "Çeviri Onayları" };

export default function Page() {
  return <AdminTranslationDraftsView />;
}
