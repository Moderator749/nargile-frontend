import { ArrowRight, ChevronDown } from "lucide-react";

import Link from "@/components/i18n/Link";
import { articleHref, type AnswerBlock, type BlogQuestion } from "@/lib/blogQuestions";

/** "Etiket: açıklama" in a list: the label in bold, as the source sets it. */
function ListItem({ text }: { text: string }) {
  const colon = text.indexOf(": ");
  if (colon > 0 && colon <= 60) {
    return (
      <li>
        <strong>{text.slice(0, colon + 1)}</strong> {text.slice(colon + 2)}
      </li>
    );
  }
  return <li>{text}</li>;
}

function Answer({ blocks }: { blocks: AnswerBlock[] }) {
  return blocks.map((block, i) =>
    "h" in block ? (
      <h4 key={i}>{block.h}</h4>
    ) : "p" in block ? (
      <p key={i}>{block.p}</p>
    ) : (
      <ul key={i}>
        {block.ul.map((text, j) => (
          <ListItem key={j} text={text} />
        ))}
      </ul>
    ),
  );
}

/**
 * One of the blog's questions as a native `<details>`: the question is the
 * toggle, the answer opens under it. Given a `group`, opening one closes the
 * others in it (the browser's exclusive accordion), so a long list stays one
 * answer tall. The four lüle questions end in a link to their full article.
 *
 * Drawn the same on /blog (on the server) and in the footer's dialog (on the
 * client): `onNavigate` lets the dialog close itself when that link is used.
 */
export function BlogQuestionItem({
  item,
  more,
  heading: Heading = "h3",
  group,
  onNavigate,
}: {
  item: BlogQuestion;
  /** The article link's label. */
  more: string;
  heading?: "h2" | "h3";
  group?: string;
  onNavigate?: () => void;
}) {
  const href = articleHref(item.id);
  return (
    <details id={`sss-${item.id}`} name={group} className="group scroll-mt-24">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-gray-900 transition-colors duration-200 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-white dark:hover:text-red-400 [&::-webkit-details-marker]:hidden">
        <Heading className="text-[15px] font-semibold leading-snug text-inherit md:text-base">{item.question}</Heading>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-gray-400 dark:text-neutral-400 transition-transform duration-200 group-open:-rotate-180 group-open:text-red-600 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="rich-text pb-6 text-sm leading-relaxed text-gray-600 md:text-[15px] dark:text-neutral-200">
        <Answer blocks={item.answer} />
        {href && (
          <p>
            <Link href={href} onClick={onNavigate} className="inline-flex items-center gap-1 font-medium">
              {more}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}

/** The list the questions sit in, a rule between each. */
export const BLOG_QUESTION_LIST = "divide-y divide-gray-200 text-gray-900 dark:divide-white/10 dark:text-white";
