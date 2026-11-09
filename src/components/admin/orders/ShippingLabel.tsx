"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { adminGetHomepage, adminGetOrder, adminShippingIntegrations } from "@/lib/adminApi";
import { encode128 } from "@/lib/code128";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { resolveHomepage } from "@/lib/homepage";
import { QUADRANTS, cutEdges, sheetsOf, type Quadrant, type Slot } from "@/lib/labelSheet";
import { carrierName } from "@/lib/tracking";
import type { AdminOrder, HomeFooter } from "@/types";

const PRINT_ROOT = "shipping-label-print";
/** The paper last printed on, kept in this browser only. */
const PAPER_KEY = "shipping-label-paper";
/** Orders read at a time for a batch: the server is small. */
const FETCH_AT_ONCE = 4;

/** A4 sheets of four (scissors), or a thermal printer's own 100 × 150 mm labels. */
type Paper = "A4" | "THERMAL";

/** A previewed page lifted off the grey, as paper. */
const paperShadow = "shadow-lg ring-1 ring-black/5";

const LABEL_SIZE: Record<Paper, string> = {
  // A quarter of A4 is 105 × 148.5 mm: 5 mm off the paper's edges, a little more to the cut line.
  A4: "h-[140mm] w-[98mm]",
  THERMAL: "h-[150mm] w-[100mm]",
};

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

interface LabelData {
  order: AdminOrder;
  sender: HomeFooter;
  customerCode: string | null;
  paper: Paper;
}

