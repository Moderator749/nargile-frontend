import type { Metadata } from "next";

import { AdminPricingView } from "@/components/admin/AdminPricingView";

export const metadata: Metadata = { title: "Fiyat Hesaplama Cetveli" };

export default function Page() {
  return <AdminPricingView />;
}
