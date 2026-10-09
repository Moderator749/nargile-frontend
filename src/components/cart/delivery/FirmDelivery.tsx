"use client";

import { ReceiptText } from "lucide-react";

import { AddressFields } from "@/components/cart/delivery/AddressFields";
import { addressSummary, type AddressDraft } from "@/components/cart/delivery/addressDraft";
import { DeliveryCard } from "@/components/cart/delivery/DeliveryCard";
import {
  FIRM_CARD_COPY,
  METHOD_BY_FIRM_CARD,
  firmCards,
  istanbulShortfall,
  type FirmCard,
} from "@/components/cart/delivery/firmCards";
import { MethodFields, type MethodDetails } from "@/components/cart/delivery/MethodFields";
import { countryName } from "@/lib/countries";
import { formatMoney } from "@/lib/format";
import type { SavedAddress } from "@/types";

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";
const noteClass = "text-xs text-slate-500 dark:text-zinc-400";

interface FirmDeliveryProps {
  /** Addresses on file; null while they load. */
  saved: SavedAddress[] | null;
  /** Whether the registered address is in İstanbul, where our own van goes. */
  registeredInIstanbul: boolean;
  card: FirmCard;
  onCardChange: (card: FirmCard) => void;
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
  /** "Şubeme istiyorum": what the firm calls the branch. */
  branchName: string;
  onBranchNameChange: (value: string) => void;
  /** The Yurtiçi agreement and the ambar the firm may name. */
  details: MethodDetails;
  onDetailsChange: (patch: Partial<MethodDetails>) => void;
  /** What the cart is worth, and what the van asks for, both in TRY. */
  subtotal: number;
  istanbulMinimum: number;
}

/**
 * Delivery for a firm: five cards, each confirmed with its own "Onay" button.
 *
 * Four of them go to the address the firm registered — its prices, its invoices
 * and its payment terms all hang off that one place — and there the il and the
 * ilçe are held while the street, the building and the door stay the firm's to
 * correct. "Şubeme istiyorum" is the exception: a branch is named and typed in
 * full, and the server accepts it precisely because it was named.
 *
 * The card decides how the order travels as well as where it goes, so there is
 * no separate list of carriers to disagree with it.
 */
export function FirmDelivery(props: FirmDeliveryProps) {
  const { saved, card, address, registeredInIstanbul, subtotal, istanbulMinimum } = props;
  const registered = saved?.[0] ?? null;
  const hasSaved = registered !== null;
  // An account with nothing on file has nothing to be held to, and still has to
  // be able to order: it types its address like anyone else.
  const lockPlace = hasSaved && card !== "BRANCH";
  const shortfall = istanbulShortfall(subtotal, istanbulMinimum);
  const cards = firmCards(registeredInIstanbul);

  const addressForm = (
    <AddressFields
      value={address}
      onChange={props.onAddressChange}
      abroad={false}
      lockPlace={lockPlace}
    />
  );

  return (
    <>
      <section aria-labelledby="firm-billing-heading" className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
        <h3
          id="firm-billing-heading"
          className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100"
        >
          <ReceiptText className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
          Fatura Adresim
        </h3>
        {/* One line either way, so the block is the same height before and
            after the addresses land. */}
        {saved === null ? (
          <p className="mt-1.5 h-4 w-2/3 rounded bg-slate-200 motion-safe:animate-pulse dark:bg-white/10" aria-busy />
        ) : (
          <p className={`mt-1 ${noteClass}`}>
            {registered
              ? addressSummary(registered, countryName)
              : "Kayıtlı fatura adresiniz yok; teslimat adresinizi aşağıda girebilirsiniz."}
          </p>
        )}
      </section>

      <fieldset className="mt-5">
        <legend className={labelClass}>Teslimat bilgileri</legend>
        <div className="mt-2 space-y-2">
          {cards.map((value) => {
            const { title, summary, Icon } = FIRM_CARD_COPY[value];
            const selected = card === value;
            const vanWaiting = value === "ISTANBUL_FREE" && shortfall > 0;
            return (
              <DeliveryCard
                key={value}
                name="firm_delivery_choice"
                selected={selected}
                onSelect={() => props.onCardChange(value)}
                title={title}
                summary={
                  value === "BILLING" && registered
                    ? addressSummary(registered, countryName)
                    : value === "ISTANBUL_FREE"
                      ? `${formatMoney(istanbulMinimum)} ve üzeri alışverişlerde ücretsiz teslimat.`
                      : summary
                }
                Icon={Icon}
                disabled={vanWaiting}
                notice={
                  vanWaiting
                    ? `Ücretsiz teslimat için sepetinize ${formatMoney(shortfall)} daha ekleyin.`
                    : undefined
                }
              >
                {value === "BRANCH" ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="branch-name" className={labelClass}>
                        Şube Adı
                      </label>
                      <input
                        id="branch-name"
                        maxLength={150}
                        required
                        value={props.branchName}
                        onChange={(e) => props.onBranchNameChange(e.target.value)}
                        placeholder="Kadıköy Şubesi"
                        className={inputClass}
                      />
                      <p className={noteClass}>
                        Şubenizin adresi ve telefonu aşağıdaki alanlara girilir; sipariş bu şube
                        adıyla gönderilir.
                      </p>
                    </div>
                    {addressForm}
                  </div>
                ) : value === "YURTICI_DOOR" || value === "NAKLIYE_AMBARI" ? (
                  /* The agreement number and the ambar belong to the two cards
                     that name a carrier; the invoice address and the van ask
                     for nothing. */
                  <MethodFields
                    method={METHOD_BY_FIRM_CARD[value]}
                    value={props.details}
                    onChange={props.onDetailsChange}
                  />
                ) : undefined}
              </DeliveryCard>
            );
          })}
          {/* Hold the van's place while the addresses load, so the list does
              not grow under the cursor once they arrive. */}
          {saved === null && (
            <div
              className="h-[4.25rem] rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5"
              aria-busy
            />
          )}
        </div>
      </fieldset>

      {/* A branch carries its own address inside its card; every other card
          delivers to the one on file, which is corrected here. */}
      {card !== "BRANCH" && (
        <fieldset className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
          <legend className={labelClass}>Teslimat adresi</legend>
          <div className="mt-2">{addressForm}</div>
        </fieldset>
      )}
    </>
  );
}
