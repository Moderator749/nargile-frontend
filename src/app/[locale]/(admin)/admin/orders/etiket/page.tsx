import type { Metadata } from "next";

import { ShippingLabel } from "@/components/admin/orders/ShippingLabel";
import { parseOrderIds } from "@/lib/labelSheet";

export const metadata: Metadata = { title: "Kargo Etiketleri" };

/** /admin/orders/etiket?ids=<order>,<order>… — the orders list's "Etiketleri Yazdır", four to an A4 sheet. */
export default async function Page(props: PageProps<"/[locale]/admin/orders/etiket">) {
  const { ids } = await props.searchParams;
  return <ShippingLabel orderIds={parseOrderIds(ids)} />;
}
