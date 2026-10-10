import type { Metadata } from "next";

import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { getBrands, getCategories, getPublicProducts } from "@/lib/server/catalog";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Re-render the public catalog at most every 5 minutes (matches CATALOG_REVALIDATE).
export const revalidate = 300;

const TITLE = "Endüstriyel Nargile & Toptan Çözümler";

export async function generateMetadata(): Promise<Metadata> {
  const title = `Katalog — ${TITLE}`;
  return {
    title,
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: "/catalog" },
    openGraph: { title: `${title} | ${SITE_NAME}`, description: DEFAULT_DESCRIPTION, url: "/catalog" },
  };
}

export default async function CatalogPage() {
  const [categories, products, brands] = await Promise.all([
    getCategories(),
    getPublicProducts(),
    getBrands(),
  ]);

  return (
    <CatalogScreen
      title={TITLE}
      breadcrumbs={[
        { name: "Ana Sayfa", href: "/" },
        { name: "Katalog", href: "/catalog" },
      ]}
      categories={categories ?? []}
      activeCategory={null}
      products={products}
      brands={brands ?? []}
    />
  );
}
