import type { Metadata } from "next";

import { AdminBannerView } from "@/components/admin/AdminBannerView";

export const metadata: Metadata = { title: "Özel Gün Duyurusu" };

export default function Page() {
  return <AdminBannerView />;
}
