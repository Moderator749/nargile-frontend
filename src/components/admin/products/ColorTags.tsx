"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { sheetInputClass, sheetLabelClass } from "@/components/admin/products/SheetParts";

/**
 * "Renk" as pills: type a colour, press Enter (or comma) to add it. Free labels,
 * not a variant axis — the product is one variant whatever its colours.
 */
export function ColorTags({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (colors: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    setDraft("");
    if (!label) return;
    if (colors.some((c) => c.toLocaleLowerCase("tr") === label.toLocaleLowerCase("tr"))) return;
    onChange([...colors, label]);
  };

  return (
    <div>
      <label htmlFor="sheet-colors" className={sheetLabelClass}>
        Renk
      </label>
      {colors.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {colors.map((color) => (
            <li key={color}>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1 text-xs font-medium text-slate-800 ring-1 ring-inset ring-slate-200 dark:bg-white/10 dark:text-zinc-100 dark:ring-white/15">
                {color}
                <button
                  type="button"
                  onClick={() => onChange(colors.filter((c) => c !== color))}
                  aria-label={`${color} rengini kaldır`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500 dark:text-zinc-400 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <input
        id="sheet-colors"
        value={draft}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Enter adds a colour, it does not submit the sheet
            add(draft);
          } else if (e.key === "Backspace" && !draft && colors.length > 0) {
            onChange(colors.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder="Renk yazıp Enter'a basın"
        aria-describedby="sheet-colors-hint"
        className={sheetInputClass}
      />
      <p id="sheet-colors-hint" className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
        Birden fazla renk ekleyebilirsiniz.
      </p>
    </div>
  );
}
