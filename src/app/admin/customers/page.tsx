import type { Metadata } from "next";

import { AdminCustomersView } from "@/components/admin/AdminCustomersView";

export const metadata: Metadata = { title: "Müşteriler & Puanlar" };

export default function Page() {
  return <AdminCustomersView />;
}
