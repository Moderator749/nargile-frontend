import type { Metadata } from "next";

import { OrdersView } from "@/components/orders/OrdersView";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Siparişlerim",
  description: "Siparişlerinizin durumunu, kargo takip bilgilerini ve ödeme detaylarını görüntüleyin.",
  robots: PRIVATE_ROBOTS,
};

export default async function OrdersPage(props: PageProps<"/orders">) {
  const { placed } = await props.searchParams;
  return <OrdersView placedOrderNumber={typeof placed === "string" ? placed : null} />;
}
