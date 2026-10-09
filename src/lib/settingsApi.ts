import { api } from "@/lib/api";
import type { ShippingSettings } from "@/types";

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
