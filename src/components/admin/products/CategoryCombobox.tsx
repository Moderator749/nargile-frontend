"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { ancestorsOf, categoryTree, flattenTree } from "@/lib/categories";
import type { TreeCategory } from "@/lib/categoryTree";
import { narrowCategories, type CategoryLine, type CategoryOption } from "@/lib/categoryOptions";
import { foldSearch } from "@/lib/searchFold";

type PickerCategory = TreeCategory & { is_active?: boolean };

/** Groups first, each followed by its subcategories (and theirs), in the menu's order. */
function categoryOptions(categories: readonly PickerCategory[]): CategoryOption[] {
  const options: CategoryOption[] = flattenTree(categoryTree(categories)).map(({ category, depth }) => ({
    id: category.id,
    name: category.name,
    depth,
    ancestorIds: ancestorsOf(category, categories).map((c) => c.id),
    active: category.is_active !== false,
  }));
  // A subcategory whose group is gone still gets a line.
  const listed = new Set(options.map((o) => o.id));
  for (const c of categories.filter((x) => !listed.has(x.id))) {
    options.push({ id: c.id, name: c.name, depth: 0, ancestorIds: [], active: c.is_active !== false });
  }
  return options;
}

const INDENT = ["ps-3", "ps-8", "ps-[3.25rem]"];

/** The name, the typed text in it marked. */
function Marked({ line }: { line: CategoryLine }) {
  const { name } = line.option;
  if (!line.mark) return <>{name}</>;
  const [start, end] = line.mark;
  return (
    <>
      {name.slice(0, start)}
      <mark className="rounded-sm bg-amber-200/70 text-inherit dark:bg-amber-400/30">{name.slice(start, end)}</mark>
      {name.slice(end)}
    </>
  );
}

/**
 * A category picker: the menu's tree, indented, and a box to type in that
 * narrows it as you type — the Turkish letters folded, so "lül", "lul" and
 * "LÜL" are one. Narrowed, the tree stays a tree: a match keeps the groups
 * above it (dimmed, still choosable), and typing a group brings its shelves.
 * The arrows (and Home/End) move, Enter chooses, Escape closes.
 *
 * `all` adds a first line that chooses no category ("Tüm kategoriler", for a
 * filter); `value` null then shows it. Closed, the box shows the chosen
 * category's trail ("Yedek Parça › Nargile Şişeleri"), or with `closedName`
 * its name alone (the trail in its tooltip), where a toolbar has little room.
 */
export function CategoryCombobox({
  id,
  categories,
  value,
  onChange,
  all,
  closedName = false,
  disabled = false,
  className = "sm:w-80",
}: {
  id: string;
  categories: readonly PickerCategory[];
  value: number | null;
  onChange: (id: number) => void;
  all?: { label: string; onChoose: () => void };
  closedName?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const options = useMemo(() => categoryOptions(categories), [categories]);
  const paths = useMemo(() => {
    const names = new Map(options.map((o) => [o.id, o.name]));
    return new Map(options.map((o) => [o.id, [...o.ancestorIds.map((a) => names.get(a)), o.name].join(" › ")]));
  }, [options]);
  const lines = narrowCategories(options, query, foldSearch);
  // "Tüm kategoriler" heads the list while nothing is typed.
  const withAll = !!all && !query.trim();
  const count = lines.length + (withAll ? 1 : 0);
  const chosen = options.find((o) => o.id === value);
  const chosenPath = chosen ? (paths.get(chosen.id) ?? chosen.name) : undefined;
  const closedText = chosen ? (closedName ? chosen.name : chosenPath!) : (all?.label ?? "");

  function openList() {
    setQuery("");
    // On the chosen one, so the arrows go on from it.
    const at = options.findIndex((o) => o.id === value);
    setActive(at >= 0 ? at + (all ? 1 : 0) : 0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function choose(index: number) {
    if (withAll && index === 0) all.onChoose();
    else {
      const line = lines[index - (withAll ? 1 : 0)];
      if (!line) return;
      onChange(line.option.id);
    }
    close();
    input.current?.blur();
  }

  /** The active line kept in view as the keys move it. */
  function show(i: number) {
    setActive(i);
    list.current?.querySelector(`[data-index="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      e.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (count) show((active + (e.key === "ArrowDown" ? 1 : -1) + count) % count);
    } else if ((e.key === "Home" || e.key === "End") && count) {
      e.preventDefault();
      show(e.key === "Home" ? 0 : count - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const optionId = (i: number) => `${listId}-${i}`;
  const lineClass = (i: number) =>
    `flex cursor-pointer items-center gap-2 py-2 pe-3 transition-colors duration-150 ${i === active ? "bg-slate-100 dark:bg-white/10" : ""}`;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <input
        ref={input}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && count ? optionId(active) : undefined}
        autoComplete="off"
        title={open ? undefined : chosenPath}
        disabled={disabled}
        value={open ? query : closedText}
        placeholder={open ? closedText || "Kategori ara…" : "Kategori seçin…"}
        onFocus={openList}
        onClick={() => !open && openList()}
        onBlur={close}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="h-10 w-full truncate rounded-full border border-slate-200 bg-white pe-9 ps-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 disabled:opacity-60 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <ChevronsUpDown className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-slate-400" aria-hidden />
      {/* How many lines the typing left, for a screen reader. */}
      <span className="sr-only" aria-live="polite">
        {open && query.trim() ? `${lines.filter((l) => l.kind !== "context").length} kategori` : ""}
      </span>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label="Kategoriler"
          // Keeps the input focused while a line is clicked.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-30 mt-1 max-h-96 w-full min-w-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          {count === 0 && <li className="px-3 py-2 text-slate-500 dark:text-zinc-400">Eşleşen kategori yok.</li>}
          {withAll && (
            <li
              id={optionId(0)}
              data-index={0}
              role="option"
              aria-selected={value === null}
              onMouseEnter={() => setActive(0)}
              onClick={() => choose(0)}
              className={`${lineClass(0)} border-b border-slate-100 ps-3 font-medium dark:border-white/5`}
            >
              <Check className={`h-4 w-4 shrink-0 ${value === null ? "text-red-600" : "invisible"}`} aria-hidden />
              {all.label}
            </li>
          )}
          {lines.map((line, n) => {
            const i = n + (withAll ? 1 : 0);
            const { option } = line;
            return (
              <li
                key={option.id}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={option.id === value}
                title={paths.get(option.id)}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`${lineClass(i)} ${INDENT[option.depth] ?? INDENT[2]} ${option.depth === 0 ? "font-medium" : ""} ${
                  line.kind === "context" ? "text-slate-400 dark:text-zinc-500" : ""
                }`}
              >
                <Check className={`h-4 w-4 shrink-0 ${option.id === value ? "text-red-600" : "invisible"}`} aria-hidden />
                <span className="min-w-0 truncate">
                  <Marked line={line} />
                </span>
                {!option.active && (
                  <span className="ms-auto shrink-0 rounded bg-slate-100 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-zinc-400">
                    pasif
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
