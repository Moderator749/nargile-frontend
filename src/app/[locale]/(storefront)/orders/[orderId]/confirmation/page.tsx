import type { Metadata } from "next";

import { OrderConfirmation } from "@/components/orders/OrderConfirmation";
import { ordersMessages } from "@/lib/i18n/messages/orders";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getMessages(ordersMessages);
  return { title: meta.confirmationTitle, description: meta.confirmationDescription, robots: PRIVATE_ROBOTS };
}

export default async function OrderConfirmationPage(props: PageProps<"/[locale]/orders/[orderId]/confirmation">) {
  const { orderId } = await props.params;
  return <OrderConfirmation orderId={orderId} />;
}
