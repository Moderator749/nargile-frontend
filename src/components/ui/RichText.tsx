import { shiftHeadings, toHtml } from "@/lib/richText";

/**
 * A rich-text field (description, legal text, note) on the page.
 *
 * The HTML comes from the API, which cleans everything the panel's editor
 * saves down to paragraphs, line breaks, bold/italic/underline, two heading
 * levels, lists and plain links (saas_backend/app/core/rich_text.py) — that is
 * the guarantee that makes `dangerouslySetInnerHTML` safe here. Only pass it
 * values from those fields; a value that is not HTML is escaped (`toHtml`).
 * Styled by `.rich-text` in globals.css.
 */
export function RichText({
  html,
  className = "",
  nested = false,
  id,
}: {
  html: string | null | undefined;
  className?: string;
  /** Shown under a heading of its own: the text's headings move one level down. */
  nested?: boolean;
  id?: string;
}) {
  const markup = toHtml(html);
  if (!markup) return null;
  return (
    <div
      id={id}
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: nested ? shiftHeadings(markup) : markup }}
    />
  );
}
