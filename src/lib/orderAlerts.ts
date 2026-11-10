/**
 * The panel's new-order chime, its bookkeeping kept free of React so it can be
 * tested on its own: where a poll starts from, which orders are news, and what
 * the toast says. The component is components/admin/OrderAlerts.
 */

/** How often an open panel asks for new orders (a hidden tab: as often as the browser lets it). */
export const POLL_EVERY = 20_000;
/** A saved cursor older than this is ignored: a panel reopened tomorrow does not chime for today's orders. */
export const CURSOR_MAX_AGE = 10 * 60_000;
/** How many announced order ids are remembered (well past a day's orders). */
export const SEEN_MAX = 200;

/** localStorage keys: the last poll's server time, and the orders already chimed for (shared by the tabs). */
export const CURSOR_KEY = "nargile.orderAlerts.cursor";
export const CHIMED_KEY = "nargile.orderAlerts.chimed";

export interface PlacedOrder {
  id: string;
  order_number: string;
  /** Decimal string, e.g. "1234.50". */
  total_amount: string;
  customer_name: string;
  placed_at: string;
}

/** Where the first poll starts: the saved cursor while it is recent, else none (the server answers with its clock). */
export function startCursor(saved: string | null, now: number): string | null {
  if (!saved) return null;
  const at = Date.parse(saved);
  return Number.isFinite(at) && now - at <= CURSOR_MAX_AGE ? saved : null;
}

/** The orders not yet in `seen`, each once, in the server's order. */
export function unseen(orders: readonly PlacedOrder[], seen: ReadonlySet<string>): PlacedOrder[] {
  const fresh = new Map<string, PlacedOrder>();
  for (const o of orders) if (!seen.has(o.id)) fresh.set(o.id, o);
  return [...fresh.values()];
}

/** `seen` with `ids` added at the end, the oldest dropped past SEEN_MAX. */
export function remember(seen: readonly string[], ids: readonly string[]): string[] {
  const all = [...seen.filter((id) => !ids.includes(id)), ...ids];
  return all.slice(Math.max(0, all.length - SEEN_MAX));
}

const LIRA = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1234.5" → "1.234,50 TL". */
export const lira = (amount: string) => `${LIRA.format(Number(amount))} TL`;

/** "Yeni Sipariş! #ORD-… - 1.234,50 TL - Ayşe Yılmaz" */
export const alertText = (o: PlacedOrder) => `Yeni Sipariş! #${o.order_number} - ${lira(o.total_amount)} - ${o.customer_name}`;
