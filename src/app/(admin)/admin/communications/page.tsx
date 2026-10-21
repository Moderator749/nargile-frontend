import type { Metadata } from "next";

import { AdminCommunicationsView } from "@/components/admin/AdminCommunicationsView";

export const metadata: Metadata = { title: "SMS & Mail" };

export default function Page() {
  return <AdminCommunicationsView />;
}
