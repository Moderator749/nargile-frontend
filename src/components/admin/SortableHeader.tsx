"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import type { SortDirection } from "@/types";

/** Which column a grid is sorted by, and which way. `null` is the server's own order. */
export interface SortState<Column extends string> {
  by: Column | null;
  dir: SortDirection;
}

/** Click through ascending → descending → the default order. */
export function nextSort<Column extends string>(
  current: SortState<Column>,
  column: Column,
): SortState<Column> {
  if (current.by !== column) return { by: column, dir: "asc" };
  if (current.dir === "asc") return { by: column, dir: "desc" };
  return { by: null, dir: "asc" };
}

/**
 * A column header that sorts. The chevron shows the state: paired when the column
 * is not the active one, single when it is.
 *
 * Generic over the column names, so every admin grid sorts the same way while
 * each one keeps its own set of sortable columns.
 */
export function SortableHeader<Column extends string>({
  column,
  label,
  sort,
  onSort,
  align = "left",
  className = "",
}: {
  column: Column;
  label: string;
  sort: SortState<Column>;
  onSort: (next: SortState<Column>) => void;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const active = sort.by === column;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ChevronUp : ChevronDown;
  const justify = align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(nextSort(sort, column))}
        title={active && sort.dir === "desc" ? "Sıralamayı kaldır" : "Sırala"}
        className={`-mx-1.5 inline-flex w-full items-center gap-1 rounded px-1.5 py-0.5 ${justify} transition-colors duration-200 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 dark:hover:text-zinc-100 ${
          active ? "text-slate-900 dark:text-zinc-100" : ""
        }`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "" : "opacity-40"}`} aria-hidden />
      </button>
    </th>
  );
}
