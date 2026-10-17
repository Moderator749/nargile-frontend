import type { Metadata } from "next";

import { AdminPriceImportView } from "@/components/admin/AdminPriceImportView";

export const metadata: Metadata = { title: "Toplu Fiyat (Excel)" };

export default function Page() {
  return <AdminPriceImportView />;
}
