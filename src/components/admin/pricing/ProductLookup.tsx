"use client";

import { useEffect, useId, useState } from "react";

import { adminListProducts } from "@/lib/adminApi";
import type { AdminProduct } from "@/types";

const field =
  "block h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100";

const compactField =
  "block h-7 w-full border-0 border-b border-transparent bg-transparent px-0 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:outline-none dark:text-zinc-100 dark:hover:border-white/20";

/**
 * "Ürün kodu" or "Ürün adı", with matches from the catalogue as the admin
 * types. Picking one fills both fields; typing freely is allowed too, so a row
 * can be worked out for a product that is not in the catalogue yet (it just
 * cannot be pushed to the site until it is).
 */
export function ProductLookup({
  label,
  value,
  onChange,
  onPick,
  mono = false,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (product: AdminProduct) => void;
  mono?: boolean;
  /** Inside a spreadsheet cell: a small label and a borderless input. */
  compact?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<AdminProduct[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const q = value.trim();
    if (!open || q.length < 2) return;
    const controller = new AbortController();
    const t = setTimeout(() => {
      adminListProducts({ q, limit: 8 }, controller.signal)
        .then((rows) => {
          setMatches(rows);
          setActive(-1);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [value, open]);

  const shown = open && value.trim().length >= 2 ? matches : [];
  const pick = (p: AdminProduct) => {
    onPick(p);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={
          compact
            ? "block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400"
            : "block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400"
        }
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={shown.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!shown.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(shown.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(shown[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`${compact ? compactField : `${field} mt-1.5`} ${mono ? "font-mono" : ""}`}
      />
      {shown.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          // Wider than the cell it hangs from (the code column is narrow): the
          // names read on one line, up to the width of the screen.
          className="absolute left-0 z-20 mt-1 max-h-72 w-max min-w-full max-w-[min(40rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg sm:min-w-[28rem] dark:border-white/10 dark:bg-zinc-900"
        >
          {shown.map((p, i) => (
            <li
              key={p.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              className={`flex cursor-pointer items-baseline gap-2 whitespace-nowrap px-3.5 py-2 text-sm ${i === active ? "bg-red-50 dark:bg-red-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
            >
              <span className="shrink-0 font-mono text-xs text-slate-500 dark:text-zinc-400">{p.base_code}</span>
              <span className="min-w-0 truncate text-slate-900 dark:text-zinc-100" title={p.name}>
                {p.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
