"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { ReadMore } from "@/components/ui/ReadMore";
import { productMessages } from "@/lib/i18n/messages/product";

/**
 * The product description under the buy box: the first three lines show
 * straight away, the rest is one click behind "Devamını Oku" — so "Sepete
 * Ekle" stays where the eye is, and the whole text is still in the page for
 * search engines (see ReadMore). The text is the editor's HTML.
 */
export function ProductDescription({ html }: { html: string }) {
  const t = useMessages(productMessages);
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{t.description}</h2>
      {/* Under this section's own <h2>: the text's headings sit one level below it. */}
      <ReadMore id="urun-aciklamasi" html={html} nested className="mt-3 text-sm text-muted-foreground" />
    </section>
  );
}
