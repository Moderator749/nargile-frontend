import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sepetim",
  description: "Sepetinizdeki ürünleri inceleyin, Sultan Puan kullanın ve siparişinizi güvenle tamamlayın.",
  robots: PRIVATE_ROBOTS,
};

export default function CartPage() {
  return <CartView />;
}
