import type { Metadata } from "next";

import { AdminNotesView } from "@/components/admin/AdminNotesView";

export const metadata: Metadata = { title: "Not Defteri" };

export default function Page() {
  return <AdminNotesView />;
}
