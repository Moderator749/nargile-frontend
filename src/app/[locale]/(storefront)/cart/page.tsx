import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";
import { cartMessages } from "@/lib/i18n/messages/cart";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getMessages(cartMessages);
  return { title: meta.title, description: meta.description, robots: PRIVATE_ROBOTS };
}

export default function CartPage() {
  return <CartView />;
}
