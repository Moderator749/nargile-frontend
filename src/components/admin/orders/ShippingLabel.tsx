"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { adminGetHomepage, adminGetOrder, adminShippingIntegrations } from "@/lib/adminApi";
import { encode128 } from "@/lib/code128";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { resolveHomepage } from "@/lib/homepage";
import { carrierName } from "@/lib/tracking";
import type { AdminOrder, HomeFooter } from "@/types";

const PRINT_ROOT = "shipping-label-print";

/** The cargo key as Code 128 bars, scaled to the label's width (no text: it is printed under it). */
function Barcode({ value }: { value: string }) {
  const widths = encode128(value);
  const quiet = 10; // modules of white either side, so a scanner finds the edges
  // Each element's left edge: the widths before it, after the quiet zone.
  const starts = widths.map((_, i) => quiet + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const total = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  return (
    <svg viewBox={`0 0 ${total} 40`} preserveAspectRatio="none" className="h-[18mm] w-full" role="img" aria-label={`Barkod ${value}`}>
      {/* Bars at the even places, spaces (left white) at the odd. */}
      {widths.map((w, i) => (i % 2 === 0 ? <rect key={i} x={starts[i]} y={0} width={w} height={40} fill="#000" /> : null))}
    </svg>
  );
}

function LabelBody({ order, sender, customerCode }: { order: AdminOrder; sender: HomeFooter; customerCode: string | null }) {
  const to = order.shipping_address;
  const receiver = order.receiver_name || to?.full_name || order.customer_name || "—";
  const phone = order.receiver_phone || to?.phone || order.customer_phone || "";
  const carrier = carrierName(order) ?? "Kargo";
  const from = sender.branches[0];
  return (
    <div className="flex h-[150mm] w-[100mm] flex-col border border-black bg-white p-[4mm] font-sans text-[10pt] leading-snug text-black">
      <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-[2mm]">
        <p className="text-[15pt] font-black uppercase tracking-tight">{carrier}</p>
        <p className="text-right text-[8pt]">
          {customerCode && <span className="block">Müşteri Kodu: <strong>{customerCode}</strong></span>}
          <span className="block">{order.shipping_payer === "RECEIVER" ? "ALICI ÖDEMELİ" : "GÖNDERİCİ ÖDEMELİ"}</span>
        </p>
      </div>

      {order.cargo_key ? (
        <div className="border-b border-black py-[2mm] text-center">
          <Barcode value={order.cargo_key} />
          <p className="mt-[1mm] font-mono text-[11pt] font-bold tracking-[0.15em]">{order.cargo_key}</p>
        </div>
      ) : null}

      <div className="border-b border-black py-[2mm]">
        <p className="text-[7pt] font-bold uppercase tracking-widest">Alıcı</p>
        <p className="text-[14pt] font-bold leading-tight">{receiver}</p>
        {to && (
          <p className="mt-[1mm] text-[11pt] leading-tight">
            {to.line}
            <br />
            <strong className="uppercase">
              {[to.district, to.city].filter(Boolean).join(" / ")}
            </strong>
            {to.country && to.country !== "TR" ? ` · ${to.country}` : ""}
          </p>
        )}
        {phone && <p className="mt-[1mm] font-mono text-[11pt]">Tel: {phone}</p>}
        {order.shipping_branch_name && (
          <p className="mt-[1mm] text-[10pt] font-bold uppercase">Şubeden teslim: {order.shipping_branch_name}</p>
        )}
      </div>

      <div className="border-b border-black py-[2mm] text-[9pt]">
        <p className="text-[7pt] font-bold uppercase tracking-widest">Gönderici</p>
        <p className="font-bold">{sender.brand_name}</p>
        {from && <p>{from.address}</p>}
        {sender.phone && <p>Tel: {sender.phone}</p>}
      </div>

      <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-[3mm] pt-[2mm] text-[8pt]">
        <p>
          <span className="block text-[7pt] font-bold uppercase">Sipariş</span>
          <span className="whitespace-nowrap font-mono text-[7.5pt] font-bold">{order.order_number}</span>
        </p>
        <p>
          <span className="block text-[7pt] font-bold uppercase">Tarih</span>
          {formatDate(order.shipped_at ?? new Date().toISOString())}
        </p>
        <p>
          <span className="block text-[7pt] font-bold uppercase">Parça</span>1 / 1
        </p>
      </div>
    </div>
  );
}

/**
 * The shipping label, 100 × 150 mm — the size a thermal label printer takes,
 * and a quarter of an A4 sheet otherwise. For a shipment registered with
 * Yurtiçi's web service it carries our cargo key as a Code 128 barcode, which
 * the branch scans to match the parcel to its registration; any other order
 * gets the same label without it. The sender is the first branch on the
 * storefront's footer ("Ana Sayfa Düzenleme").
 */
export function ShippingLabel({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [sender, setSender] = useState<HomeFooter | null>(null);
  const [customerCode, setCustomerCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      adminGetOrder(orderId, controller.signal),
      adminGetHomepage(controller.signal).catch(() => null),
      adminShippingIntegrations(controller.signal).catch(() => null),
    ])
      .then(([o, home, integrations]) => {
        setOrder(o);
        setSender(resolveHomepage(home?.data).footer);
        setCustomerCode(integrations?.yurtici_customer_code ?? null);
      })
      .catch((err: unknown) => setError(getApiErrorMessage(err, "Sipariş okunamadı.")));
    return () => controller.abort();
  }, [orderId]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!order || !sender) return <p className="text-sm text-slate-500">Etiket hazırlanıyor…</p>;

  const label = <LabelBody order={order} sender={sender} customerCode={customerCode} />;
  return (
    <div className="space-y-4">
      <style>{`
        #${PRINT_ROOT} { display: none; }
        @media print {
          @page { size: 100mm 150mm; margin: 0; }
          :root { color-scheme: light !important; }
          body > *:not(#${PRINT_ROOT}) { display: none !important; }
          #${PRINT_ROOT} { display: block !important; }
          html, body { background: #fff !important; margin: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Kargo Etiketi · {order.order_number}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            100 × 150 mm. Termal yazıcıda bu boyutta, A4&apos;te çeyrek sayfa basılır.
            {!order.cargo_key && " Barkod yalnızca Yurtiçi web servisiyle açılan gönderilerde basılır."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500"
        >
          <Printer className="h-4 w-4" aria-hidden /> Yazdır
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl bg-slate-100 p-6 dark:bg-zinc-800">
        <div className="mx-auto w-fit shadow-lg">{label}</div>
      </div>
      {mounted && createPortal(<div id={PRINT_ROOT}>{label}</div>, document.body)}
    </div>
  );
}
