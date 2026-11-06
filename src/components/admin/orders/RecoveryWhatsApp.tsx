import { Loader2, MessageCircle } from "lucide-react";

import { whatsappNumber } from "@/components/admin/orders/sheetData";
import type { OrderActions } from "@/components/admin/orders/useOrderActions";
import { RECOVERY_DISCOUNT_PERCENT, placedWhen, recoveryAmounts, recoveryMessage } from "@/lib/cartRecovery";
import { formatMoney } from "@/lib/format";
import { orderNetTotal } from "@/lib/ordersApi";
import type { AdminOrder } from "@/types";

const base =
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-center text-xs font-semibold leading-4 shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

/** A recovered order has taken its discount: the chat it is offered in, or null without a dialable number. */
export function recoveryHref(order: AdminOrder): string | null {
  const number = whatsappNumber(order);
  if (!number) return null;
  const after = orderNetTotal(order);
  const before = after + Number(order.recovery_discount ?? 0);
  const message = recoveryMessage(
    order.customer_name || order.shipping_address?.full_name,
    placedWhen(order.created_at),
    formatMoney(before),
    formatMoney(after),
  );
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Whether the order was won back by "WhatsApp ile Kurtar" and still waits for the transfer. */
export function isRecoveredTransfer(order: AdminOrder): boolean {
  return order.status === "AWAITING_TRANSFER" && Number(order.recovery_discount ?? 0) > 0;
}

/**
 * "WhatsApp ile Kurtar", on a failed card payment's row. It first has the
 * server turn the order into a bank transfer at 5% off — its stock taken
 * again — and only then opens the chat, the message written from what the
 * server saved. When the server refuses (the goods sold since, say), WhatsApp
 * is never opened: the reason is the row's notice. Under the button, the two
 * totals, so the admin sees what is about to be offered.
 *
 * A browser may block a tab opened once the server has answered (no longer
 * "on the click"); the row then offers the chat as a link (`RecoveryResend`).
 */
export function RecoveryWhatsApp({ order, actions }: { order: AdminOrder; actions: OrderActions }) {
  const dialable = !!whatsappNumber(order);
  const busy = actions.busy(order.id);
  const { before, after } = recoveryAmounts(orderNetTotal(order));

  async function recover() {
    const updated = await actions.recoverToTransfer(order);
    const href = updated && recoveryHref(updated);
    if (!href) return;
    const tab = window.open(href, "_blank");
    if (tab) tab.opener = null;
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={() => void recover()}
        disabled={!dialable || busy}
        aria-busy={busy}
        title={
          dialable
            ? `Siparişi %${RECOVERY_DISCOUNT_PERCENT} indirimle havaleye çevirip stoğu ayırır, sonra teklifi WhatsApp'ta açar`
            : "Müşterinin WhatsApp'a uygun bir telefon numarası yok"
        }
        className={`${base} ${
          dialable
            ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-80"
            : "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none dark:bg-white/10 dark:text-zinc-500"
        }`}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        {busy ? "Kurtarılıyor…" : "WhatsApp ile Kurtar"}
      </button>
      <p className="whitespace-normal text-left text-[11px] leading-4 text-slate-500 dark:text-zinc-400">
        {dialable ? (
          <>
            <span className="line-through">{formatMoney(before)}</span>{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatMoney(after)}</span>{" "}
            <span className="whitespace-nowrap">(Havale −%{RECOVERY_DISCOUNT_PERCENT})</span>
          </>
        ) : (
          "Telefon numarası yok"
        )}
      </p>
    </div>
  );
}

/** On a recovered order waiting for the transfer: the offer's chat again, with the saved figures. */
export function RecoveryResend({ order }: { order: AdminOrder }) {
  const href = recoveryHref(order);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] font-semibold leading-4 text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
    >
      <MessageCircle className="h-3 w-3 shrink-0" aria-hidden /> WhatsApp&apos;ı tekrar aç
    </a>
  );
}
