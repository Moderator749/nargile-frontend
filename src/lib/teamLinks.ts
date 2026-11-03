/**
 * The order and product references in an Ekip Kanalı message, found when it
 * is shown — messages are stored as typed, never as markup.
 *
 * - An order by its number, "ORD-20261103084112-A1B2C3", or by the six
 *   characters it ends in, "#A1B2C3" (any case): both open Siparişler on it.
 * - A product by the token the composer's picker inserts,
 *   "[STEAM 13-1 · Pure Nargile Takımı](ürün:<id>)": readable as plain text,
 *   unambiguous whatever the code holds (spaces, dashes), and it names the
 *   product by id, so it opens that product even if its code changes.
 */

export type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "order"; text: string; ref: string }
  | { kind: "product"; text: string; id: string };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const REFERENCE = new RegExp(
  [
    `\\[(?<label>[^\\]\\n]{1,120})\\]\\(ürün:(?<id>${UUID})\\)`,
    // Not inside a longer word or code ("XORD-…", "…-A1B2C3D").
    `(?<![\\w-])(?<full>ORD-\\d{14}-[0-9a-f]{6})(?![\\w-])`,
    // "#A1B2C3", but not "&#123456" (an entity) or "##A1B2C3".
    `(?<![\\w#&])#(?<short>[0-9a-f]{6})(?![\\w-])`,
  ].join("|"),
  "giu",
);

/** The message as runs of text and references, in order. */
export function messageParts(body: string): MessagePart[] {
  const parts: MessagePart[] = [];
  let at = 0;
  for (const match of body.matchAll(REFERENCE)) {
    const start = match.index ?? 0;
    if (start > at) parts.push({ kind: "text", text: body.slice(at, start) });
    const { label, id, full, short } = match.groups ?? {};
    if (id) parts.push({ kind: "product", text: label.trim(), id: id.toLowerCase() });
    else parts.push({ kind: "order", text: match[0], ref: (full ?? short).toUpperCase() });
    at = start + match[0].length;
  }
  if (at < body.length) parts.push({ kind: "text", text: body.slice(at) });
  return parts;
}

/** Siparişler opened on the order a reference names. */
export const orderHref = (ref: string) => `/admin/orders?siparis=${encodeURIComponent(ref)}`;

/** The product's page in the panel. */
export const productHref = (id: string) => `/admin/products/${id}`;

/** The token the picker inserts for a product: its code and name, then its id. */
export function productToken(product: { id: string; base_code: string; name: string }): string {
  // Nothing that would end the label early or break the line.
  const label = `${product.base_code} · ${product.name}`.replace(/[[\]\n\r]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  return `[${label}](ürün:${product.id})`;
}
