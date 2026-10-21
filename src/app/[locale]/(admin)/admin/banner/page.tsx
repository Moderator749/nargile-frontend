import type { Metadata } from "next";

import { AdminBannerView } from "@/components/admin/AdminBannerView";
import { AdminPopupView } from "@/components/admin/AdminPopupView";

export const metadata: Metadata = { title: "Duyurular" };

export default function Page() {
  return (
    <div className="space-y-10">
      <AdminBannerView />
      <AdminPopupView />
    </div>
  );
}
