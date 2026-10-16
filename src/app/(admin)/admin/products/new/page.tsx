import type { Metadata } from "next";

import { ProductSheetForm } from "@/components/admin/products/ProductSheetForm";

export const metadata: Metadata = { title: "Ürün Ekle" };

export default function AdminProductNewPage() {
  return <ProductSheetForm />;
}
