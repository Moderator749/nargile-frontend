// Server-only read of the "Ana Sayfa Düzenleme" document, for the homepage,
// the menus and the footer.

import { API_URL } from "@/lib/config";
import { resolveHomepage } from "@/lib/homepage";
import { CATALOG_REVALIDATE } from "@/lib/server/catalog";
import type { Homepage, HomepageSettingsResponse } from "@/types";

/**
 * The homepage as the admin last saved it, over the defaults. Cached with the
 * catalog: the editor's save drops the "catalog" tag, so a change shows on the
 * next request. If the backend cannot be reached the defaults stand, so the
 * storefront never loses its menus or footer.
 */
export async function getHomepage(): Promise<Homepage> {
  try {
    const res = await fetch(`${API_URL}/home/settings`, {
      next: { revalidate: CATALOG_REVALIDATE, tags: ["catalog"] },
    });
    if (!res.ok) return resolveHomepage(null);
    const body = (await res.json()) as HomepageSettingsResponse;
    return resolveHomepage(body.data);
  } catch {
    return resolveHomepage(null);
  }
}
