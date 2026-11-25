import type { Metadata } from "next";

import { AdminAccessRulesView } from "@/components/admin/AdminAccessRulesView";

export const metadata: Metadata = { title: "Grup Erişim Kısıtlamaları" };

export default function Page() {
  return <AdminAccessRulesView />;
}
