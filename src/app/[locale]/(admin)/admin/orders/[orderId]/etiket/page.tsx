import type { Metadata } from "next";

import { ShippingLabel } from "@/components/admin/orders/ShippingLabel";

export const metadata: Metadata = { title: "Kargo Etiketi" };

export default async function Page(props: PageProps<"/[locale]/admin/orders/[orderId]/etiket">) {
  const { orderId } = await props.params;
  return <ShippingLabel orderId={orderId} />;
}
