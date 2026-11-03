"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";

import { getApiErrorMessage } from "@/lib/errors";
import { downloadReport, type ReportName } from "@/lib/reportsApi";

/** "Excel'e Aktar": the table as the panel shows it, with the same filters. */
export function ExportButton({ report, params }: { report: ReportName; params: Record<string, string | number | boolean> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await downloadReport(report, params);
    } catch (err) {
      setError(getApiErrorMessage(err, "Excel dosyası hazırlanamadı."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={save}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300 transition-colors duration-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60 dark:text-emerald-300 dark:ring-emerald-500/40 dark:hover:bg-emerald-500/10"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileSpreadsheet className="h-4 w-4" aria-hidden />}
        Excel&apos;e Aktar
      </button>
      {error && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
