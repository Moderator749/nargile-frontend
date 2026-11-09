/**
 * Shipping labels on A4: four to a sheet, in the quarters of the page, so a
 * label cut out with scissors leaves the other three quarters usable. A sheet
 * already cut can go back in the tray: printing starts at the quarter still
 * on it, and a batch fills the rest of that sheet before starting a new one.
 */

/** A quarter of the A4 sheet, in reading order. */
export type Quadrant = 1 | 2 | 3 | 4;

export const QUADRANTS: readonly { value: Quadrant; label: string }[] = [
  { value: 1, label: "Sol Üst" },
  { value: 2, label: "Sağ Üst" },
  { value: 3, label: "Sol Alt" },
  { value: 4, label: "Sağ Alt" },
];

/** A quarter of a printed sheet: a label, one cut off before (`"used"`), or left blank. */
export type Slot<T> = { label: T } | "used" | null;

/** The labels laid on A4 sheets of four, the first at `start`. */
export function sheetsOf<T>(labels: readonly T[], start: Quadrant = 1): Slot<T>[][] {
  if (labels.length === 0) return [];
  const slots: Slot<T>[] = [...Array<Slot<T>>(start - 1).fill("used"), ...labels.map((label) => ({ label }))];
  const sheets: Slot<T>[][] = [];
  for (let i = 0; i < slots.length; i += 4) {
    const sheet = slots.slice(i, i + 4);
    while (sheet.length < 4) sheet.push(null);
    sheets.push(sheet);
  }
  return sheets;
}

/** The edges of a quarter that are cut: the ones on the page's middle lines, never the paper's own edges. */
export function cutEdges(q: Quadrant): { top: boolean; right: boolean; bottom: boolean; left: boolean } {
  const left = q === 1 || q === 3;
  const top = q === 1 || q === 2;
  return { top: !top, right: left, bottom: top, left: !left };
}

/** `?ids=a,b,c` (or repeated `ids`), in order, each once. */
export function parseOrderIds(raw: string | string[] | undefined): string[] {
  const parts = (Array.isArray(raw) ? raw : [raw ?? ""]).flatMap((s) => s.split(","));
  return [...new Set(parts.map((s) => s.trim()).filter(Boolean))];
}
