import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { withRestored } from "@/lib/cartRestore";
import type { CartLineItem, UUID } from "@/types";

interface CartState {
  items: CartLineItem[];
  loyaltyPointsToRedeem: number;
  addItem: (item: CartLineItem) => void;
  /** Several lines in one update (one save, one re-render): "Hepsini Sepete Ekle". */
  addItems: (items: CartLineItem[]) => void;
  removeItem: (variantId: UUID) => void;
  /** A removed line back where it was ("Geri Al"); left as it is if it has been added again since. */
  restoreItem: (item: CartLineItem, index: number) => void;
  updateQuantity: (variantId: UUID, quantity: number) => void;
  setLoyaltyPointsToRedeem: (points: number) => void;
  clearCart: () => void;
}

const toCount = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

/** The cart with `item` added: a new line, or more of one already there (its details refreshed). */
function withItem(items: CartLineItem[], item: CartLineItem): CartLineItem[] {
  const quantity = toCount(item.quantity);
  if (quantity === 0) return items;
  const existing = items.find((i) => i.variant_id === item.variant_id);
  if (!existing) return [...items, { ...item, quantity }];
  return items.map((i) => (i.variant_id === item.variant_id ? { ...item, quantity: i.quantity + quantity } : i));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      loyaltyPointsToRedeem: 0,

      addItem: (item) =>
        set((state) => {
          const items = withItem(state.items, item);
          return items === state.items ? state : { items };
        }),

      addItems: (added) =>
        set((state) => {
          const items = added.reduce(withItem, state.items);
          return items === state.items ? state : { items };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variantId),
        })),

      restoreItem: (item, index) =>
        set((state) => {
          const items = withRestored(state.items, item, index);
          return items === state.items ? state : { items };
        }),

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
