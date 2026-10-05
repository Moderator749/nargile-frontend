import type { Metadata } from "next";

import { CatalogView } from "@/components/catalog/CatalogView";

export const metadata: Metadata = {
  title: "Katalog | Nargile SaaS",
};

export default function CatalogPage() {
  return <CatalogView />;
}
