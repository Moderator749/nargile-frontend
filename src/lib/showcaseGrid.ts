/**
 * The desktop grid of "Premium Ürün Yelpazesi": rows of four slots, two rows
 * at most. Shared by the homepage, the editor and its checks — and the server
 * holds a save to the same rules (`Showcase` in the homepage schema). No
 * imports, so the tests run it as is.
 */

/** What the grid reads of a tile. */
export interface GridTile {
  wide: boolean;
  /** Off = kept in the editor's list but not drawn, so it takes no slot. */
  enabled?: boolean;
}

/** Slots in a desktop row, and rows in the grid: what the server holds the editor to too. */
export const SHOWCASE_COLUMNS = 4;
export const SHOWCASE_ROWS = 2;
export const SHOWCASE_SLOTS = SHOWCASE_COLUMNS * SHOWCASE_ROWS;

export interface ShowcaseSlot {
  /** Slots it takes in its desktop row: 2 only for a "geniş" tile its row has room for. */
  span: 1 | 2;
  /** Its desktop row, from 0. */
  row: number;
  /** Marked "geniş" but drawn single: its row had no two slots left, or a wide tile already. */
  narrowed: boolean;
}

/**
 * The desktop rows, filled in order: each tile takes the next slot, a "geniş"
 * one the next two — when the row has two left and no wide tile yet; else it is
 * drawn single (`narrowed`), so a row never has a hole or two wide tiles. The
 * editor (and the server) refuse a list that needs that, or that runs past
 * `SHOWCASE_ROWS` rows; the homepage copes either way.
 */
export function placeShowcase(tiles: GridTile[]): ShowcaseSlot[] {
  let used = 0;
  let row = 0;
  let rowHasWide = false;
  return tiles.map((tile) => {
    const wide = tile.wide && !rowHasWide && used + 2 <= SHOWCASE_COLUMNS;
    const slot: ShowcaseSlot = { span: wide ? 2 : 1, row, narrowed: tile.wide && !wide };
    used += slot.span;
    rowHasWide ||= wide;
    if (used === SHOWCASE_COLUMNS) {
      used = 0;
      row += 1;
      rowHasWide = false;
    }
    return slot;
  });
}

/** Slots a list takes once laid out (a narrowed wide tile takes one). */
export const showcaseSlotsUsed = (tiles: GridTile[]) =>
  placeShowcase(tiles).reduce((sum, slot) => sum + slot.span, 0);

/** The tiles that are drawn (`enabled`), each with its place in the editor's list. */
const shown = (tiles: GridTile[]) =>
  tiles.flatMap((tile, index) => (tile.enabled === false ? [] : [{ tile, index }]));

/** Why the editor's list will not lay out as it says, in the admin's words; null when it does. */
export function showcaseProblem(tiles: GridTile[]): string | null {
  const list = shown(tiles);
  const slots = placeShowcase(list.map((t) => t.tile));
  const narrowed = slots.findIndex((s) => s.narrowed);
  if (narrowed >= 0) {
    const { row } = slots[narrowed];
    const crowded = slots.some((s, i) => i < narrowed && s.row === row && s.span === 2);
    return `${list[narrowed].index + 1}. kutu geniş, ama ${row + 1}. satırda ${
      crowded ? "zaten bir geniş kutu var" : "iki boş yer kalmadı"
    }. Geniş kutuyu kaldırın ya da sırasını değiştirin.`;
  }
  const used = slots.reduce((sum, s) => sum + s.span, 0);
  if (used > SHOWCASE_SLOTS)
    return `Kutular ${used} yer tutuyor; en fazla ${SHOWCASE_ROWS} satır, ${SHOWCASE_SLOTS} yer (geniş kutu 2 yer sayılır).`;
  return null;
}

/** Whether the tile at `index` may be marked "geniş" without breaking its rows. */
export function canWiden(tiles: GridTile[], index: number): boolean {
  return !showcaseProblem(tiles.map((t, i) => (i === index ? { ...t, wide: true } : t)));
}
