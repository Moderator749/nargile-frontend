import { sheetTheadClass } from "@/components/admin/orders/SheetBlock";
import { formatDateParts } from "@/lib/format";
import type { HistoryRow } from "@/components/admin/orders/sheetData";

/** `TARİH | SAAT | İŞLEM | AÇIKLAMA EKLE` — the order's lifecycle, oldest first. */
export function OrderSheetHistory({ rows }: { rows: HistoryRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <thead className={sheetTheadClass}>
          <tr>
            <th scope="col" className="px-3 py-2">Tarih</th>
            <th scope="col" className="px-3 py-2">Saat</th>
            <th scope="col" className="px-3 py-2">İşlem</th>
            <th scope="col" className="px-3 py-2">Açıklama Ekle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {rows.map((row) => {
            const stamp = row.at ? formatDateParts(row.at) : null;
            return (
              <tr key={`${row.action}-${row.at ?? ""}`}>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs tabular-nums">{stamp?.date ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs tabular-nums">{stamp?.time ?? "—"}</td>
                <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">{row.action}</td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-zinc-300">{row.note || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
