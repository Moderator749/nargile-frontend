import type { Metadata } from "next";

import { AdminCategoriesView } from "@/components/admin/AdminCategoriesView";

export const metadata: Metadata = { title: "Menü & Kategoriler" };

export default function Page() {
  return <AdminCategoriesView />;
}
