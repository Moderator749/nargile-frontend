"use client";

import { useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Loader2 } from "lucide-react";

import { BLOG_QUESTION_LIST, BlogQuestionItem } from "@/components/blog/BlogQuestionItem";
import Link from "@/components/i18n/Link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { Dialog } from "@/components/ui/Dialog";
import type { BlogQuestion } from "@/lib/blogQuestions";
import type { Locale } from "@/lib/i18n/config";
import { blogMessages } from "@/lib/i18n/messages/info";

/** The questions, fetched once and only when wanted: the footer is on every page, they are not. */
let loading: Promise<typeof import("@/lib/blogQuestions")> | null = null;
const loadQuestions = () => (loading ??= import("@/lib/blogQuestions"));

/**
 * The footer blog column's "Tüm yazıları gör": every question of the blog in
 * a dialog over the page, one answer open at a time, as on sultannargile.com.
 *
 * It is a real link to /blog, so a crawler, a middle click or a ctrl-click
 * still gets the page; a plain click opens the dialog instead and keeps the
 * visitor where they were. The questions load when the pointer comes near
 * the button, so by the click they are usually there.
 *
 * The dialog is put under <body>, not where the button is: the footer is
 * dark whatever the theme (its `dark` class), and inside it the dialog took
 * that on too — black on a light page. Out of it, it follows the page's
 * theme like every other dialog. Mounted only while open, which is only
 * ever after a click, so there is no server render to match.
 */
export function BlogQuestionsButton({ href, label, className }: { href: string; label: string; className: string }) {
  const locale = useLocale();
  const m = useMessages(blogMessages);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BlogQuestion[] | null>(null);
  const [itemsLocale, setItemsLocale] = useState<Locale | null>(null);

  function load() {
    void loadQuestions().then((module) => {
      setItems(module.blogQuestions(locale));
      setItemsLocale(locale);
    });
  }

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (itemsLocale !== locale) load();
    setOpen(true);
  }

  const close = () => setOpen(false);
  const ready = items && itemsLocale === locale;

  return (
    <>
      <Link
        href={href}
        onClick={onClick}
        onPointerEnter={load}
        onFocus={load}
        aria-haspopup="dialog"
        className={className}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
      </Link>
      {open &&
        createPortal(
          <Dialog open={open} onClose={close} title={m.questionsTitle}>
            <p className="text-sm text-slate-600 dark:text-neutral-300">{m.questionsIntro}</p>
            {ready ? (
              <div className={`mt-2 ${BLOG_QUESTION_LIST}`}>
                {items.map((item) => (
                  <BlogQuestionItem key={item.id} item={item} more={m.readArticle} group="blog-dialog" onNavigate={close} />
                ))}
              </div>
            ) : (
              <p className="flex justify-center py-12" role="status" aria-label={m.loading}>
                <Loader2 className="h-6 w-6 animate-spin text-red-600" aria-hidden />
              </p>
            )}
            <Link
              href={href}
              onClick={close}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              {m.openBlog}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          </Dialog>,
          document.body,
        )}
    </>
  );
}
