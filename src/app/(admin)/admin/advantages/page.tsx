import type { Metadata } from "next";

import { AdminAdvantagesView } from "@/components/admin/AdminAdvantagesView";

export const metadata: Metadata = { title: "Avantajlar" };

export default function Page() {
  return <AdminAdvantagesView />;
}
