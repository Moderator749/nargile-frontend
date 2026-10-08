import type { AccountType, AddressKind, BillingEntity, InternationalKind, SegmentType } from "@/types";

/** The four cards sign-up offers, plus the two they replaced. */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  INDIVIDUAL: "Bireysel",
  CAFE: "Kafe & Restorant",
  TOBACCO_SHOP: "Nargile & Tobacco Shop",
  INTERNATIONAL: "Yurt Dışı",
  SOLE_PROPRIETOR: "Şahıs Firması",
  COMPANY: "Şirket",
};

/** The price lists. RETAIL is where every self-service sign-up starts. */
export const SEGMENT_LABELS: Record<SegmentType, string> = {
  RETAIL: "Perakende",
  CAFE: "Kafe",
  WHOLESALE: "Toptan",
  DEALER: "Bayi",
};

export const BILLING_ENTITY_LABELS: Record<BillingEntity, string> = {
  SOLE_PROPRIETOR: "Şahıs firması",
  COMPANY: "Şirket (Limited/A.Ş.)",
};

export const INTERNATIONAL_KIND_LABELS: Record<InternationalKind, string> = {
  WHOLESALER: "Wholesaler / Distributor",
  CAFE: "Cafe & Restaurant",
};

export const ADDRESS_KIND_LABELS: Record<AddressKind, string> = {
  BILLING: "Fatura Adresi",
  CORPORATE_BILLING: "Kurumsal Fatura Adresi",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Onay bekliyor",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
};

/**
 * A price list, as a chip. Retail is where every account starts, so it stays
 * quiet; a granted tier is the exception and is coloured like one.
 */
export function SegmentChip({ segment }: { segment: SegmentType | null }) {
  if (!segment) return <span className="text-slate-400 dark:text-zinc-600">—</span>;
  const granted = segment !== "RETAIL";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        granted
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300"
      }`}
    >
      {SEGMENT_LABELS[segment]}
    </span>
  );
}
