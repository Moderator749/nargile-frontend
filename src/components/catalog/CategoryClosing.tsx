import { ReadMore } from "@/components/ui/ReadMore";

/**
 * A category's own passage at the foot of its page, set like the homepage's
 * "Alt SEO Metni" (SeoIntro): a centred heading over the
 * text, its first lines shown and the rest a "Devamını Oku" away — all of it
 * in the HTML for search engines. The text itself reads from the start of the
 * line: a buying guide's lists and subheadings, centred, leave their bullets
 * stranded at the margin.
 */
export function CategoryClosing({ title, html }: { title: string; html: string | null }) {
  return (
    <section aria-labelledby="category-closing-heading" className="mx-auto max-w-4xl bg-transparent px-4 py-16 text-center">
      <h2
        id="category-closing-heading"
        className="mb-6 text-balance text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl dark:text-white"
      >
        {title}
      </h2>
      {html && (
        <ReadMore
          id="category-closing-text"
          html={html}
          lines={4}
          nested
          className="text-start text-sm leading-relaxed text-gray-600 md:text-base dark:text-zinc-400"
        />
      )}
    </section>
  );
}
