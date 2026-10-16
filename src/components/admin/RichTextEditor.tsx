"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";

import { toHtml } from "@/lib/richText";

/**
 * The panel's rich-text editor (TipTap): product and category descriptions,
 * the legal texts, the notes.
 *
 * It offers exactly what the API keeps (saas_backend/app/core/rich_text.py):
 * paragraphs and line breaks, bold, italic, underline, two heading levels,
 * bulleted and numbered lists, and links. Anything else — pasted styles,
 * images, scripts — is dropped by the editor's own schema and again by the
 * server, which is the one that counts.
 *
 * Admin-only: it lives under components/admin, which no storefront page
 * imports, so the editor's code never reaches a shopper's browser.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  minHeight = "10rem",
  labelledBy,
}: {
  id: string;
  /** The stored HTML (plain text from before the editor is shown as paragraphs). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** The visible label's id. */
  labelledBy?: string;
}) {
  const editor = useEditor({
    // Rendered in the browser only: the panel is client-side, and rendering on
    // the server would mismatch on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // The page's <h1> is the product or category name.
        heading: { levels: [2, 3] },
        // Not kept by the API, so not offered.
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          // What the server writes on every link, so a reloaded text is not
          // "changed" by the editor adding its own.
          HTMLAttributes: { rel: "noopener noreferrer", target: null },
        },
      }),
    ],
    content: toHtml(value),
    editorProps: {
      attributes: {
        id,
        class: "rich-text min-w-0 px-3 py-2 text-sm text-slate-900 outline-none dark:text-zinc-100",
        style: `min-height: ${minHeight}`,
        role: "textbox",
        "aria-multiline": "true",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        ...(placeholder ? { "aria-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // A value replaced from outside (another product loaded, a save's answer):
  // put it in the editor, unless it is what the editor already holds.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = toHtml(value);
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (next !== current) editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900">
      {editor && <Toolbar editor={editor} id={id} />}
      <div className="relative">
        {editor?.isEmpty && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400" aria-hidden>
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, id }: { editor: Editor; id: string }) {
  // Re-rendered on selection changes only for what the buttons show.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linking, setLinking] = useState<string | null>(null);
  const chain = () => editor.chain().focus();

  function applyLink() {
    const href = (linking ?? "").trim();
    if (!href) chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href }).run();
    setLinking(null);
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
      <div role="toolbar" aria-label="Metin biçimi" className="flex flex-wrap items-center gap-0.5 p-1">
        <ToolButton label="Kalın" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="İtalik" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Altı çizili" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline className="h-4 w-4" aria-hidden />
        </ToolButton>
        <Divider />
        <ToolButton label="Başlık" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Alt başlık" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <Divider />
        <ToolButton label="Madde işaretli liste" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Numaralı liste" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" aria-hidden />
        </ToolButton>
        <Divider />
        <ToolButton label="Bağlantı ekle" active={state.link} onClick={() => setLinking(state.href || "https://")}>
          <Link2 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton
          label="Bağlantıyı kaldır"
          disabled={!state.link}
          onClick={() => chain().extendMarkRange("link").unsetLink().run()}
        >
          <Link2Off className="h-4 w-4" aria-hidden />
        </ToolButton>
        <Divider />
        <ToolButton label="Geri al" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 className="h-4 w-4" aria-hidden />
        </ToolButton>
        <ToolButton label="Yinele" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 className="h-4 w-4" aria-hidden />
        </ToolButton>
      </div>
      {linking !== null && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-2 dark:border-white/10">
          <label htmlFor={`${id}-link`} className="sr-only">
            Bağlantı adresi
          </label>
          <input
            id={`${id}-link`}
            type="url"
            value={linking}
            onChange={(e) => setLinking(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") setLinking(null);
            }}
            placeholder="https://… ya da /catalog/luleler"
            autoFocus
            className="h-8 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
          <button type="button" onClick={applyLink} className="h-8 rounded-md bg-slate-900 px-3 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
            Uygula
          </button>
          <button type="button" onClick={() => setLinking(null)} className="h-8 rounded-md px-2 text-xs text-slate-600 dark:text-zinc-400">
            Vazgeç
          </button>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection: a mousedown on the button would move focus.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-white/10" aria-hidden />;
}
