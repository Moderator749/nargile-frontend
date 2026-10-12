import type { BilgiBlock } from "@/lib/bilgi";

const listItemClass = "pl-1 marker:text-red-600";

/** A Bilgi document's text, block by block, with headings and lists kept as Word had them. */
export function BilgiBody({ blocks }: { blocks: BilgiBlock[] }) {
  return (
    <div className="max-w-none space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={index}
                className="pt-6 text-base font-bold tracking-tight text-neutral-900 first:pt-0 dark:text-white"
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
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={index} className={`space-y-2 pl-5 ${block.type === "ol" ? "list-decimal" : "list-disc"}`}>
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
