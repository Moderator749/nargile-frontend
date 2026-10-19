/**
 * Code 128, as the shipping label's barcode: the Yurtiçi branch scans our cargo
 * key off it to match the parcel to its registration.
 *
 * Code set B for text, switching to C (two digits a symbol) for runs of four
 * or more digits, which keeps a 20-character key short enough for a 100 mm
 * label. `encode128` gives the bar/space widths, start to stop, check symbol
 * included; drawing them is the caller's. Kept free of React and of path
 * aliases so `node --test` runs it as is.
 */

/** Bar and space widths (in modules) of symbols 0–106; 103–105 start A/B/C, 106 stop. */
export const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
] as const;

const START_B = 104;
const START_C = 105;
const CODE_B = 100; // "switch to B", from C
const CODE_C = 99; // "switch to C", from B
const STOP = 106;

const isDigit = (c: string) => c >= "0" && c <= "9";
const digitsAt = (text: string, i: number) => {
  let n = 0;
  while (i + n < text.length && isDigit(text[i + n])) n++;
  return n;
};

/** The symbol values for `text`, start and check symbol included, stop excluded. */
export function symbols128(text: string): number[] {
  for (const c of text) {
    const code = c.charCodeAt(0);
    if (code < 32 || code > 126) throw new RangeError(`Code 128 B cannot carry ${JSON.stringify(c)}`);
  }
  const out: number[] = [];
  let set: "B" | "C" | null = null;
  for (let i = 0; i < text.length; ) {
    const run = digitsAt(text, i);
    // C pays off for four digits or more, or for a whole text of two or more.
    if (run >= 4 || (set === null && run >= 2 && run === text.length)) {
      const even = run - (run % 2);
      if (set !== "C") out.push(set === null ? START_C : CODE_C);
      set = "C";
      for (let k = 0; k < even; k += 2) out.push(Number(text.slice(i + k, i + k + 2)));
      i += even;
      continue;
    }
    if (set !== "B") out.push(set === null ? START_B : CODE_B);
    set = "B";
    out.push(text.charCodeAt(i) - 32);
    i++;
  }
  if (out.length === 0) throw new RangeError("Nothing to encode");
  const check = out.reduce((sum, value, n) => sum + value * Math.max(n, 1), 0) % 103;
  return [...out, check];
}

/** The bar/space widths of the whole barcode, alternating bar first, stop included. */
export function encode128(text: string): number[] {
  return [...symbols128(text), STOP].flatMap((s) => [...PATTERNS[s]].map(Number));
}
