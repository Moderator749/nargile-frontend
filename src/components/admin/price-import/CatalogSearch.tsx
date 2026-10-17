"use client";

import { useEffect, useId, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { ProductThumb } from "@/components/admin/price-import/ProductThumb";
import { adminListProducts } from "@/lib/adminApi";
import type { AdminProduct } from "@/types";

/**
 * The whole catalog by code or name, published or not, for a row the matcher
 * could not place: type two letters, pick with the mouse or the arrow keys and
 * Enter. A combobox in the ARIA sense, so a screen reader hears the options.
 */
export function CatalogSearch({
  onPick,
  disabled = false,
  label,
}: {
  onPick: (product: AdminProduct) => void;
  disabled?: boolean;
  /** What the field is for, read out to screen readers. */
  label: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      adminListProducts({ q: term, limit: 8 }, controller.signal)
        .then((rows) => {
          setResults(rows);
          setActive(rows.length ? 0 : -1);
        })
        .catch(() => {
          // Aborted by the next keystroke, or a failed search: the list just stays as it was.
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term]);

  const shown = open && term.length >= 2;
  const pick = (product: AdminProduct) => {
    onPick(product);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={shown}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={shown && active >= 0 ? `${id}-${active}` : undefined}
        autoComplete="off"
        value={query}
        disabled={disabled}
        placeholder="Katalogda ara: kod veya ürün adı"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!shown) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(results.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="block h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/15 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950"
      />
      {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />}
      {shown && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-xs text-slate-500 dark:text-zinc-400">{loading ? "Aranıyor…" : "Ürün bulunamadı."}</li>
          ) : (
            results.map((product, i) => (
              <li
                key={product.id}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: it lands before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(product);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-sky-50 dark:bg-sky-500/10" : ""}`}
              >
                <ProductThumb src={product.image_url} size={40} />
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-semibold">{product.base_code}</span>
                  <span className="block truncate text-xs text-slate-600 dark:text-zinc-300">{product.name}</span>
                  <span className="block text-[11px] text-slate-400">
                    {[product.brand, product.variants.length > 1 ? `${product.variants.length} renk` : null, product.is_published ? null : "yayında değil"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
