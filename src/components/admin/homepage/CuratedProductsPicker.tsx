"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, Plus, Search, X } from "lucide-react";

import { SortableList } from "@/components/admin/SortableList";
import { adminListProductsPage } from "@/lib/adminApi";
import { fetchProductsByIds } from "@/lib/catalogApi";
import { getApiErrorMessage } from "@/lib/errors";

/** The server's bound (app.schemas.homepage.PICKS_MAX), and the row's sweet spot. */
export const CURATED_MAX = 20;
const CURATED_SUGGESTED = 15;
const DEBOUNCE_MS = 300;
const RESULTS = 8;

/** What a row needs to name a product. */
interface Card {
  id: string;
  name: string;
  code: string | null;
  image: string | null;
}

const inputClass =
  "block h-11 w-full rounded-xl border border-slate-300 bg-white ps-10 pe-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";

function Thumb({ src }: { src: string | null }) {
  return src ? (
    // A thumbnail from the shop's own media; next/image would only resize it again.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain ring-1 ring-slate-200 dark:ring-white/10" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-white/5">
      <ImageOff className="h-4 w-4" aria-hidden />
    </span>
  );
}

/**
 * "Sizin İçin Seçtiklerimiz"'s products: search the catalogue, add up to 20,
 * drag them into the order the row shows them, take any out. Only the ids are
 * stored (the homepage document); the names and photos are looked up here.
 * A picked product that is no longer on the storefront — unpublished or
 * deleted — is listed as such: the row skips it until it is back or removed.
 */
export function CuratedProductsPicker({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const [cards, setCards] = useState<Record<string, Card>>({});
  // Nothing saved: nothing to look up.
  const [resolved, setResolved] = useState(ids.length === 0);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ term: string; cards: (Card & { published: boolean })[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  // The saved picks' names and photos, once: the storefront's own view of them.
  useEffect(() => {
    if (ids.length === 0) return;
    const controller = new AbortController();
    fetchProductsByIds(ids, controller.signal)
      .then((products) => {
        setCards((known) => ({
          ...known,
          ...Object.fromEntries(products.map((p) => [p.id, { id: p.id, name: p.name, code: p.base_code ?? null, image: p.image_url }])),
        }));
      })
      .catch(() => undefined)
      .finally(() => !controller.signal.aborted && setResolved(true));
    return () => controller.abort();
    // Only the saved list on opening; a product added here brings its own card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const term = query.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setError(null);
      adminListProductsPage({ q: term, page: 0, pageSize: RESULTS }, controller.signal)
        .then(({ products }) =>
          setFound({
            term,
            cards: products.map((p) => ({ id: p.id, name: p.name, code: p.base_code, image: p.image_url, published: p.is_published })),
          }),
        )
        .catch((err) => {
          if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Ürünler aranamadı."));
        })
        .finally(() => !controller.signal.aborted && setSearching(false));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const results = found && found.term === term ? found.cards : [];
  const full = ids.length >= CURATED_MAX;

  function add(card: Card) {
    if (full || ids.includes(card.id)) return;
    setCards((known) => ({ ...known, [card.id]: card }));
    onChange([...ids, card.id]);
  }

  const remove = (id: string) => onChange(ids.filter((x) => x !== id));
  const rows = ids.map((id) => ({ id }));

  return (
    <div className="space-y-4">
      <div ref={box} className="relative">
        <label htmlFor="curated-search" className="sr-only">
          Ürün ara
        </label>
        <Search className="pointer-events-none absolute start-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden />
        <input
          id="curated-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={full ? `En fazla ${CURATED_MAX} ürün seçildi` : "Ürün adı veya kodu ile arayın…"}
          disabled={full}
          autoComplete="off"
          className={`${inputClass} disabled:opacity-60`}
        />
        {searching && <Loader2 className="absolute end-3.5 top-3.5 h-4 w-4 animate-spin text-slate-400" aria-hidden />}
        {term.length >= 2 && !full && (results.length > 0 || (found?.term === term && !searching)) && (
          <ul
            aria-label="Arama sonuçları"
            className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-950"
          >
            {results.length === 0 && <li className="px-3 py-3 text-sm text-slate-500 dark:text-zinc-400">Sonuç yok.</li>}
            {results.map((card) => {
              const picked = ids.includes(card.id);
              return (
                <li key={card.id} className="flex items-center gap-3 px-3 py-2">
                  <Thumb src={card.image} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{card.name}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-zinc-400">
                      {card.code}
                      {!card.published && " · Yayında değil"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => add(card)}
                    disabled={picked || !card.published}
                    title={!card.published ? "Yayında olmayan ürün ana sayfada gösterilemez" : undefined}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-50 disabled:cursor-default disabled:text-slate-400 disabled:ring-slate-200 disabled:hover:bg-transparent dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-red-500/10 dark:disabled:text-zinc-500 dark:disabled:ring-white/10"
                  >
                    {picked ? (
                      "Eklendi"
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" aria-hidden /> Ekle
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Seçili ürünler</p>
        <p
          className={`text-xs tabular-nums ${
            ids.length > 0 && ids.length < CURATED_SUGGESTED ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-zinc-400"
          }`}
        >
          {ids.length} / {CURATED_MAX}
          {ids.length > 0 && ids.length < CURATED_SUGGESTED && ` · ${CURATED_SUGGESTED}–${CURATED_MAX} önerilir`}
        </p>
      </div>

      {ids.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
          Henüz ürün seçilmedi. Seçilene kadar bu bölümde öne çıkan kategori ve marka ürünleri kendiliğinden gösterilir.
        </p>
      ) : (
        <SortableList
          items={rows}
          getId={(row) => row.id}
          getLabel={(row) => cards[row.id]?.name ?? "Ürün"}
          onReorder={(next) => onChange(next.map((row) => row.id))}
          className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-white/5 dark:border-white/10"
          renderItem={(row, handle, index) => {
            const card = cards[row.id];
            const missing = resolved && !card;
            return (
              <div className="flex items-center gap-3 bg-white px-2 py-2 dark:bg-zinc-950">
                {handle}
                <span className="w-5 shrink-0 text-center text-xs tabular-nums text-slate-400">{index + 1}</span>
                <Thumb src={card?.image ?? null} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${missing ? "text-slate-500 dark:text-zinc-400" : ""}`}>
                    {card?.name ?? (missing ? "Mağazada görünmüyor" : "…")}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-zinc-400">
                    {missing ? "Yayından kaldırılmış ya da silinmiş; satırda gösterilmez." : card?.code}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label={`Çıkar: ${card?.name ?? "ürün"}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
