import type { Metadata } from "next";

import { AdminOrdersView } from "@/components/admin/AdminOrdersView";

export const metadata: Metadata = { title: "Siparişler" };

export default function Page() {
  return <AdminOrdersView />;
}
