/**
 * A legal text as the admin typed it: blank lines separate paragraphs and a
 * line beginning with `## ` is a heading.
 *
 * Deliberately not a markdown renderer — these texts are prose with headings,
 * and anything richer would be a way to put arbitrary HTML on the page from the
 * panel.
 */
export function LegalText({ body, headingLevel = 3 }: { body: string; headingLevel?: 3 | 4 }) {
  const blocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  const Heading = `h${headingLevel}` as "h3" | "h4";

  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
      {blocks.map((block, index) =>
        block.startsWith("## ") ? (
          <Heading
            key={index}
            className="pt-2 text-sm font-bold tracking-tight text-slate-900 first:pt-0 dark:text-zinc-100"
          >
            {block.slice(3).trim()}
          </Heading>
        ) : (
          // Single newlines inside a paragraph are kept: an address block is
          // written as lines, not as a run-on sentence.
          <p key={index} className="whitespace-pre-line">
            {block}
          </p>
        ),
      )}
    </div>
  );
}
