"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";
import { Loader2, PackagePlus, SendHorizontal } from "lucide-react";

import { getApiErrorMessage } from "@/lib/errors";
import { MESSAGE_MAX } from "@/lib/teamApi";
import { productToken } from "@/lib/teamLinks";
import type { AdminProduct } from "@/types";

import { ProductPicker } from "./ProductPicker";

/** Shown once a message nears the limit. */
const COUNT_FROM = MESSAGE_MAX - 200;
const MAX_HEIGHT = 128;

/**
 * The message box: Enter sends, Shift+Enter starts a new line (and Enter
 * while an IME is still composing does neither). It grows with what is typed,
 * up to a few lines, then scrolls. An admin's box has "Ürün ekle" beside it,
 * which puts a product's link where the caret is; order numbers need nothing
 * — they are found in the text.
 */
export function Composer({
  onSend,
  inputRef,
  canPickProducts,
}: {
  onSend: (body: string) => Promise<void>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  canPickProducts: boolean;
}) {
  const [text, setText] = useState("");
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = text.trim().length > 0 && text.length <= MESSAGE_MAX && !busy;

  function fit(box: HTMLTextAreaElement) {
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, MAX_HEIGHT)}px`;
  }

  async function send() {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(text);
      setText("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.focus();
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Mesaj gönderilemedi."));
    } finally {
      setBusy(false);
    }
  }

  /** The product's token at the caret, spaced from its neighbours. */
  function pick(product: AdminProduct) {
    const box = inputRef.current;
    const at = box ? box.selectionStart : text.length;
    const end = box ? box.selectionEnd : text.length;
    const before = text.slice(0, at);
    const after = text.slice(end);
    const token = `${before && !/\s$/.test(before) ? " " : ""}${productToken(product)}${after.startsWith(" ") ? "" : " "}`;
    const next = `${before}${token}${after}`.slice(0, MESSAGE_MAX);
    setText(next);
    setPicking(false);
    requestAnimationFrame(() => {
      if (!box) return;
      box.focus();
      const caret = Math.min(before.length + token.length, next.length);
      box.setSelectionRange(caret, caret);
      fit(box);
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="relative border-t border-slate-200 p-3 dark:border-white/10">
      {picking && (
        <ProductPicker
          onPick={pick}
          onClose={() => {
            setPicking(false);
            inputRef.current?.focus();
          }}
        />
      )}
      {error && (
        <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2">
        {canPickProducts && (
          <button
            type="button"
            onClick={() => setPicking((p) => !p)}
            aria-expanded={picking}
            aria-label="Ürün ekle"
            title="Ürün ekle"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 ring-1 ring-slate-300 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-400 dark:ring-white/15 dark:hover:bg-white/5 dark:hover:text-white ${
              picking ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white" : ""
            }`}
          >
            <PackagePlus className="h-4 w-4" aria-hidden />
          </button>
        )}
        <label htmlFor="ekip-mesaj" className="sr-only">
          Ekibe mesaj
        </label>
        <textarea
          id="ekip-mesaj"
          ref={inputRef}
          value={text}
          rows={1}
          maxLength={MESSAGE_MAX}
          placeholder="Ekibe yazın…"
          onChange={(e) => {
            setText(e.target.value);
            fit(e.target);
          }}
          onKeyDown={onKeyDown}
          className="block max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-6 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!ready}
          aria-label="Gönder"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizontal className="h-4 w-4 rtl:-scale-x-100" aria-hidden />}
        </button>
      </div>
      <p className="mt-1.5 flex justify-between text-[11px] text-slate-400 dark:text-zinc-500">
        <span>Enter gönderir · Shift+Enter yeni satır</span>
        {text.length >= COUNT_FROM && (
          <span className={text.length >= MESSAGE_MAX ? "text-red-600 dark:text-red-400" : ""}>
            {text.length.toLocaleString("tr-TR")} / {MESSAGE_MAX.toLocaleString("tr-TR")}
          </span>
        )}
      </p>
    </div>
  );
}
