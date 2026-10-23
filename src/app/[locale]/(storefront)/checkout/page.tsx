import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";
import { cartMessages } from "@/lib/i18n/messages/cart";
import { getMessages } from "@/lib/i18n/server";
import { PRIVATE_ROBOTS } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getMessages(cartMessages);
  return { title: meta.checkoutTitle, description: meta.description, robots: PRIVATE_ROBOTS };
}

/**
 * Where "Siparişi tamamlamak için giriş yapın" leads back to once the visitor
 * has signed in (or signed up): the cart itself, opened at the delivery and
 * payment steps rather than at its top. A visitor still signed out is sent
 * to sign in first (CartView).
 */
export default function CheckoutPage() {
  return <CartView checkoutStep />;
}
