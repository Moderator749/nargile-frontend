"use client";

import { useEffect, useId, useState, type FocusEvent, type KeyboardEvent } from "react";
import { Loader2, Search } from "lucide-react";

import { adminListProducts } from "@/lib/adminApi";
import type { AdminProduct } from "@/types";

const MIN_QUERY = 2;
const RESULTS = 8;
const DEBOUNCE_MS = 250;

/**
 * "Ürün ekle": the product search of the panel's catalogue, over the message
 * box. The arrows move through the matches, Enter or a click puts the chosen
 * one into the message, Escape (or leaving it) closes it — without closing
 * the drawer.
 */
export function ProductPicker({ onPick, onClose }: { onPick: (product: AdminProduct) => void; onClose: () => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState<{ query: string; items: AdminProduct[] } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const term = query.trim();
  const searching = term.length >= MIN_QUERY;
  const items = searching && loaded?.query === term ? loaded.items : null;

  useEffect(() => {
    if (term.length < MIN_QUERY) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      adminListProducts({ q: term, limit: RESULTS }, controller.signal)
        .then((found) => {
          setLoaded({ query: term, items: found });
          setFailed(null);
          setActive(0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed("Ürünler aranamadı.");
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (items?.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActive((i) => (i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length);
    } else if (e.key === "Enter" && items?.[active]) {
      e.preventDefault();
      onPick(items[active]);
    }
  }

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose();
  }

  return (
    <div
      onBlur={onBlur}
      className="absolute inset-x-3 bottom-full z-10 mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 start-2.5 my-auto h-4 w-4 text-slate-400" aria-hidden />
        <input
          autoFocus
          role="combobox"
          aria-expanded={!!items?.length}
          aria-controls={`${id}-list`}
          aria-activedescendant={items?.length ? `${id}-${active}` : undefined}
          aria-label="Ürün ara: kod veya ad"
          placeholder="Ürün kodu veya adı…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white ps-8 pe-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-950"
        />
      </div>
      <ul id={`${id}-list`} role="listbox" aria-label="Bulunan ürünler" className="mt-1 max-h-60 overflow-y-auto">
        {!searching && <li className="px-2 py-2 text-xs text-slate-500 dark:text-zinc-400">En az {MIN_QUERY} karakter yazın.</li>}
        {searching && !items && !failed && (
          <li className="flex items-center gap-2 px-2 py-2 text-xs text-slate-500 dark:text-zinc-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Aranıyor…
          </li>
        )}
        {failed && <li className="px-2 py-2 text-xs text-red-600 dark:text-red-400">{failed}</li>}
        {items?.length === 0 && <li className="px-2 py-2 text-xs text-slate-500 dark:text-zinc-400">Eşleşen ürün yok.</li>}
        {items?.map((p, i) => (
          <li
            key={p.id}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === active}
            // Before the input's blur, so the pick is not lost to the picker closing.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(p)}
            onMouseEnter={() => setActive(i)}
            className={`cursor-pointer rounded-lg px-2 py-1.5 ${i === active ? "bg-red-50 dark:bg-red-500/10" : ""}`}
          >
            <p className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">{p.base_code}</p>
            <p className="truncate text-sm">{p.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
