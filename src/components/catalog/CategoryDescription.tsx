import { ReadMore } from "@/components/ui/ReadMore";
import { getMessages } from "@/lib/i18n/server";
import { catalogMessages } from "@/lib/i18n/messages/catalog";

/**
 * The category's description ("Kategori açıklaması" in the admin, else the
 * shop's written copy), straight under the products: a heading of its own,
 * four lines and "Devamını Oku", all of it in the HTML for search engines.
 * Read from the start of the line like CategoryClosing's text, which follows
 * it when the category has one.
 */
export async function CategoryDescription({ title, html }: { title: string; html: string }) {
  const t = await getMessages(catalogMessages);
  return (
    <section aria-labelledby="category-description-heading" className="mx-auto w-full max-w-4xl px-4 pt-12">
      <h2
        id="category-description-heading"
        className="mb-4 text-balance text-lg font-bold tracking-tight text-gray-900 md:text-xl dark:text-white"
      >
        {t.about(title)}
      </h2>
      <ReadMore
        id="kategori-aciklamasi"
        html={html}
        lines={4}
        nested
        className="text-sm leading-relaxed text-gray-600 md:text-base dark:text-zinc-300"
      />
    </section>
  );
}
