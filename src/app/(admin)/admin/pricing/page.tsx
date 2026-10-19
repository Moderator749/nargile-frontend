import type { Metadata } from "next";

import { AdminPriceImportView } from "@/components/admin/AdminPriceImportView";

export const metadata: Metadata = { title: "Excel Dosya Aktarımı" };

export default function Page() {
  return <AdminPriceImportView />;
}
