import type { Metadata } from "next";

import { OrderConfirmation } from "@/components/orders/OrderConfirmation";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Siparişiniz Alındı",
  description: "Sipariş özeti, ödeme ve teslimat bilgileri.",
  robots: PRIVATE_ROBOTS,
};

export default async function OrderConfirmationPage(props: PageProps<"/orders/[orderId]/confirmation">) {
  const { orderId } = await props.params;
  return <OrderConfirmation orderId={orderId} />;
}
