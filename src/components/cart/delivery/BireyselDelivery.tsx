"use client";

import { Building2, MapPin, Package, Plus } from "lucide-react";

import { AddressFields } from "@/components/cart/delivery/AddressFields";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import {
  BRANCH_DELIVERY,
  CORPORATE_DELIVERY,
  NEW_ADDRESS,
  addressSummary,
  type AddressChoice,
  type AddressDraft,
} from "@/components/cart/delivery/addressDraft";
import { DeliveryCard } from "@/components/cart/delivery/DeliveryCard";
import { ReceiverFields } from "@/components/cart/delivery/MethodFields";
import { countryName } from "@/lib/countries";
import { checkoutMessages } from "@/lib/i18n/messages/checkout";
import type { SavedAddress } from "@/types";

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";
const noteClass = "text-xs text-slate-500 dark:text-zinc-400";

interface BireyselDeliveryProps {
  /** Addresses on file; null while they load. */
  saved: SavedAddress[] | null;
  /**
   * The firm the invoice is being made out to, when it is: what its own
   * delivery card previews. Null for an order invoiced personally, which has no
   * such card — the invoice section above is what brings it into being.
   */
  invoiceTarget: { summary: string; notice: string | null } | null;
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
 * Billing and shipping stay separate here, which is the point of the second
 * card: the invoice can be made out to a firm while the goods go home, to a
 * branch, or to an address typed once. The first card is always the customer's
 * own address; the second appears when there is a firm to deliver to and
 * previews it as the invoice section above left it. A branch collection is
 * addressed to the customer and travels under their own address, so it asks for
 * nothing except — optionally — their own Yurtiçi agreement. A new address is
 * typed for this order alone and is never written back to the account.
 *
 * Picking the branch is what makes the order a branch delivery: here the
 * address and the way it travels are the same decision, which is why there is
 * no separate list of shipping methods.
 */
export function BireyselDelivery(props: BireyselDeliveryProps) {
  const locale = useLocale();
  const m = useMessages(checkoutMessages);
  // The card for the address on file, in the words the blueprint uses.
  const t = m.bireysel;
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
      <legend className={labelClass}>{m.delivery.legend}</legend>
      <div className="mt-2 space-y-2">
        {saved === null ? (
          // Hold the row an address on file would take, so nothing jumps.
          <div
            className="h-[4.25rem] rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5"
            aria-busy
          />
        ) : (
          // The customer's own invoice address. A firm's has its own card
          // below, built from the invoice section rather than from this list.
          saved.map((entry, index) =>
            entry.kind === "BILLING" ? (
              <DeliveryCard
                key={`${entry.kind}-${index}`}
                name="delivery_choice"
                selected={choice?.kind === "saved" && choice.index === index}
                onSelect={() => props.onChoiceChange({ kind: "saved", index })}
                title={t.billingTitle}
                summary={addressSummary(entry, (code) => countryName(code, locale))}
                Icon={MapPin}
              />
            ) : null,
          )
        )}

        {/* The firm from the invoice section: shown only when there is one,
            since a personal invoice has no corporate address to deliver to. */}
        {props.invoiceTarget && (
          <DeliveryCard
            name="delivery_choice"
            selected={choice?.kind === "corporate"}
            onSelect={() => props.onChoiceChange(CORPORATE_DELIVERY)}
            title={t.corporateTitle}
            summary={props.invoiceTarget.summary}
            notice={props.invoiceTarget.notice ?? undefined}
            disabled={props.invoiceTarget.notice !== null}
            Icon={Building2}
          />
        )}

        <DeliveryCard
          name="delivery_choice"
          selected={choice?.kind === "branch"}
          onSelect={() => props.onChoiceChange(BRANCH_DELIVERY)}
          title={t.branchTitle}
          summary={t.branchSummary}
          Icon={Package}
        >
          <div className="space-y-4">
            {/* With nothing on file there is no address to send it under, so it
                is typed here as well. */}
            {!hasSaved && saved !== null && addressForm}
            <div className="space-y-1.5">
              <p className={noteClass}>{t.contractNote}</p>
              <label htmlFor="branch-contract-no" className={labelClass}>
                {m.method.contractLabel}
              </label>
              <input
                id="branch-contract-no"
                maxLength={50}
                value={props.contractNo}
                onChange={(e) => props.onContractNoChange(e.target.value)}
                placeholder={m.method.contractPlaceholder}
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
          title={t.newTitle}
          summary={t.newSummary}
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
