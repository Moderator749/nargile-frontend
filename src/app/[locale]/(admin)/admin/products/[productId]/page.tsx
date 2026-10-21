import type { Metadata } from "next";

import { ProductSheetForm } from "@/components/admin/products/ProductSheetForm";

export const metadata: Metadata = { title: "Ürün Düzenle" };

export default async function AdminProductEditPage(props: PageProps<"/[locale]/admin/products/[productId]">) {
  const { productId } = await props.params;
  return <ProductSheetForm productId={productId} />;
}
