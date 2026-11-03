/**
 * A category page's own order ("Önerilen") as the editor moves it: one list,
 * in the page's order, in three parts — the ranked at the top, the unranked
 * (by name) in the middle, the ones kept at the bottom ("En altta sabit") —
 * and the parts' sizes, which are what the server stores. Pure, so `npm test`
 * reads it as is.
 */

export interface OrderRow {
  product_id: string;
  position: number | null;
  bottom?: boolean;
}

/** An order as the editor holds it: the rows in the page's order, and how many lead and how many close it. */
export interface Order<T extends OrderRow> {
  rows: T[];
  top: number;
  bottom: number;
}

/** The server's rows (already in the page's order) as an order. */
export function orderOf<T extends OrderRow>(rows: T[]): Order<T> {
  return {
    rows,
    top: rows.filter((r) => r.position !== null && !r.bottom).length,
    bottom: rows.filter((r) => r.bottom).length,
  };
}

/** What a save sends: the top's ids, first to last, and the bottom's. */
export function orderRequest<T extends OrderRow>({ rows, top, bottom }: Order<T>): { productIds: string[]; bottomIds: string[] } {
  return {
    productIds: rows.slice(0, top).map((r) => r.product_id),
    bottomIds: rows.slice(rows.length - bottom).map((r) => r.product_id),
  };
}

/** The rows with each one's place in its part written in, as the server will answer. */
export function withPositions<T extends OrderRow>({ rows, top, bottom }: Order<T>): T[] {
  const bottomFrom = rows.length - bottom;
  return rows.map((r, i) =>
    i < top
      ? { ...r, position: i, bottom: false }
      : i >= bottomFrom
        ? { ...r, position: i - bottomFrom, bottom: true }
        : { ...r, position: null, bottom: false },
  );
}

/** Counts, of the products in `ids`, how many sit at the top and how many at the bottom now. */
function partsOf<T extends OrderRow>({ rows, top, bottom }: Order<T>, ids: ReadonlySet<string>) {
  const bottomFrom = rows.length - bottom;
  let fromTop = 0;
  let fromBottom = 0;
  rows.forEach((r, i) => {
    if (!ids.has(r.product_id)) return;
    if (i < top) fromTop += 1;
    else if (i >= bottomFrom) fromBottom += 1;
  });
  return { fromTop, fromBottom };
}

/**
 * "En Üste Taşı", for one product or several: they lead the page, in the
 * order they are in now, ahead of the rest of the top; the bottom keeps the
 * others it had.
 */
export function toTop<T extends OrderRow>(order: Order<T>, ids: ReadonlySet<string>): Order<T> {
  const picked = order.rows.filter((r) => ids.has(r.product_id));
  if (picked.length === 0) return order;
  const { fromTop, fromBottom } = partsOf(order, ids);
  return {
    rows: [...picked, ...order.rows.filter((r) => !ids.has(r.product_id))],
    top: order.top - fromTop + picked.length,
    bottom: order.bottom - fromBottom,
  };
}

/**
 * "En Alta Taşı", for one product or several: they close the page, in the
 * order they are in now, after the rest of the bottom — kept there, so a
 * product added later lands above them.
 */
export function toBottom<T extends OrderRow>(order: Order<T>, ids: ReadonlySet<string>): Order<T> {
  const picked = order.rows.filter((r) => ids.has(r.product_id));
  if (picked.length === 0) return order;
  const { fromTop, fromBottom } = partsOf(order, ids);
  return {
    rows: [...order.rows.filter((r) => !ids.has(r.product_id)), ...picked],
    top: order.top - fromTop,
    bottom: order.bottom - fromBottom + picked.length,
  };
}

/**
 * A product dragged to a new place (`next`: the rows as they now stand).
 * Dropped among, or just above, the ones kept at the bottom, it joins them;
 * anywhere else it is ranked, and so is everything above where it landed —
 * what sits above it is now the admin's choice too.
 */
export function dragged<T extends OrderRow>(order: Order<T>, next: T[], id: string): Order<T> {
  const from = order.rows.findIndex((r) => r.product_id === id);
  const to = next.findIndex((r) => r.product_id === id);
  if (from < 0 || to < 0) return order;
  const wasTop = from < order.top;
  const wasBottom = from >= order.rows.length - order.bottom;
  const top = order.top - (wasTop ? 1 : 0);
  const bottom = order.bottom - (wasBottom ? 1 : 0);
  const below = next.length - 1 - to;
  if (bottom > 0 && below <= bottom) return { rows: next, top: Math.min(top, to), bottom: bottom + 1 };
  return { rows: next, top: Math.max(top + 1, to + 1), bottom };
}
