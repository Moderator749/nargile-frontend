import type { Metadata } from "next";

import { AdminBrandsView } from "@/components/admin/AdminBrandsView";

export const metadata: Metadata = { title: "Markalar" };

export default function Page() {
  return <AdminBrandsView />;
}
