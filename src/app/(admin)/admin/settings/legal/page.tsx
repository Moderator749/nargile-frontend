import type { Metadata } from "next";

import { AdminLegalView } from "@/components/admin/AdminLegalView";

export const metadata: Metadata = { title: "Sözleşmeler ve Metinler" };

export default function Page() {
  return <AdminLegalView />;
}
