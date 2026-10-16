import type { Metadata } from "next";

import { CustomerDetailView } from "@/components/admin/customers/CustomerDetailView";

export const metadata: Metadata = { title: "Müşteri Detayı" };

export default async function Page(props: PageProps<"/admin/customers/[userId]">) {
  const { userId } = await props.params;
  return <CustomerDetailView userId={userId} />;
}
