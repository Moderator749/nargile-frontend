/**
 * The whole listing's size beside the cards on screen ("48 / 312 ürün"), or
 * null where the count of cards is the whole story: everything has loaded, the
 * total is not known yet, or a filter has narrowed the grid — the filters work
 * on what has loaded, so a total of everything would not be the narrowed
 * grid's.
 */
export function listingTotal({
  total,
  loaded,
  shown,
  hasMore,
}: {
  /** The API's count of the whole listing; null until it has said. */
  total: number | null;
  /** Cards loaded so far. */
  loaded: number;
  /** Cards shown after the filters. */
  shown: number;
  hasMore: boolean;
}): number | null {
  if (!hasMore || total === null || total <= loaded || shown !== loaded) return null;
  return total;
}
