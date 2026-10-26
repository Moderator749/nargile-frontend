import { Building2, CreditCard, Lightbulb } from "lucide-react";

import { SheetBlock, SheetField } from "@/components/admin/orders/SheetBlock";
import { formatDateParts } from "@/lib/format";
import type { PaymentFailure } from "@/types";

/** Whose side a failed card payment is on: the customer can retry, or the shop has to look first. */
// Amber: the customer can try again. Red: the shop has something to fix first.
// `className` is the card's pill, `textClassName` the list row's plain line.
export const FAILURE_SOURCE: Record<
  PaymentFailure["source"],
  { label: string; className: string; textClassName: string }
> = {
  CUSTOMER_BANK: {
    label: "Müşteri / Banka Kaynaklı",
    className: "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/40",
    textClassName: "text-amber-800 dark:text-amber-300",
  },
  SYSTEM_STORE: {
    label: "Sistem / Teknik Kaynaklı",
    className: "bg-red-100 text-red-800 ring-red-300 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/40",
    textClassName: "text-red-700 dark:text-red-400",
  },
};

/**
 * "Ödeme Hata Kaydı (PayTR)" on a failed order's sheet: whose side the failure
 * is on, PayTR's own words and code, when it happened, and what the person
 * answering the phone should suggest. The server decides the side and the
 * advice (`services/payment_failures`); this only lays them out.
 */
export function PaymentFailureCard({ failure }: { failure: PaymentFailure }) {
  const source = FAILURE_SOURCE[failure.source];
  const Icon = failure.source === "CUSTOMER_BANK" ? CreditCard : Building2;
  const stamp = failure.at ? formatDateParts(failure.at) : null;
  return (
    <SheetBlock title="Ödeme Hata Kaydı (PayTR)" className="border-amber-300! dark:border-amber-500/40!">
      <dl>
        <SheetField
          label="Hata Kaynağı"
          value={
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${source.className}`}>
              <Icon className="h-3.5 w-3.5" aria-hidden /> {source.label}
            </span>
          }
        />
        <SheetField label="PayTR Mesajı" value={failure.message} />
        <SheetField label="Hata Kodu" value={failure.code} mono />
        <SheetField label="Zaman Damgası" value={stamp ? `${stamp.date} ${stamp.time}` : null} mono />
        {failure.merchant_oid && (
          <SheetField
            label="PayTR Sipariş No"
            value={`${failure.merchant_oid}${failure.test_mode ? " · test modu" : ""}`}
            mono
          />
        )}
      </dl>
      <p className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Temsilci için öneri: </span>
          {failure.advice}
        </span>
      </p>
    </SheetBlock>
  );
}
