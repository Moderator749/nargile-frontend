import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Display currency. Prices are stored and charged in TRY; USD/EUR are approximations. */
export type DisplayCurrency = "TRY" | "USD" | "EUR";

export const DISPLAY_CURRENCIES: DisplayCurrency[] = ["TRY", "USD", "EUR"];

interface CurrencyState {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "TRY",
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "display-currency",
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({ currency: state.currency }),
      // Rehydrated by StoreHydration after the first render, so SSR (TRY) and hydration match.
      skipHydration: true,
    },
  ),
);
