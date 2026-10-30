import { Van } from "lucide-react";

import { trackingHref } from "@/lib/tracking";
import type { AdminOrder } from "@/types";

/**
 * Where an order that has left stands: its carrier mark while on the way (the
 * tracking code, the branch still to scan it, the shop's own İstanbul run),
 * then delivered — by the carrier or at the shop. Fulfillment, not money: the
 * payment status is the ÖDEME column's.
 */
export function FulfillmentMark({ o }: { o: AdminOrder }) {
  if (o.status === "DELIVERED")
    return (
      <span className="whitespace-nowrap text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {o.carrier === "STORE" ? "Mağazadan teslim" : "Teslim edildi"}
      </span>
    );
  if (o.shipping_method === "ISTANBUL_FREE")
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-sky-700 dark:text-sky-300">
        <Van className="h-3.5 w-3.5 shrink-0" aria-hidden /> İstanbul içi
      </span>
    );
  if (o.tracking_code) {
    const href = trackingHref(o);
    return (
      <span className="block min-w-0">
        <span className="block text-[11px] text-slate-500 dark:text-zinc-400">Kargoda</span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-mono text-xs text-red-700 hover:underline dark:text-red-400"
            title={`${o.tracking_code} · kargo takip sayfası`}
          >
            {o.tracking_code}
          </a>
        ) : (
          <span className="block truncate font-mono text-xs" title={o.tracking_code}>
            {o.tracking_code}
          </span>
        )}
      </span>
    );
  }
  if (o.cargo_key)
    return (
      <span className="whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400" title={`Kargo anahtarı ${o.cargo_key}`}>
        Şubeye teslim bekleniyor
      </span>
    );
  return <span className="whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400">Kargoya verildi</span>;
}
