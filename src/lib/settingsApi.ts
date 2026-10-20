import { api } from "@/lib/api";
import type { ShippingSettings, StoreParameters } from "@/types";

// Kept where the server can read it too (no API client there).
export { DEFAULT_STORE_PARAMETERS } from "@/lib/storeParameters";

/** The default the server also falls back to, so the cart can render before the
    read lands and never shows a different limit than checkout applies. */
export const ISTANBUL_FREE_MIN_DEFAULT = 20000;

/**
 * The shipping limits the panel sets. Public: the cart has to name the figure
 * ("₺20.000 ve üzeri alışverişlerde ücretsiz") beside the option it governs.
 */
export async function fetchShippingSettings(signal?: AbortSignal): Promise<ShippingSettings> {
  const { data } = await api.get<ShippingSettings>("/settings/shipping", { signal });
  return data;
}


/**
 * "Parametreler": free shipping, the coal rule and the discount ladders. Public:
 * the storefront states them to visitors who are not logged in as well.
 */
export async function fetchStoreParameters(signal?: AbortSignal): Promise<StoreParameters> {
  const { data } = await api.get<StoreParameters>("/settings/parameters", { signal });
  return data;
}
