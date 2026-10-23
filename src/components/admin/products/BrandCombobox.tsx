"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";

import { sheetInputClass } from "@/components/admin/products/SheetParts";
import { adminCreateBrand } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { Brand } from "@/types";

const fold = (s: string) => s.trim().toLocaleLowerCase("tr-TR");

type Option = { kind: "none" } | { kind: "brand"; brand: Brand } | { kind: "create"; name: string };

/**
 * The product sheet's brand: type to search the brand list ("Markalar"),
 * pick one, or add the typed name as a new brand on the spot. The product
 * stores the brand's name, which the brand page's search finds it by.
 */
export function BrandCombobox({
  id,
  value,
  brand,
  brands,
  onChange,
  onCreated,
}: {
  id: string;
  /** The stored brand name ("" = none). */
  value: string;
  /** The listed brand `value` means, if any. */
  brand: Brand | undefined;
  brands: Brand[];
  onChange: (name: string) => void;
  /** A brand just added from here, for the caller's list. */
  onCreated: (brand: Brand) => void;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = brand?.name ?? value;
  const options = useMemo<Option[]>(() => {
    const q = fold(query);
    const matches = brands
      .filter((b) => b.is_active || b.id === brand?.id)
      .filter((b) => !q || [b.name, b.slug, b.search_term].some((x) => fold(x).includes(q)));
    const exact = q && brands.some((b) => [b.name, b.slug, b.search_term].some((x) => fold(x) === q));
    return [
      ...(q ? [] : [{ kind: "none" } as const]),
      ...matches.map((b) => ({ kind: "brand", brand: b }) as const),
      ...(q && !exact ? [{ kind: "create", name: query.trim() } as const] : []),
    ];
  }, [brands, brand, query]);

  function openList() {
    setQuery("");
    setActive(0);
    setError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  async function choose(option: Option) {
    if (option.kind === "none") onChange("");
    else if (option.kind === "brand") onChange(option.brand.name);
    else {
      setCreating(true);
      setError(null);
      try {
        const created = await adminCreateBrand({
          name: option.name,
          is_active: true,
          sort_order: Math.max(0, ...brands.map((b) => b.sort_order)) + 10,
        });
        onCreated(created);
        onChange(created.name);
      } catch (err) {
        setError(getApiErrorMessage(err, "Marka eklenemedi."));
        return;
      } finally {
        setCreating(false);
      }
    }
    close();
    input.current?.blur();
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
      setActive((i) => (options.length ? (i + step + options.length) % options.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = options[active];
      if (option && !creating) void choose(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const optionId = (i: number) => `${listId}-${i}`;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={input}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? optionId(active) : undefined}
          autoComplete="off"
          value={open ? query : shown}
          placeholder={open ? shown || "Marka ara veya yeni yaz…" : "Markasız"}
          onFocus={openList}
          onClick={() => !open && openList()}
          onBlur={() => !creating && close()}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`${sheetInputClass} pe-16`}
        />
        <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center gap-1 text-slate-400">
          {creating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          <ChevronsUpDown className="h-4 w-4" aria-hidden />
        </span>
        {!open && value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Markayı kaldır"
            title="Markayı kaldır"
            className="absolute inset-y-0 end-7 my-auto flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          // Keeps the input focused while an option is clicked.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          {options.length === 0 && <li className="px-3 py-2 text-slate-500">Eşleşen marka yok.</li>}
          {options.map((o, i) => {
            const selected = o.kind === "brand" ? o.brand.id === brand?.id : o.kind === "none" && !value;
            return (
              <li
                key={o.kind === "brand" ? o.brand.id : o.kind}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => !creating && void choose(o)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${
                  i === active ? "bg-slate-100 dark:bg-white/10" : ""
                } ${o.kind === "create" ? "border-t border-slate-100 font-medium text-red-700 dark:border-white/10 dark:text-red-400" : ""}`}
              >
                {o.kind === "create" ? (
                  <>
                    <Plus className="h-4 w-4 shrink-0" aria-hidden /> “{o.name}” markasını ekle
                  </>
                ) : (
                  <>
                    <Check className={`h-4 w-4 shrink-0 ${selected ? "text-red-600" : "invisible"}`} aria-hidden />
                    {o.kind === "none" ? (
                      <span className="text-slate-500">Markasız</span>
                    ) : (
                      <span className="truncate">
                        {o.brand.name}
                        {!o.brand.is_active && <span className="text-slate-400"> (pasif)</span>}
                      </span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!open && value && !brand && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">“{value}” marka listesinde yok; aynen kaydedilir.</p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
