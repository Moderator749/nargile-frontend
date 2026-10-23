import type { BilgiBlock } from "@/lib/bilgi";

const listItemClass = "ps-1 marker:text-red-600";

/**
 * A numbered section's anchor ("6. CAYMA HAKKI" → #madde-6), the same in every
 * language the document is translated into, so a link can point at a section
 * (the footer's "İptal & İade Koşulları" at the right of withdrawal).
 */
export const sectionId = (heading: string) => {
  const number = heading.match(/^\s*(\d+)\./);
  return number ? `madde-${number[1]}` : undefined;
};

/**
 * A Bilgi document's text, block by block, with headings and lists kept as Word
 * had them. Indents and the notice's bar are logical (ps-, border-s), so an
 * Arabic copy mirrors.
 */
export function BilgiBody({ blocks }: { blocks: BilgiBlock[] }) {
  return (
    <div className="max-w-none space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={index}
                id={sectionId(block.text)}
                className="scroll-mt-28 pt-6 text-base font-bold tracking-tight text-neutral-900 first:pt-0 dark:text-white"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} className="pt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                {block.text}
              </h3>
            );
          case "p":
            return <p key={index}>{block.text}</p>;
          case "notice":
            // A translation's first line: the Turkish text is the binding one.
            return (
              <p
                key={index}
                role="note"
                className="rounded-e-lg border-s-4 border-red-600 bg-neutral-50 px-4 py-3 text-xs font-medium text-neutral-600 dark:bg-white/[0.03] dark:text-neutral-400"
              >
                {block.text}
              </p>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={index} className={`space-y-2 ps-5 ${block.type === "ol" ? "list-decimal" : "list-disc"}`}>
                {block.items.map((item, i) => (
                  <li key={i} className={listItemClass}>
                    {item}
                  </li>
                ))}
              </List>
            );
          }
        }
      })}
    </div>
  );
}