function LabelBody({ order, sender, customerCode, paper }: LabelData) {
  const to = order.shipping_address;
  const receiver = order.receiver_name || to?.full_name || order.customer_name || "—";
  const phone = order.receiver_phone || to?.phone || order.customer_phone || "";
  const carrier = carrierName(order) ?? "Kargo";
  const from = sender.branches[0];
  return (
    <div className={`flex ${LABEL_SIZE[paper]} shrink-0 flex-col overflow-hidden border border-black bg-white p-[4mm] font-sans text-[10pt] leading-snug text-black`}>
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
 * One A4 sheet, its quarters 105 × 148.5 mm. Each label sits in its quarter's
 * outer corner, 5 mm off the paper's edges (the top left one at 5 mm / 5 mm),
 * so a printer's unprintable margin never clips it; dashed guides run along
 * the page's middle lines on the label's sides, where the scissors go.
 */
function A4Sheet({ slots, render, preview }: { slots: Slot<AdminOrder>[]; render: (o: AdminOrder) => ReactNode; preview: boolean }) {
  return (
    <div className={`label-page grid h-[297mm] w-[210mm] grid-cols-[105mm_105mm] grid-rows-[148.5mm_148.5mm] overflow-hidden bg-white ${preview ? paperShadow : ""}`}>
      {slots.map((slot, i) => {
        const q = (i + 1) as Quadrant;
        const left = q === 1 || q === 3;
        const top = q === 1 || q === 2;
        const cut = cutEdges(q);
        return (
          <div
            key={q}
            className={`relative flex ${left ? "justify-start pl-[5mm]" : "justify-end pr-[5mm]"} ${top ? "items-start pt-[5mm]" : "items-end pb-[5mm]"}`}
          >
            {slot && slot !== "used" && (
              <>
                {render(slot.label)}
                {cut.right && <span className="absolute inset-y-0 right-0 border-r border-dashed border-neutral-400" aria-hidden />}
                {cut.left && <span className="absolute inset-y-0 left-0 border-l border-dashed border-neutral-400" aria-hidden />}
                {cut.bottom && <span className="absolute inset-x-0 bottom-0 border-b border-dashed border-neutral-400" aria-hidden />}
                {cut.top && <span className="absolute inset-x-0 top-0 border-t border-dashed border-neutral-400" aria-hidden />}
              </>
            )}
            {/* On screen only: the quarter already cut off the sheet in the tray. */}
            {slot === "used" && preview && (
              <div className="flex h-full w-full items-center justify-center bg-[repeating-linear-gradient(135deg,#f1f5f9_0_6px,#e2e8f0_6px_12px)] text-[14pt] font-semibold text-slate-400">
                Kesilmiş
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Pages({ labels, paper, start, data, preview }: {
  labels: AdminOrder[];
  paper: Paper;
  start: Quadrant;
  data: Omit<LabelData, "order" | "paper">;
  preview: boolean;
}) {
  const render = (o: AdminOrder) => <LabelBody order={o} paper={paper} {...data} />;
  if (paper === "THERMAL") {
    return labels.map((o) => (
      <div key={o.id} className={`label-page w-fit ${preview ? paperShadow : ""}`}>
        {render(o)}
      </div>
    ));
  }
  return sheetsOf(labels, start).map((slots, i) => <A4Sheet key={i} slots={slots} render={render} preview={preview} />);
}

/** The four quarters of an A4 sheet as a small page: where the first label goes. */
function QuadrantPicker({ value, onChange, batch }: { value: Quadrant; onChange: (q: Quadrant) => void; batch: boolean }) {
  return (
    <fieldset className="flex items-center gap-3">
      <legend className="sr-only">{batch ? "İlk etiketin A4 üzerindeki konumu" : "Etiketin A4 üzerindeki konumu"}</legend>
      <div className="grid aspect-[210/297] w-24 grid-cols-2 grid-rows-2 gap-0.5 rounded-md border border-slate-300 bg-slate-200 p-0.5 dark:border-white/15 dark:bg-white/10">
        {QUADRANTS.map((q) => {
          const chosen = q.value === value;
          return (
            <label
              key={q.value}
              title={`${q.value}: ${q.label}`}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-sm text-center leading-none transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-red-600 ${
                chosen ? "bg-red-600 text-white" : q.value < value && batch ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-zinc-500" : "bg-white text-slate-600 hover:bg-red-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-red-500/10"
              }`}
            >
              <input type="radio" name="label-quadrant" className="sr-only" checked={chosen} onChange={() => onChange(q.value)} />
              <span className="text-sm font-bold">{q.value}</span>
              <span className="mt-0.5 text-[9px] font-semibold">{q.label}</span>
            </label>
          );
        })}
      </div>
      <p className="max-w-52 text-xs leading-5 text-slate-500 dark:text-zinc-400">
        {batch ? "İlk etiket" : "Etiket"} <strong className="text-slate-700 dark:text-zinc-200">{value}. konuma ({QUADRANTS[value - 1].label})</strong> basılır.
        {value > 1 && " Kesilmiş A4’ü kalan kısmı üstte olacak şekilde tepsiye geri koyun."}
      </p>
    </fieldset>
  );
}

function readPaper(): Paper {
  if (typeof window === "undefined") return "A4";
  try {
    return localStorage.getItem(PAPER_KEY) === "THERMAL" ? "THERMAL" : "A4";
  } catch {
    return "A4";
  }
}

/** Reads orders a few at a time; the ones that fail are named, the rest still print. */
async function readOrders(ids: string[], signal: AbortSignal): Promise<{ orders: AdminOrder[]; failed: string[] }> {
  const orders: AdminOrder[] = [];
  const failed: string[] = [];
  for (let i = 0; i < ids.length; i += FETCH_AT_ONCE) {
    const chunk = ids.slice(i, i + FETCH_AT_ONCE);
    const results = await Promise.allSettled(chunk.map((id) => adminGetOrder(id, signal)));
    results.forEach((r, j) => (r.status === "fulfilled" ? orders.push(r.value) : failed.push(chunk[j])));
  }
  if (signal.aborted) throw new DOMException("aborted", "AbortError");
  return { orders, failed };
}

/**
 * Shipping labels, one order's or a batch's (the orders list's "Etiketleri
 * Yazdır"). On A4 they flow four to a sheet, two by two, each in a quarter
 * to be cut out; the first can start at any quarter, so a sheet already cut
 * goes back in the tray. A thermal label printer takes them 100 × 150 mm, one
 * to a label. For a shipment registered with Yurtiçi's web service the label
 * carries our cargo key as a Code 128 barcode, which the branch scans to
 * match the parcel to its registration; any other order gets the same label
 * without it. The sender is the first branch on the storefront's footer
 * ("Ana Sayfa Düzenleme").
 */
export function ShippingLabel({ orderIds }: { orderIds: string[] }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const [sender, setSender] = useState<HomeFooter | null>(null);
  const [customerCode, setCustomerCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<Paper>(readPaper);
  const [start, setStart] = useState<Quadrant>(1);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const idsKey = orderIds.join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) return;
    const controller = new AbortController();
    Promise.all([
      readOrders(ids, controller.signal),
      adminGetHomepage(controller.signal).catch(() => null),
      adminShippingIntegrations(controller.signal).catch(() => null),
    ])
      .then(([read, home, integrations]) => {
        if (read.orders.length === 0) {
          setError(ids.length === 1 ? "Sipariş okunamadı." : "Seçilen siparişler okunamadı.");
          return;
        }
        setOrders(read.orders);
        setFailed(read.failed);
        setSender(resolveHomepage(home?.data).footer);
        setCustomerCode(integrations?.yurtici_customer_code ?? null);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Sipariş okunamadı."));
      });
    return () => controller.abort();
  }, [idsKey]);

  function choosePaper(next: Paper) {
    setPaper(next);
    try {
      localStorage.setItem(PAPER_KEY, next);
    } catch {
      // Private window: the choice lasts this page only.
    }
  }

  if (orderIds.length === 0) return <Alert variant="error">Etiket için sipariş seçilmedi.</Alert>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!orders || !sender) return <p className="text-sm text-slate-500">Etiket hazırlanıyor…</p>;

  const batch = orders.length > 1;
  const data = { sender, customerCode };
  const sheets = paper === "A4" ? sheetsOf(orders, start).length : orders.length;
  const withoutKey = orders.filter((o) => !o.cargo_key).length;
  const segment = (active: boolean) =>
    `h-8 rounded-md px-3 text-xs font-semibold transition-colors duration-200 ${
      active ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    }`;

  return (
    <div className="space-y-4">
      <style>{`
        #${PRINT_ROOT} { display: none; }
        @media print {
          @page { size: ${paper === "A4" ? "A4 portrait" : "100mm 150mm"}; margin: 0; }
          :root { color-scheme: light !important; }
          body > *:not(#${PRINT_ROOT}) { display: none !important; }
          #${PRINT_ROOT} { display: block !important; }
          #${PRINT_ROOT} .label-page { break-after: page; }
          #${PRINT_ROOT} .label-page:last-child { break-after: auto; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-72">
          <h1 className="text-lg font-bold tracking-tight">
            {batch ? `Kargo Etiketleri · ${orders.length} sipariş` : `Kargo Etiketi · ${orders[0].order_number}`}
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {paper === "A4"
              ? `A4’e dörtlü: her etiket bir çeyrekte, kesik çizgiden makasla kesilir. ${sheets} sayfa.`
              : `Termal etiket yazıcısı, 100 × 150 mm. ${sheets} etiket.`}
            {withoutKey > 0 && " Barkod yalnızca Yurtiçi web servisiyle açılan gönderilerde basılır."}
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

      {failed.length > 0 && (
        <Alert variant="error">
          {failed.length} sipariş okunamadı; etiketi basılmayacak. Diğer {orders.length} etiket hazır.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10">
        <div role="radiogroup" aria-label="Kâğıt" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/5">
          <button type="button" role="radio" aria-checked={paper === "A4"} onClick={() => choosePaper("A4")} className={segment(paper === "A4")}>
            A4 (4’lü)
          </button>
          <button type="button" role="radio" aria-checked={paper === "THERMAL"} onClick={() => choosePaper("THERMAL")} className={segment(paper === "THERMAL")}>
            Termal 100 × 150
          </button>
        </div>
        {paper === "A4" && <QuadrantPicker value={start} onChange={setStart} batch={batch} />}
      </div>

      {/* The pages as they print, at half size: A4 is wider than the panel. */}
      <div className="overflow-x-auto rounded-xl bg-slate-100 p-6 dark:bg-zinc-800">
        <div className={`flex flex-wrap gap-6 ${paper === "A4" ? "[zoom:0.5]" : "[zoom:0.8]"}`}>
          <Pages labels={orders} paper={paper} start={start} data={data} preview />
        </div>
      </div>
      {mounted &&
        createPortal(
          <div id={PRINT_ROOT}>
            <Pages labels={orders} paper={paper} start={start} data={data} preview={false} />
          </div>,
          document.body,
        )}
    </div>
  );
}

