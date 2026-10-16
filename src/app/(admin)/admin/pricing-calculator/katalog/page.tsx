import type { Metadata } from "next";

import { PricingCatalogView } from "@/components/admin/pricing/PricingCatalogView";

export const metadata: Metadata = { title: "Fiyat Kataloğu" };

/** /admin/pricing-calculator/katalog?file=<id>&ids=<row>,<row>… */
export default async function Page(props: PageProps<"/admin/pricing-calculator/katalog">) {
  const params = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const fileId = Number(one(params.file));
  const ids = one(params.ids).split(",").filter(Boolean);
  return <PricingCatalogView fileId={Number.isInteger(fileId) && fileId > 0 ? fileId : null} ids={ids} />;
}
