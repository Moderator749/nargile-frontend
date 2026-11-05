"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Trash2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import {
  PricingCalculator,
  defaultExtras,
  emptySheet,
  newColumn,
  type SheetDraft,
} from "@/components/admin/pricing/PricingCalculator";
import { PricingRecords } from "@/components/admin/pricing/PricingRecords";
import { RecordSearch, matchesSearch } from "@/components/admin/pricing/RecordSearch";
import { adminSelectClass } from "@/components/admin/ContentEditor";
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import {
  deletePricingRecord,
  deletePricingRecords,
  fetchAllPricingRecords,
  type PricingRecord,
  type PricingSegment,
} from "@/lib/pricing";
import { type PricingOrigin, originOf } from "@/lib/pricingOrigin";

type Tab = "calculator" | "records";
/** "Kayıtlar"'s folder filter: every row, the rows in no folder, or one old folder's (by name). */
type Folder = { kind: "all" } | { kind: "none" } | { kind: "named"; name: string };

/** "1250.50" → "1250,5": a stored number back as the admin would type it. */
const typed = (v: string | null) => (v === null ? "" : String(Number(v)).replace(".", ","));

function draftFrom(r: PricingRecord): SheetDraft {
  const s = r.sheet;
  return {
    code: r.product_code,
    name: r.product_name,
    vatMode: s.vat_mode,
    currency: s.currency,
    cost: typed(s.cost),
    columns: s.columns.map((c) => ({
      ...newColumn(c.label, (c.segment as PricingSegment | null) ?? ""),
      percent: typed(c.percent),
      desired: typed(c.desired),
      erpPrice: typed(c.erp_price ?? null),
    })),
    retailPercent: typed(s.retail.percent),
    vatRate: typed(s.retail.vat_rate),
    retailDesired: typed(s.retail.desired),
    retailErpPrice: typed(s.retail.erp_price ?? null),
    appliedPercent: typed(s.applied_percent ?? null),
    // A row keeps its extras; the ones it did not fill (or an older row's) start empty.
    extras: [
      ...(s.extras ?? []).map((c) => ({
        ...newColumn(c.label),
        percent: typed(c.percent),
        desired: typed(c.desired),
        erpPrice: typed(c.erp_price ?? null),
      })),
      ...defaultExtras().slice(s.extras?.length ?? 0),
    ],
    usdRate: typed(s.usd_rate),
    eurRate: typed(s.eur_rate),
    finalTry: typed(s.final_try),
  };
}

/**
 * "Fiyat Hesaplama Cetveli": the two worksheets ("Cetvel") and every row they
 * saved ("Kayıtlar"), one list, newest first. A row is loaded back into its
 * worksheet, changed, and saved over with "Kaydet". The old files ("Dosyalar")
 * are no longer a place to save to: each row keeps its folder as a label, and
 * the list can be filtered by it.
 */
