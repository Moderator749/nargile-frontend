import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { withRestored } from "@/lib/cartRestore";
import { cartItem, trackCartChange } from "@/lib/gaEvents";
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
  /** `track: false` for the shop's own change (holding a line to the stock), not the visitor's. */
  updateQuantity: (variantId: UUID, quantity: number, opts?: { track?: boolean }) => void;
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

/**
 * The cart. Every change a visitor makes is also an add_to_cart or
 * remove_from_cart event for Google Analytics (lib/gaEvents), sent here so
 * each way into the cart — the product page, a card's "+", "Hepsini Sepete
 * Ekle", the cart's own steppers and "Geri Al" — is counted once.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loyaltyPointsToRedeem: 0,

      addItem: (item) => {
        const quantity = toCount(item.quantity);
        set((state) => {
          const items = withItem(state.items, item);
          return items === state.items ? state : { items };
        });
        if (quantity > 0) trackCartChange("add_to_cart", [cartItem(item, quantity)]);
      },

      addItems: (added) => {
        set((state) => {
          const items = added.reduce(withItem, state.items);
          return items === state.items ? state : { items };
        });
        trackCartChange(
          "add_to_cart",
          added.filter((i) => toCount(i.quantity) > 0).map((i) => cartItem(i, toCount(i.quantity))),
        );
      },

      removeItem: (variantId) => {
        const line = get().items.find((i) => i.variant_id === variantId);
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variantId),
        }));
        if (line) trackCartChange("remove_from_cart", [cartItem(line)]);
      },

      restoreItem: (item, index) => {
        const before = get().items;
        set((state) => {
          const items = withRestored(state.items, item, index);
          return items === state.items ? state : { items };
        });
        // "Geri Al" undoes a remove_from_cart: the line is back.
        if (get().items !== before) trackCartChange("add_to_cart", [cartItem(item)]);
      },

      updateQuantity: (variantId, quantity, opts) => {
        const line = get().items.find((i) => i.variant_id === variantId);
        const q = toCount(quantity);
        set((state) => ({
          items:
            q === 0
              ? state.items.filter((i) => i.variant_id !== variantId)
              : state.items.map((i) =>
                  i.variant_id === variantId ? { ...i, quantity: q } : i,
                ),
        }));
        if (!line || opts?.track === false || q === line.quantity) return;
        trackCartChange(
          q > line.quantity ? "add_to_cart" : "remove_from_cart",
          [cartItem(line, Math.abs(q - line.quantity))],
        );
      },

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
