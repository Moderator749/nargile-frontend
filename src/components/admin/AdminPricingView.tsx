"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, FileText, Folder, Trash2 } from "lucide-react";

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
import { Alert } from "@/components/ui/Alert";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateParts } from "@/lib/format";
import {
  deletePricingFile,
  deletePricingRecord,
  fetchPricingFiles,
  fetchPricingRecords,
  type PricingFile,
  type PricingRecord,
  type PricingSegment,
} from "@/lib/pricing";

type Tab = "calculator" | "drafts" | "files";

/** "13.10.2026 17:05": when a file was saved, at a glance. */
const stamp = (iso: string) => {
  const { date, time } = formatDateParts(iso);
  return `${date} ${time}`;
};

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
 * "Fiyat Hesaplama Cetveli": the calculator, the drafts it saved ("Taslaklar"),
 * and the named files ("Dosyalar"). A saved row can be loaded back into the
 * calculator, changed, and saved again as a new row.
 */
export function AdminPricingView() {
  const [tab, setTab] = useState<Tab>("calculator");
  // Two sheets, as on paper: Cetvel 1 from a cost before VAT, Cetvel 2 after.
  const [sheets, setSheets] = useState<{ EXCL: { key: number; draft: SheetDraft }; INCL: { key: number; draft: SheetDraft } }>({
    EXCL: { key: 0, draft: emptySheet("EXCL") },
    INCL: { key: 0, draft: emptySheet("INCL") },
  });
  const [files, setFiles] = useState<PricingFile[]>([]);
  const [drafts, setDrafts] = useState<PricingRecord[] | null>(null);
  const [openFile, setOpenFile] = useState<PricingFile | null>(null);
  const [fileRows, setFileRows] = useState<PricingRecord[] | null>(null);
  // Rows of the open file picked for a price catalogue.
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  // Each list's own filter: the drafts, the files by name, the open file's rows.
  const [draftQuery, setDraftQuery] = useState("");
  const [fileQuery, setFileQuery] = useState("");
  const [rowQuery, setRowQuery] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchPricingFiles(controller.signal), fetchPricingRecords(null, controller.signal)])
      .then(([f, d]) => {
        setFiles(f);
        setDrafts(d);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Kayıtlar yüklenemedi."));
      });
    return () => controller.abort();
  }, [version]);

  useEffect(() => {
    if (!openFile) return;
    const controller = new AbortController();
    fetchPricingRecords(openFile.id, controller.signal)
      .then(setFileRows)
      .catch(() => {});
    return () => controller.abort();
  }, [openFile, version]);

  // A saved row goes back into the sheet of its own VAT basis.
  const load = (r: PricingRecord) => {
    const mode = r.sheet.vat_mode;
    setSheets((s) => ({ ...s, [mode]: { key: s[mode].key + 1, draft: draftFrom(r) } }));
    setTab("calculator");
    requestAnimationFrame(() =>
      document.getElementById(`cetvel-${mode}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const remove = async (r: PricingRecord) => {
    if (!window.confirm("Bu kayıt silinsin mi? Siteye uygulanmış fiyatlar değişmez.")) return;
    try {
      await deletePricingRecord(r.id);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Silinemedi."));
    }
  };
  const removeFile = async (f: PricingFile) => {
    if (!window.confirm(`“${f.name}” dosyası ve içindeki ${f.record_count} kayıt silinsin mi? Siteye uygulanmış fiyatlar değişmez.`)) return;
    try {
      await deletePricingFile(f.id);
      setOpenFile(null);
      reload();
    } catch (err) {
      setError(getApiErrorMessage(err, "Silinemedi."));
    }
  };

  const byProduct = (query: string) => (r: PricingRecord) => matchesSearch(query, r.product_code, r.product_name);
  const shownDrafts = drafts?.filter(byProduct(draftQuery)) ?? null;
  const shownFiles = files.filter((f) => matchesSearch(fileQuery, f.name));
  const shownRows = fileRows?.filter(byProduct(rowQuery)) ?? null;
  // "Tümünü seç" picks what the filter leaves on screen.
  const visibleIds = (shownRows ?? []).map((r) => r.id);
  const allVisiblePicked = visibleIds.length > 0 && visibleIds.every((id) => picked.has(id));

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "calculator", label: "Cetvel" },
    { value: "drafts", label: "Taslaklar", count: drafts?.length },
    { value: "files", label: "Dosyalar", count: files.length },
  ];

  return (
    <>
      <AdminPageHeader
        title="Fiyat Hesaplama Cetveli"
        description="Maliyetten başlayıp her fiyat sınıfını bir öncekinin üzerine yüzde ekleyerek hesaplayın; satırı taslak ya da dosya olarak saklayın, isterseniz ürünün sitedeki fiyatlarına tek tıkla uygulayın."
      />

      <div role="tablist" aria-label="Cetvel görünümü" className="mb-5 flex gap-1 border-b border-slate-200 dark:border-white/10">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={tab === t.value}
            onClick={() => {
              setTab(t.value);
              if (t.value !== "files") setOpenFile(null);
            }}
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

      {/* Kept mounted, so moving between the tabs never loses a half-typed row. */}
      <div hidden={tab !== "calculator"} className="space-y-8">
        <div id="cetvel-EXCL" className="scroll-mt-[calc(var(--header-height)+1rem)]">
          <PricingCalculator
            key={`EXCL-${sheets.EXCL.key}`}
            title="Cetvel 1 · KDV hariç maliyet"
            initial={sheets.EXCL.draft}
            files={files}
            onSaved={reload}
          />
        </div>
        <div id="cetvel-INCL" className="scroll-mt-[calc(var(--header-height)+1rem)] border-t border-slate-200 pt-6 dark:border-white/10">
          <PricingCalculator
            key={`INCL-${sheets.INCL.key}`}
            title="Cetvel 2 · KDV dahil maliyet"
            initial={sheets.INCL.draft}
            files={files}
            onSaved={reload}
          />
        </div>
      </div>

      {tab === "drafts" && (
        <>
          {drafts && drafts.length > 0 && (
            <RecordSearch
              value={draftQuery}
              onChange={setDraftQuery}
              placeholder="Ürün kodu veya adı ile ara..."
              shown={shownDrafts?.length ?? 0}
              total={drafts.length}
            />
          )}
          <PricingRecords
            records={shownDrafts}
            empty={draftQuery.trim() ? `“${draftQuery.trim()}” ile eşleşen taslak yok.` : "Henüz taslak yok. Cetvelde “Taslak olarak kaydet” ile eklenir."}
            onLoad={load}
            onDelete={(r) => void remove(r)}
          />
        </>
      )}

      {tab === "files" &&
        (openFile ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOpenFile(null)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden /> Dosyalar
              </button>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Folder className="h-5 w-5 text-amber-500" aria-hidden /> {openFile.name}
                <span className="font-mono text-xs font-normal text-slate-500 dark:text-zinc-400">
                  son kayıt {stamp(openFile.updated_at)}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => void removeFile(openFile)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Dosyayı sil
              </button>
            </div>
            {fileRows && fileRows.length > 0 && (
              <RecordSearch
                value={rowQuery}
                onChange={setRowQuery}
                placeholder="Ürün kodu veya adı ile ara..."
                shown={shownRows?.length ?? 0}
                total={fileRows.length}
              />
            )}
            {fileRows && fileRows.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-red-600"
                    checked={allVisiblePicked}
                    disabled={visibleIds.length === 0}
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
                  {rowQuery.trim() ? "Görünenlerin tümünü seç" : "Tümünü seç"}
                  <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">
                    ({picked.size} / {fileRows.length} seçili)
                  </span>
                </label>
                <a
                  href={
                    picked.size
                      ? `/admin/pricing-calculator/katalog?file=${openFile.id}&ids=${[...picked].join(",")}`
                      : undefined
                  }
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
            )}
            <PricingRecords
              records={shownRows}
              empty={rowQuery.trim() ? `“${rowQuery.trim()}” ile eşleşen kayıt yok.` : "Bu dosyada kayıt yok."}
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
        ) : files.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
            Henüz dosya yok. Cetvelde “Dosyaya kaydet” ile ilk dosyanızı oluşturun.
          </p>
        ) : (
          <>
            <RecordSearch value={fileQuery} onChange={setFileQuery} placeholder="Dosya adıyla ara..." shown={shownFiles.length} total={files.length} />
            {shownFiles.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
                “{fileQuery.trim()}” ile eşleşen dosya yok.
              </p>
            )}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shownFiles.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFileRows(null);
                      setPicked(new Set());
                      setRowQuery("");
                      setOpenFile(f);
                    }}
                    className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-red-300 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-red-500/40"
                  >
                    <Folder className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{f.name}</span>
                        <time
                          dateTime={f.updated_at}
                          className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-slate-700 dark:bg-white/10 dark:text-zinc-200"
                          title="Son kayıt"
                        >
                          {stamp(f.updated_at)}
                        </time>
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-zinc-400">
                        {f.record_count} kayıt · oluşturuldu {stamp(f.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ))}
    </>
  );
}
