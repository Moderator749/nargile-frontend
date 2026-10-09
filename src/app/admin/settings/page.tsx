import type { Metadata } from "next";

import { AdminShippingSettingsView } from "@/components/admin/AdminShippingSettingsView";

export const metadata: Metadata = { title: "Teslimat Ayarları" };

export default function Page() {
  return <AdminShippingSettingsView />;
}
