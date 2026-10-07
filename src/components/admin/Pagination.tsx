import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** 0-based current page. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  label: string;
}

/** Page numbers to show: first, last, and a window around the current page, with gaps. */
function pageItems(page: number, count: number): (number | "gap")[] {
  const keep = new Set([0, count - 1, page - 1, page, page + 1]);
  const items: (number | "gap")[] = [];
  for (let i = 0; i < count; i++) {
    if (keep.has(i)) items.push(i);
    else if (items[items.length - 1] !== "gap") items.push("gap");
  }
  return items;
}

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40";

/** `‹ 1 … 4 5 6 … 12 ›` page controls. */
export function Pagination({ page, pageCount, onChange, label }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Önceki sayfa"
        className={`${btn} text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {pageItems(page, pageCount).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-slate-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`Sayfa ${item + 1}`}
            className={`${btn} ${
              item === page
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
            }`}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="Sonraki sayfa"
        className={`${btn} text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
