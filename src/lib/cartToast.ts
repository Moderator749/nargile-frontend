import { useSyncExternalStore } from "react";

/**
 * "… sepete eklendi · Sepete Git": the one notice every add-to-cart gives —
 * the product page's button, a card's "+", "Seçilenleri Sepete Ekle" — shown
 * by `CartToast`, mounted once in the shop's chrome. A new one replaces the
 * last. On the cart page, a line taken out says so with the way back
 * ("… sepetten kaldırıldı · Geri Al").
 */
export type CartToastMessage =
  | { kind: "added"; name: string; image?: string | null }
  | { kind: "addedMany"; count: number }
  | { kind: "updated" }
  | { kind: "removed"; name: string; image?: string | null; undo: () => void };

export interface CartToastState {
  id: number;
  message: CartToastMessage;
}

let current: CartToastState | null = null;
let serial = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function showCartToast(message: CartToastMessage) {
  current = { id: ++serial, message };
  emit();
}

export function dismissCartToast(id: number) {
  if (current?.id !== id) return;
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCartToast(): CartToastState | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
