"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { ancestorsOf, categoryTree, flattenTree } from "@/lib/categories";
import { foldSearch } from "@/lib/searchFold";
import type { AdminCategory } from "@/types";

interface Option {
  id: number;
  name: string;
  /** The categories above it, "Nargile Takımları › Oduman Nargile"; null for a group. */
  group: string | null;
  /** 0 for a group, 1 for its subcategory, 2 below that. */
  depth: number;
}

/** Groups first, each followed by its subcategories (and theirs), in the menu's order. */
function categoryOptions(categories: AdminCategory[]): Option[] {
  const options: Option[] = flattenTree(categoryTree(categories)).map(({ category, depth }) => ({
    id: category.id,
    name: category.name,
    group: depth ? ancestorsOf(category, categories).map((c) => c.name).join(" › ") : null,
    depth,
  }));
  // A subcategory whose group is gone still gets a line.
  const listed = new Set(options.map((o) => o.id));
  for (const c of categories.filter((x) => !listed.has(x.id))) options.push({ id: c.id, name: c.name, group: null, depth: 0 });
  return options;
}

/** "Nargile Takımları › Oduman Nargile › Oduman Lüleler": a subcategory with its trail, as the closed box shows it. */
const pathOf = (o: Option) => (o.group ? `${o.group} › ${o.name}` : o.name);

/**
 * The order editor's category: type to narrow the menu — the Turkish letters
 * folded, so "nargıle", "NARGİLE" and "nargile" are one — and pick. A
 * subcategory is found by its own name or its group's, so typing a group
 * brings its subcategories along.
 */
export function CategoryCombobox({
  id,
  categories,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  categories: AdminCategory[];
  value: number | null;
  onChange: (id: number) => void;
  disabled?: boolean;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const all = useMemo(() => categoryOptions(categories), [categories]);
  const q = foldSearch(query.trim());
  const options = q ? all.filter((o) => foldSearch(o.name).includes(q) || foldSearch(o.group).includes(q)) : all;
  const chosen = all.find((o) => o.id === value);

  function openList() {
    setQuery("");
    // On the chosen one, so the arrows go on from it.
    setActive(Math.max(0, all.findIndex((o) => o.id === value)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(option: Option) {
    onChange(option.id);
    close();
    input.current?.blur();
  }

  /** The active option kept in view as the arrows move it. */
  function show(i: number) {
    setActive(i);
    list.current?.querySelector(`[data-index="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      if (options.length) show((active + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = options[active];
      if (option) choose(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const optionId = (i: number) => `${listId}-${i}`;

  return (
    <div className="relative min-w-0 sm:w-80">
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? optionId(active) : undefined}
        autoComplete="off"
        disabled={disabled}
        value={open ? query : chosen ? pathOf(chosen) : ""}
        placeholder={open ? (chosen ? pathOf(chosen) : "Kategori ara…") : "Kategori seçin…"}
        onFocus={openList}
        onClick={() => !open && openList()}
        onBlur={close}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-full border border-slate-200 bg-white pe-9 ps-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <ChevronsUpDown className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-slate-400" aria-hidden />
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label="Kategoriler"
          // Keeps the input focused while an option is clicked.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          {options.length === 0 && <li className="px-3 py-2 text-slate-500 dark:text-zinc-400">Eşleşen kategori yok.</li>}
          {options.map((o, i) => (
            <li
              key={o.id}
              id={optionId(i)}
              data-index={i}
              role="option"
              aria-selected={o.id === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
              className={`flex cursor-pointer items-center gap-2 py-2 pe-3 ${q ? "ps-3" : (["ps-3", "ps-7", "ps-11"][o.depth] ?? "ps-11")} ${
                i === active ? "bg-slate-100 dark:bg-white/10" : ""
              } ${o.group ? "" : "font-medium"}`}
            >
              <Check className={`h-4 w-4 shrink-0 ${o.id === value ? "text-red-600" : "invisible"}`} aria-hidden />
              <span className="truncate">
                {/* Narrowed, a subcategory says whose it is. */}
                {q && o.group && <span className="text-slate-400 dark:text-zinc-500">{o.group} › </span>}
                {o.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
