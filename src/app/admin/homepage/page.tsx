import type { Metadata } from "next";

import { AdminHomepageView } from "@/components/admin/homepage/AdminHomepageView";

export const metadata: Metadata = { title: "Ana Sayfa Düzenleme" };

export default function Page() {
  return <AdminHomepageView />;
}
