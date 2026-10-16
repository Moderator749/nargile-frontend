import { api } from "@/lib/api";
import type { ShippingSettings, StoreParameters } from "@/types";

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
 * The defaults the server falls back to (`app/services/store_parameters.py`),
 * so the storefront can state the rules before the read lands.
 */
export const DEFAULT_STORE_PARAMETERS: StoreParameters = {
  free_shipping_threshold: "3000.00",
  coal_min_kg: "20",
  coal_max_ratio: "0.50",
  coal_rule_basis: "kg",
  coal_min_quantity: 20,
  bank_transfer_tiers: [
    { threshold: "1.00", rate: "0.05" },
    { threshold: "30000.00", rate: "0.07" },
  ],
  volume_tiers: [
    { threshold: "30000.00", rate: "0.05" },
    { threshold: "50000.00", rate: "0.08" },
  ],
  loyalty: {
    enabled: true,
    base_rate: "0.10",
    band_min: "20000.00",
    band_max: "29999.99",
    conversion_rate: "1.00",
    annual_spend_threshold: "20000.00",
    annual_bonus_points: 1000,
    annual_period_days: 365,
    annual_order_ceiling: "20000.00",
  },
  istanbul_free_min_subtotal: "20000.00",
};

/**
 * "Parametreler": free shipping, the coal rule and the discount ladders. Public:
 * the storefront states them to visitors who are not logged in as well.
 */
export async function fetchStoreParameters(signal?: AbortSignal): Promise<StoreParameters> {
  const { data } = await api.get<StoreParameters>("/settings/parameters", { signal });
  return data;
}
