import { formatMoney } from "@/lib/format";
import { sheetTheadClass } from "@/components/admin/orders/SheetBlock";
import type { AdminOrderItem } from "@/types";

/** `ÜRÜN KODU | ÜRÜN ADI | MİKTAR | FİYAT | TUTAR`, as on the Excel form. */
export function OrderSheetLines({ items }: { items: AdminOrderItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead className={sheetTheadClass}>
          <tr>
            <th scope="col" className="px-3 py-2">Ürün Kodu</th>
            <th scope="col" className="px-3 py-2">Ürün Adı</th>
            <th scope="col" className="px-3 py-2 text-center">Miktar</th>
            <th scope="col" className="px-3 py-2 text-right">Fiyat</th>
            <th scope="col" className="px-3 py-2 text-right">Tutar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-2 font-mono text-xs">{item.product_code ?? item.sku ?? "—"}</td>
              <td className="px-3 py-2">
                {item.product_name ?? <span className="text-slate-500 dark:text-zinc-400">Katalogdan kaldırılmış ürün</span>}
                {item.sku && item.product_code && item.sku !== item.product_code && (
                  <span className="block font-mono text-[11px] text-slate-500 dark:text-zinc-400">{item.sku}</span>
                )}
              </td>
              <td className="px-3 py-2 text-center font-mono tabular-nums">{item.quantity}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">{formatMoney(item.unit_price)}</td>
              <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">{formatMoney(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
