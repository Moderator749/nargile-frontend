"use client";

import { Check } from "lucide-react";

import { variantInStock } from "@/lib/variants";
import type { CatalogVariant } from "@/types";

/**
 * "Renk" on the product page: one pill per colour, each its own variant with its
 * own stock. Picking one is picking what goes in the cart.
 *
 * A sold-out colour stays visible and selectable — the visitor has to be able to
 * see that it exists and that it is gone, rather than wonder where it went — and
 * is struck through, with the state also written out for screen readers.
 */
export function ColorPicker({
  variants,
  selectedId,
  onSelect,
  stockPending = false,
}: {
  variants: CatalogVariant[];
  selectedId: string | null;
  onSelect: (variantId: string) => void;
  /** A signed-in buyer's own stock is not in yet: strike nothing through. */
  stockPending?: boolean;
}) {
  return (
    <div className="mt-6">
      <h2 id="color-picker-label" className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Renk
      </h2>
      {/* A radio group: arrow keys move between colours, as for any single choice. */}
      <div role="radiogroup" aria-labelledby="color-picker-label" className="mt-2 flex flex-wrap gap-2">
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const available = stockPending || variantInStock(variant);
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(variant.id)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? "bg-foreground font-medium text-background"
                  : "bg-muted text-foreground ring-1 ring-inset ring-border hover:ring-foreground/30"
              } ${available ? "" : "line-through decoration-from-font"}`}
            >
              {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              {variant.color_name}
              <span className="sr-only">{available ? "" : " — tükendi"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
