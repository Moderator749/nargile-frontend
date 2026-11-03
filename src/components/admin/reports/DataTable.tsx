"use client";

import { useMemo, useState, type ReactNode } from "react";

import { SortableHeader, type SortState } from "@/components/admin/SortableHeader";

export interface Column<Row> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: Row) => ReactNode;
  /** Sortable when given; null sorts last either way. */
  sortValue?: (row: Row) => number | string | null;
  className?: string;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;
const SKELETON_ROWS = 5;

/**
 * A report's table: the server's order until a header is clicked, then that
 * column's (client side: a report is at most a few hundred rows). While the
 * first answer is on its way the rows are placeholders of the same height.
 */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  loading,
  empty,
  rowClassName,
}: {
  caption: string;
  columns: Column<Row>[];
  rows: Row[] | null;
  rowKey: (row: Row) => string;
  loading: boolean;
  empty: string;
  rowClassName?: (row: Row) => string;
}) {
  const [sort, setSort] = useState<SortState<string>>({ by: null, dir: "asc" });

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort.by);
    if (!rows || !column?.sortValue) return rows;
    const value = column.sortValue;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y), "tr") * dir;
    });
  }, [rows, columns, sort]);

  return (
    <div className={`overflow-x-auto transition-opacity duration-200 ${loading && rows ? "opacity-60" : ""}`} aria-busy={loading}>
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-zinc-500">
            {columns.map((c) =>
              c.sortValue ? (
                <SortableHeader
                  key={c.key}
                  column={c.key}
                  label={c.header}
                  sort={sort}
                  onSort={setSort}
                  align={c.align}
                  className={`${ALIGN[c.align ?? "left"]} ${c.className ?? ""}`}
                />
              ) : (
                <th key={c.key} scope="col" className={`px-3 py-3 ${ALIGN[c.align ?? "left"]} ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {!sorted &&
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <tr key={i} className="h-12">
                <td colSpan={columns.length} className="px-3">
                  <div className="h-4 rounded bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
                </td>
              </tr>
            ))}
          {sorted?.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">
                {empty}
              </td>
            </tr>
          )}
          {sorted?.map((row) => (
            <tr
              key={rowKey(row)}
              className={`h-12 transition-colors duration-150 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] ${rowClassName?.(row) ?? ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2.5 align-middle ${ALIGN[c.align ?? "left"]} ${c.className ?? ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Money and counts line up in tables: monospaced figures. */
export function Figure({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className={`font-mono tabular-nums ${muted ? "text-slate-500 dark:text-zinc-400" : ""}`}>{children}</span>
  );
}

/** A product's code above its name, in one cell. */
export function ProductCell({ code, name, note }: { code: string | null; name: string; note?: ReactNode }) {
  return (
    <div className="min-w-0">
      {code && <p className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">{code}</p>}
      <p className="truncate font-medium" title={name}>
        {name}
      </p>
      {note}
    </div>
  );
}
