import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartLineItem, UUID } from "@/types";

interface CartState {
  items: CartLineItem[];
  loyaltyPointsToRedeem: number;
  addItem: (item: CartLineItem) => void;
  removeItem: (variantId: UUID) => void;
  updateQuantity: (variantId: UUID, quantity: number) => void;
  setLoyaltyPointsToRedeem: (points: number) => void;
  clearCart: () => void;
}

const toCount = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      loyaltyPointsToRedeem: 0,

      addItem: (item) =>
        set((state) => {
          const quantity = toCount(item.quantity);
          if (quantity === 0) return state;
          const existing = state.items.find((i) => i.variant_id === item.variant_id);
          if (!existing) return { items: [...state.items, { ...item, quantity }] };
          return {
            items: state.items.map((i) =>
              i.variant_id === item.variant_id
                ? { ...item, quantity: i.quantity + quantity }
                : i,
            ),
          };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => {
          const q = toCount(quantity);
          return {
            items:
              q === 0
                ? state.items.filter((i) => i.variant_id !== variantId)
                : state.items.map((i) =>
                    i.variant_id === variantId ? { ...i, quantity: q } : i,
                  ),
          };
        }),

      setLoyaltyPointsToRedeem: (points) => set({ loyaltyPointsToRedeem: toCount(points) }),

      clearCart: () => set({ items: [], loyaltyPointsToRedeem: 0 }),
    }),
    {
      name: "nargile-cart",
      version: 1,
      // window.localStorage throws on the server, which disables persistence there.
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        items: state.items,
        loyaltyPointsToRedeem: state.loyaltyPointsToRedeem,
      }),
      // Rehydrated manually after mount (see StoreHydration) to avoid SSR mismatches.
      skipHydration: true,
    },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);
