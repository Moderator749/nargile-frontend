/**
 * Brand names are entered in capitals ("SHISHA FOIL", "MR. WOOD") and shown on
 * the storefront exactly as stored. The capitals follow the neutral (English)
 * rule: "i" becomes "I", never the Turkish "İ" — brands are foreign names. A
 * Turkish capital typed as one ("İ", "Ğ", "Ü", "Ş", "Ö", "Ç") stays as typed.
 *
 * Letter by letter, and a letter whose capital is longer than itself ("ß" →
 * "SS") is left alone, so the text keeps its length and the caret its place.
 */
export function brandCaps(text: string): string {
  let out = "";
  for (const ch of text) {
    const up = ch.toUpperCase();
    out += up.length === ch.length ? up : ch;
  }
  return out;
}

/**
 * For a text input's change handler: the input's text in brand capitals, set
 * on the element itself with the caret and selection where they were (a
 * controlled input given a different value would jump the caret to the end).
 * Left as typed while an input method is still composing a character.
 */
export function capsInputValue(el: HTMLInputElement, composing = false): string {
  if (composing) return el.value;
  const caps = brandCaps(el.value);
  if (caps !== el.value) {
    const { selectionStart, selectionEnd, selectionDirection } = el;
    el.value = caps;
    if (selectionStart !== null && selectionEnd !== null) {
      el.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? undefined);
    }
  }
  return caps;
}
