"use client";

import { useEffect, useState } from "react";

import { formatDisplayPrice, loadExchangeRates } from "@/lib/money";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { CatalogPrice, ExchangeRates } from "@/types";

/** Shared across hooks so a currency switch never refetches. */
let cachedRates: ExchangeRates | null = null;

/** The visitor's display currency, its TCMB rates, and a formatter for catalog prices. */
export function useDisplayMoney() {
  const currency = useCurrencyStore((s) => s.currency);
  const [rates, setRates] = useState<ExchangeRates | null>(cachedRates);

  useEffect(() => {
    if (currency === "TRY" || rates) return;
    let alive = true;
    void loadExchangeRates().then((r) => {
      cachedRates = r;
      if (alive) setRates(r);
    });
    return () => {
      alive = false;
    };
  }, [currency, rates]);

  // Without rates the price stays in TRY rather than showing a wrong conversion.
  const effective = currency !== "TRY" && rates ? currency : "TRY";
  return {
    currency: effective,
    rates,
    format: (price: CatalogPrice) => formatDisplayPrice(price, effective, rates),
  };
}
