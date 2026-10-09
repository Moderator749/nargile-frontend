"use client";

import { useEffect, useState } from "react";

import { ISTANBUL_FREE_MIN_DEFAULT, fetchShippingSettings } from "@/lib/settingsApi";

/**
 * The İstanbul free-delivery limit, as the shop currently has it set.
 *
 * It starts on the same default the server falls back to, so the card that
 * quotes it renders at its final height straight away and never flashes a
 * figure that checkout would not honour. A failed read leaves the default in
 * place; the server has the last word either way.
 */
export function useIstanbulFreeMinimum(): number {
  const [minimum, setMinimum] = useState(ISTANBUL_FREE_MIN_DEFAULT);

  useEffect(() => {
    const controller = new AbortController();
    fetchShippingSettings(controller.signal)
      .then(({ istanbul_free_min_subtotal }) => {
        const value = Number(istanbul_free_min_subtotal);
        if (Number.isFinite(value)) setMinimum(value);
      })
      .catch(() => {
        // Non-critical: the default stands, and the server enforces the real one.
      });
    return () => controller.abort();
  }, []);

  return minimum;
}
