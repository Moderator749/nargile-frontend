import { notFound, permanentRedirect } from "next/navigation";

import { brandForSlug } from "@/lib/brandMatch";
import { localePath } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { brandHref } from "@/lib/seo";
import { getBrands, required } from "@/lib/server/catalog";

/**
 * /marka/<slug>, where brand pages were until 2026-10-29: one permanent
 * redirect to the brand's page at the root, /<slug>. Another spelling of a
 * brand ("legend-hookah", "mr.wood") finds it too — matched here, under
 * /marka/, and never at the root, where a slug beginning with a brand's name
 * is more often a product's.
 */
export default async function OldBrandPage(props: PageProps<"/[locale]/marka/[slug]">) {
  const [{ slug }, { locale }] = await Promise.all([props.params, getI18n()]);
  const brand = brandForSlug(slug, required(await getBrands(), "/brands"));
  if (!brand) notFound();
  permanentRedirect(localePath(locale, brandHref(brand.slug)));
}
