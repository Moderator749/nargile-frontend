import type { ReactNode } from "react";

import { ExportNotice } from "@/components/auth/ExportNotice";
import { AnnouncementPopup } from "@/components/banner/AnnouncementPopup";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { TopBanner } from "@/components/layout/TopBanner";
import { getBrands, getCategories } from "@/lib/server/catalog";
import { getHomepage } from "@/lib/server/homepage";
import { resolveNav } from "@/lib/storefrontNav";

/**
 * The shop around a storefront page: the welcome strip, the landing popup,
 * the header with its menus, and the footer. Used by the (storefront) route
 * group's layout and by the site-wide 404, never by the admin panel.
 */
export async function StorefrontChrome({ children }: { children: ReactNode }) {
  // Cached for CATALOG_REVALIDATE like the catalog, so pages stay static/ISR.
  const [categories, brands, home] = await Promise.all([getCategories(), getBrands(), getHomepage()]);
  // The two menus from "Ana Sayfa Düzenleme", pointed at the catalog as it
  // stands (see lib/storefrontNav).
  const menu = resolveNav(home.navigation.top, categories ?? [], brands ?? []);
  const sidebar = resolveNav(home.navigation.sidebar, categories ?? [], brands ?? []);

  return (
    <>
      {/* Shown to an export account on its first page after signing in, and
          not dismissable any other way. Renders nothing for everyone else. */}
      <ExportNotice />
      {/* Module 1: the welcome / special-day strip, above everything. */}
      <TopBanner />
      {/* "Açılış duyurusu": once per visitor while the admin has it on. */}
      <AnnouncementPopup />
      <Navbar categories={sidebar} links={menu} />
      {children}
      {home.sections.footer && <SiteFooter footer={home.footer} />}
    </>
  );
}
