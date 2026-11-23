"use client";

import { useSyncExternalStore } from "react";

import { fetchStoreParameters } from "@/lib/settingsApi";
import { DEFAULT_STORE_PARAMETERS } from "@/lib/storeParameters";
import type { LoyaltyBand } from "@/lib/sultanPuan";

// One read of "Parametreler" per page load, shared by every card that asks:
// a shelf of thirty cards is one request, not thirty.
let known: LoyaltyBand | null = null;
let asking = false;
const listeners = new Set<() => void>();

function load() {
  if (known || asking) return;
  asking = true;
  fetchStoreParameters()
    .then((params) => {
      known = params.loyalty;
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      asking = false; // the next card to mount tries again; the defaults stand meanwhile
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

const fallback = () => DEFAULT_STORE_PARAMETERS.loyalty;

/**
 * The SultanPuan band as "Parametreler" has it now. It starts on the defaults
 * the server falls back to (the band and rate it has today), so the server
 * render and the first paint already carry the badge, and moves to the live
 * figures once read.
 */
export function useLoyaltyBand(): LoyaltyBand {
  return useSyncExternalStore(subscribe, () => known ?? fallback(), fallback);
}
