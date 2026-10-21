import type { Metadata } from "next";

import { OrdersView } from "@/components/orders/OrdersView";
import { ordersMessages } from "@/lib/i18n/messages/orders";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getMessages(ordersMessages);
  return { title: meta.ordersTitle, description: meta.ordersDescription, robots: PRIVATE_ROBOTS };
}

export default async function OrdersPage(props: PageProps<"/[locale]/orders">) {
  const { placed } = await props.searchParams;
  return <OrdersView placedOrderNumber={typeof placed === "string" ? placed : null} />;
}
