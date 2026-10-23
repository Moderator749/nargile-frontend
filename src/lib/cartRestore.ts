import type { CartLineItem } from "@/types";

/**
 * The cart with a removed line put back where it was ("Geri Al"), at the
 * quantity it had. Unchanged if the line is there again already (added back
 * another way meanwhile) or has no quantity.
 */
export function withRestored(items: CartLineItem[], item: CartLineItem, index: number): CartLineItem[] {
  if (!(item.quantity > 0) || items.some((i) => i.variant_id === item.variant_id)) return items;
  const next = [...items];
  next.splice(Math.min(Math.max(index, 0), next.length), 0, item);
  return next;
}