export function AdminPricingView() {
  const [tab, setTab] = useState<Tab>("calculator");
  // Two sheets, as on paper: Cetvel 1 from a cost before VAT, Cetvel 2 after.
  // Each with the saved row it was loaded from, which "Kaydet" writes over.
  type Sheet = { key: number; draft: SheetDraft; origin: PricingOrigin | null };
  const [sheets, setSheets] = useState<{ EXCL: Sheet; INCL: Sheet }>({
    EXCL: { key: 0, draft: emptySheet("EXCL"), origin: null },
    INCL: { key: 0, draft: emptySheet("INCL"), origin: null },
  });
  const [records, setRecords] = useState<PricingRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<Folder>({ kind: "all" });
  // Rows picked: to delete, or for a price catalogue.
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllPricingRecords(controller.signal)
      .then((rows) => {
        setRecords(rows);
        // A deleted row is no longer picked.
        setPicked((current) => new Set([...current].filter((id) => rows.some((r) => r.id === id))));
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Kayıtlar yüklenemedi."));
      });
    return () => controller.abort();
  }, [version]);

  // A saved row goes back into the sheet of its own VAT basis.
  const load = (r: PricingRecord) => {
    const mode = r.sheet.vat_mode;
    setSheets((s) => ({ ...s, [mode]: { key: s[mode].key + 1, draft: draftFrom(r), origin: originOf(r) } }));
    setTab("calculator");
    requestAnimationFrame(() =>
      document.getElementById(`cetvel-${mode}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const remove = async (r: PricingRecord) => {
    const label = r.product_name || r.product_code || "Bu kayıt";
    if (!window.confirm(`“${label}” kaydı silinsin mi? Siteye uygulanmış fiyatlar değişmez.`)) return;
    try {
      await deletePricingRecord(r.id);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Silinemedi."));
    }
  };

  const removePicked = async () => {
    const ids = [...picked];
    if (!ids.length) return;
    if (!window.confirm(`Seçilen ${ids.length} kayıt silinsin mi? Siteye uygulanmış fiyatlar değişmez.`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const n = await deletePricingRecords(ids);
      setPicked(new Set());
      setNotice(`${n} kayıt silindi.`);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Kayıtlar silinemedi."));
    } finally {
      setBusy(false);
    }
  };

  // The old folders the rows carry, for the filter: by name, with their counts.
  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of records ?? []) if (r.file_name) counts.set(r.file_name, (counts.get(r.file_name) ?? 0) + 1);
    return [...counts].sort(([a], [b]) => a.localeCompare(b, "tr"));
  }, [records]);
  const inFolder = (r: PricingRecord) =>
    folder.kind === "all" ? true : folder.kind === "none" ? r.file_name === null : r.file_name === folder.name;
  const shown = records?.filter((r) => inFolder(r) && matchesSearch(query, r.product_code, r.product_name)) ?? null;
  // "Tümünü seç" picks what the filters leave on screen.
  const visibleIds = (shown ?? []).map((r) => r.id);
  const allVisiblePicked = visibleIds.length > 0 && visibleIds.every((id) => picked.has(id));
  const folderValue = folder.kind === "named" ? `named:${folder.name}` : folder.kind;
  const filtered = query.trim() !== "" || folder.kind !== "all";

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "calculator", label: "Cetvel" },
    { value: "records", label: "Kayıtlar", count: records?.length },
  ];

  return (
    <>
      <AdminPageHeader
        title="Fiyat Hesaplama Cetveli"
        description="Maliyetten başlayıp her fiyat sınıfını bir öncekinin üzerine yüzde ekleyerek hesaplayın. “Kaydet” satırı Kayıtlar’a ekler; “Kaydet ve Siteye Uygula” ayrıca ürünün sitedeki fiyatlarını değiştirir."
      />

      <div role="tablist" aria-label="Cetvel görünümü" className="mb-5 flex gap-1 border-b border-slate-200 dark:border-white/10">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.value
                ? "border-red-600 text-slate-900 dark:text-zinc-50"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 text-xs font-normal text-slate-400">({t.count})</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {notice && tab === "records" && (
        <div className="mb-4">
          <Alert variant="success">{notice}</Alert>
        </div>
      )}

      {/* Kept mounted, so moving between the tabs never loses a half-typed row. */}
      <div hidden={tab !== "calculator"} className="space-y-8">
        <div id="cetvel-EXCL" className="scroll-mt-[calc(var(--header-height)+1rem)]">
          <PricingCalculator
            key={`EXCL-${sheets.EXCL.key}`}
            title="Cetvel 1 · KDV hariç maliyet"
            initial={sheets.EXCL.draft}
            origin={sheets.EXCL.origin}
            onSaved={reload}
          />
        </div>
        <div id="cetvel-INCL" className="scroll-mt-[calc(var(--header-height)+1rem)] border-t border-slate-200 pt-6 dark:border-white/10">
          <PricingCalculator
            key={`INCL-${sheets.INCL.key}`}
            title="Cetvel 2 · KDV dahil maliyet"
            initial={sheets.INCL.draft}
            origin={sheets.INCL.origin}
            onSaved={reload}
          />
        </div>
      </div>

      {tab === "records" && (
        <div>
          {records && records.length > 0 && (
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <RecordSearch
                  value={query}
                  onChange={setQuery}
                  placeholder="Ürün kodu veya adı ile ara..."
                  shown={shown?.length ?? 0}
                  total={records.length}
                />
              </div>
              {folders.length > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600 dark:text-zinc-400">Klasör</span>
                  <select
                    value={folderValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFolder(v === "all" ? { kind: "all" } : v === "none" ? { kind: "none" } : { kind: "named", name: v.slice(6) });
                    }}
                    className={`${adminSelectClass} h-10 w-56`}
                  >
                    <option value="all">Tümü</option>
                    <option value="none">Klasörsüz</option>
                    {folders.map(([name, n]) => (
                      <option key={name} value={`named:${name}`}>
                        {name} ({n})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {shown && shown.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-red-600"
                  checked={allVisiblePicked}
                  ref={(el) => {
                    if (el) el.indeterminate = !allVisiblePicked && visibleIds.some((id) => picked.has(id));
                  }}
                  onChange={() =>
                    setPicked((current) => {
                      const next = new Set(current);
                      for (const id of visibleIds) {
                        if (allVisiblePicked) next.delete(id);
                        else next.add(id);
                      }
                      return next;
                    })
                  }
                />
                {filtered ? "Görünenlerin tümünü seç" : "Tümünü seç"}
                <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">({picked.size} seçili)</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {picked.size > 0 && (
                  <button
                    type="button"
                    onClick={() => void removePicked()}
                    disabled={busy}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-sm font-semibold text-red-600 ring-1 ring-red-300 transition-colors hover:bg-red-50 disabled:opacity-50 dark:bg-zinc-900 dark:ring-red-500/40 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Seçilenleri Sil
                    <span className="rounded bg-red-50 px-1.5 text-xs dark:bg-red-500/15">{picked.size}</span>
                  </button>
                )}
                <a
                  href={picked.size ? `/admin/pricing-calculator/katalog?ids=${[...picked].join(",")}` : undefined}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={picked.size === 0}
                  onClick={(e) => picked.size === 0 && e.preventDefault()}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors ${
                    picked.size ? "bg-red-600 hover:bg-red-500" : "cursor-not-allowed bg-red-600/40"
                  }`}
                >
                  <FileText className="h-4 w-4" aria-hidden /> PDF Fiyat Kataloğu Oluştur
                  {picked.size > 0 && <span className="rounded bg-white/20 px-1.5 text-xs">{picked.size}</span>}
                </a>
              </div>
            </div>
          )}
          <PricingRecords
            records={shown}
            empty={
              filtered
                ? "Bu aramaya uyan kayıt yok."
                : "Henüz kayıt yok. Cetvelde “Kaydet” ile ilk kaydınızı ekleyin."
            }
            onLoad={load}
            onDelete={(r) => void remove(r)}
            selected={picked}
            onToggle={(r) =>
              setPicked((s) => {
                const next = new Set(s);
                if (!next.delete(r.id)) next.add(r.id);
                return next;
              })
            }
          />
        </div>
      )}
    </>
  );
}
