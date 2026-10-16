import type { Metadata } from "next";

import { AdminPromosView } from "@/components/admin/AdminPromosView";

export const metadata: Metadata = { title: "Promo Kutuları" };

export default function Page() {
  return <AdminPromosView />;
}
