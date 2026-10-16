import type { Metadata } from "next";

import { AdminHeroView } from "@/components/admin/AdminHeroView";

export const metadata: Metadata = { title: "Hero Slider" };

export default function Page() {
  return <AdminHeroView />;
}
