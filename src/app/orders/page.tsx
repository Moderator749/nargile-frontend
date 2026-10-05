import type { Metadata } from "next";

import { OrdersView } from "@/components/orders/OrdersView";

export const metadata: Metadata = {
  title: "Siparişlerim | Nargile SaaS",
};

export default async function OrdersPage(props: PageProps<"/orders">) {
  const { placed } = await props.searchParams;
  return <OrdersView placedOrderNumber={typeof placed === "string" ? placed : null} />;
}
