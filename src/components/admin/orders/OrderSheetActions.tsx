import { CircleCheck, FileText, Printer, XCircle } from "lucide-react";

import { whatsappNumber } from "@/components/admin/orders/sheetData";
import { canApproveOrder, canCancelOrder } from "@/components/admin/orders/useOrderActions";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { AdminOrder } from "@/types";

const base =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50";
const neutral =
  "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/15 dark:hover:bg-white/5";

/**
 * The form's command bar: cancel and approve at the two ends, with the paperwork
 * actions between them. Approve/cancel are disabled once the order has left the
 * pending states — the server answers those with a 409.
 */
export function OrderSheetActions({
  order,
  busy,
  onApprove,
  onCancel,
  onPrint,
}: {
  order: AdminOrder;
  busy: boolean;
  onApprove: () => void;
  onCancel: () => void;
  onPrint: () => void;
}) {
  const settled = `Sipariş ${order.status === "CANCELLED" ? "iptal edilmiş" : "işleme alınmış"}: bu işlem artık yapılamaz`;
  const wa = whatsappNumber(order);
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Merhaba, ${order.order_number} numaralı siparişiniz hakkında bilgi vermek istiyoruz.`)}`
    : null;

  return (
    <div
      data-print-hide
      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 p-2.5 dark:border-white/15 dark:bg-white/[0.04]"
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={busy || !canCancelOrder(order.status)}
        title={canCancelOrder(order.status) ? "Siparişi iptal et: stok ve kullanılan puanlar iade edilir" : settled}
        className={`${base} bg-red-600 text-white shadow-sm hover:bg-red-500`}
      >
        <XCircle className="h-4 w-4" aria-hidden /> İptal
      </button>

      <button
        type="button"
        disabled
        title="Fatura entegrasyonu henüz bağlı değil"
        className={`${base} ${neutral}`}
      >
        <FileText className="h-4 w-4" aria-hidden /> Faturalandır
      </button>

      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          title={`WhatsApp ile yaz: +${wa}`}
          className={`${base} bg-[#25D366] text-white shadow-sm hover:bg-[#1fba57]`}
        >
          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
        </a>
      ) : (
        <span
          title="Müşterinin telefon numarası kayıtlı değil"
          className={`${base} cursor-not-allowed bg-[#25D366]/40 text-white`}
        >
          <WhatsAppIcon className="h-4 w-4" /> WhatsApp
        </span>
      )}

      <button type="button" onClick={onPrint} className={`${base} ${neutral}`}>
        <Printer className="h-4 w-4" aria-hidden /> Yazdır
      </button>

      <button
        type="button"
        onClick={onApprove}
        disabled={busy || !canApproveOrder(order.status)}
        aria-busy={busy}
        title={
          canApproveOrder(order.status)
            ? order.status === "AWAITING_TRANSFER"
              ? "Havale hesaba geçti: siparişi ödendi olarak işaretle"
              : order.status === "AWAITING_PAYMENT"
                ? "Yalnızca ödemeyi PayTR panelinde gördüyseniz: siparişi ödendi olarak işaretle"
                : "Siparişi onayla"
            : settled
        }
        className={`${base} ml-auto bg-emerald-600 text-white shadow-sm hover:bg-emerald-500`}
      >
        <CircleCheck className="h-4 w-4" aria-hidden /> Onay
      </button>
    </div>
  );
}
