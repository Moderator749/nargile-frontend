"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { fetchCartLines } from "@/lib/catalogApi";
import type { CartLineInfo } from "@/types";

/**
 * A visitor's cart lines before there is a quote (a quote needs an account):
 * each colour's page, code and retail stock, asked for live, so the cart can
 * link its lines and hold a quantity to what can be ordered. Null until
 * known, and when not `enabled` (a signed-in buyer has the quote instead).
 */
export function useCartLines(variantIds: string[], enabled: boolean): Map<string, CartLineInfo> | null {
  const key = enabled && variantIds.length > 0 ? [...variantIds].sort().join(",") : null;
  const [found, setFound] = useState<{ key: string; lines: Map<string, CartLineInfo> } | null>(null);

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    fetchCartLines(key.split(","), controller.signal)
      .then((lines) => setFound({ key, lines: new Map(lines.map((l) => [l.variant_id, l])) }))
      .catch((err: unknown) => {
        // Non-critical: the lines stay as they are, unlinked and unheld; checkout holds them anyway.
        if (!axios.isCancel(err)) setFound(null);
      });
    return () => controller.abort();
  }, [key]);

  return found && found.key === key ? found.lines : null;
}
