"use client";

import { useEffect, useState } from "react";

import { DEFAULT_STORE_PARAMETERS, fetchStoreParameters } from "@/lib/settingsApi";
import type { StoreParameters } from "@/types";

/**
 * The shop's commercial rules ("Parametreler"), as currently set in the panel.
 *
 * Like `useIstanbulFreeMinimum`, it starts on the defaults the server falls
 * back to, so whatever quotes a figure renders at its final size straight away,
 * and a failed read leaves the defaults in place. Read on every mount rather
 * than cached, so a change in the panel shows on the next page a visitor opens;
 * the server applies the live rules to the cart either way.
 */
export function useStoreParameters(): StoreParameters {
  const [params, setParams] = useState(DEFAULT_STORE_PARAMETERS);

  useEffect(() => {
    const controller = new AbortController();
    fetchStoreParameters(controller.signal)
      .then(setParams)
      .catch(() => {
        // Non-critical: the defaults stand, and the server enforces the real rules.
      });
    return () => controller.abort();
  }, []);

  return params;
}
