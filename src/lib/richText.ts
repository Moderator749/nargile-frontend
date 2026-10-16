// Rich text as the API stores it: HTML from the panel's editor, cleaned on the
// server (saas_backend/app/core/rich_text.py) to a short list of tags. These
// helpers mirror that module's rules for the storefront.

/** The editor always writes block-level HTML; anything else is plain text. */
const HTML = /^\s*<(?:p|h[1-6]|ul|ol|div|blockquote)\b/i;

export const looksLikeHtml = (value: string) => HTML.test(value);

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Plain text as written before the editor: blank lines between paragraphs, "## " headings. */
export function textToHtml(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? `<h2>${escapeHtml(block.slice(3).trim())}</h2>`
        : `<p>${block.split("\n").map((line) => escapeHtml(line.trim())).join("<br>")}</p>`,
    )
    .join("");
}

/**
 * What to put on the page: the stored HTML as it is (it was cleaned when it
 * was saved), or — for a value that is not HTML, such as a cached response
 * from before the editor — the text escaped into paragraphs. Never raw text as
 * markup.
 */
export function toHtml(value: string | null | undefined): string {
  if (!value) return "";
  return looksLikeHtml(value) ? value : textToHtml(value);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** The words of a rich-text value: for a meta description, a preview line, a search. */
export function htmlToText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<\/(?:p|h[1-6]|li|ul|ol)>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : entity;
      }
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The text's headings one level down (<h2> → <h3>, <h3> → <h4>), for a text
 * shown under a heading of its own — a dialog's title, a section's <h2>.
 */
export function shiftHeadings(html: string): string {
  return html.replace(/<(\/?)h([23])\b/gi, (_, slash: string, level: string) => `<${slash}h${Number(level) + 1}`);
}
