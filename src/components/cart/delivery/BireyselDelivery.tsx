"use client";

import { MapPin, Package, Plus, ReceiptText } from "lucide-react";

import { AddressFields } from "@/components/cart/delivery/AddressFields";
import {
  BRANCH_DELIVERY,
  NEW_ADDRESS,
  addressSummary,
  type AddressChoice,
  type AddressDraft,
} from "@/components/cart/delivery/addressDraft";
import { DeliveryCard } from "@/components/cart/delivery/DeliveryCard";
import { ReceiverFields } from "@/components/cart/delivery/MethodFields";
import { countryName } from "@/lib/countries";
import type { SavedAddress } from "@/types";

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";
const noteClass = "text-xs text-slate-500 dark:text-zinc-400";

/** What to call an address on file, in the words the card uses. */
const TITLES: Record<SavedAddress["kind"], string> = {
  BILLING: "Fatura adresime istiyorum",
  CORPORATE_BILLING: "Kurumsal fatura adresime istiyorum",
};

interface BireyselDeliveryProps {
  /** Addresses on file; null while they load. */
  saved: SavedAddress[] | null;
  choice: AddressChoice | null;
  onChoiceChange: (choice: AddressChoice) => void;
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
  /** The buyer's own Yurtiçi agreement, for the branch option. */
  contractNo: string;
  onContractNoChange: (value: string) => void;
  otherReceiver: boolean;
  onOtherReceiverChange: (value: boolean) => void;
  receiverName: string;
  receiverPhone: string;
  onReceiverChange: (patch: { receiverName?: string; receiverPhone?: string }) => void;
}

/**
 * The bireysel delivery choice: one of four cards, each confirmed with its own
 * "Onay" button.
 *
 * An address already on file is one click. A branch collection is addressed to
 * the customer and travels under that same address, so it asks for nothing
 * except — optionally — their own Yurtiçi agreement. A new address is typed for
 * this order alone and is never written back to the account.
 *
 * Picking the branch is what makes the order a branch delivery: here the
 * address and the way it travels are the same decision, which is why there is
 * no separate list of shipping methods.
 */
export function BireyselDelivery(props: BireyselDeliveryProps) {
  const { saved, choice, address } = props;
  const hasSaved = (saved?.length ?? 0) > 0;
  const receiver = (
    <ReceiverFields
      idPrefix={choice?.kind === "branch" ? "branch" : "new"}
      checked={props.otherReceiver}
      onCheckedChange={props.onOtherReceiverChange}
      name={props.receiverName}
      phone={props.receiverPhone}
      onChange={props.onReceiverChange}
    />
  );
  const addressForm = (
    <AddressFields value={address} onChange={props.onAddressChange} abroad={false} />
  );

  return (
    <fieldset className="mt-5">
      <legend className={labelClass}>Teslimat bilgileri</legend>
      <div className="mt-2 space-y-2">
        {saved === null ? (
          // Hold the row an address on file would take, so nothing jumps.
          <div
            className="h-[4.25rem] rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5"
            aria-busy
          />
        ) : (
          saved.map((entry, index) => (
            <DeliveryCard
              key={`${entry.kind}-${index}`}
              name="delivery_choice"
              selected={choice?.kind === "saved" && choice.index === index}
              onSelect={() => props.onChoiceChange({ kind: "saved", index })}
              title={TITLES[entry.kind] ?? entry.label}
              summary={addressSummary(entry, countryName)}
              Icon={entry.kind === "CORPORATE_BILLING" ? ReceiptText : MapPin}
            />
          ))
        )}

        <DeliveryCard
          name="delivery_choice"
          selected={choice?.kind === "branch"}
          onSelect={() => props.onChoiceChange(BRANCH_DELIVERY)}
          title="Yurtiçi Kargo Şube Teslimatı - Adınıza Gönderilir"
          summary="Kargonuz size en yakın Yurtiçi Kargo şubesinde teslim alınmak üzere bekler."
          Icon={Package}
        >
          <div className="space-y-4">
            {/* With nothing on file there is no address to send it under, so it
                is typed here as well. */}
            {!hasSaved && saved !== null && addressForm}
            <div className="space-y-1.5">
              <p className={noteClass}>Size ait anlaşma varsa kodunuzu girebilirsiniz.</p>
              <label htmlFor="branch-contract-no" className={labelClass}>
                Anlaşma No
              </label>
              <input
                id="branch-contract-no"
                maxLength={50}
                value={props.contractNo}
                onChange={(e) => props.onContractNoChange(e.target.value)}
                placeholder="Yurtiçi Kargo anlaşma numaranız"
                className={inputClass}
              />
            </div>
            {receiver}
          </div>
        </DeliveryCard>

        <DeliveryCard
          name="delivery_choice"
          selected={choice?.kind === "new"}
          onSelect={() => props.onChoiceChange(NEW_ADDRESS)}
          title="Yeni Adres Ekle"
          summary="Bu siparişe özel; hesabınıza kaydedilmez."
          Icon={Plus}
        >
          <div className="space-y-4">
            {addressForm}
            {receiver}
          </div>
        </DeliveryCard>
      </div>
    </fieldset>
  );
}
