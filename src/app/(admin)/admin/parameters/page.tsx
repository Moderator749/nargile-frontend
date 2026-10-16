import type { Metadata } from "next";

import { AdminStoreParametersView } from "@/components/admin/AdminStoreParametersView";

export const metadata: Metadata = { title: "Parametreler" };

export default function Page() {
  return <AdminStoreParametersView />;
}
