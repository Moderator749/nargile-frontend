import type { Metadata } from "next";

import { PricingCatalogView } from "@/components/admin/pricing/PricingCatalogView";

export const metadata: Metadata = { title: "Fiyat Kataloğu" };

/** /admin/pricing-calculator/katalog?ids=<row>,<row>… (an older link's `file=` is ignored: the rows are found by id) */
export default async function Page(props: PageProps<"/[locale]/admin/pricing-calculator/katalog">) {
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const ids = one(params.ids).split(",").filter(Boolean);
  return <PricingCatalogView ids={ids} />;
}
