"use client";

import { BireyselDelivery } from "@/components/cart/delivery/BireyselDelivery";
import {
  shipsAbroad,
  shipsToRegistered,
  type AddressChoice,
  type AddressDraft,
} from "@/components/cart/delivery/addressDraft";
import { ExportDelivery } from "@/components/cart/delivery/ExportDelivery";
import { FirmDelivery } from "@/components/cart/delivery/FirmDelivery";
import type { FirmCard } from "@/components/cart/delivery/firmCards";
import type { MethodDetails } from "@/components/cart/delivery/MethodFields";
import type { AccountType, SavedAddress, TransportMode } from "@/types";

interface DeliveryStepProps {
  accountType: AccountType;
  /** Addresses sign-up collected; null while they are still loading. */
  saved: SavedAddress[] | null;
  /** Whether the registered address is in İstanbul, where our own van goes. */
  registeredInIstanbul: boolean;
  /** Bireysel: which of the three cards. Null while the saved list is loading. */
  choice: AddressChoice | null;
  onChoiceChange: (choice: AddressChoice) => void;
  /** Bireysel: the firm the invoice is made out to, which has a delivery card
      of its own. Null for an order invoiced personally. */
  invoiceTarget: { summary: string; notice: string | null } | null;
  /** A firm: which of the five cards. */
  card: FirmCard;
  onCardChange: (card: FirmCard) => void;
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
  /** "Şubeme istiyorum": the branch a firm's order goes to. */
  branchName: string;
  onBranchNameChange: (value: string) => void;
  otherReceiver: boolean;
  onOtherReceiverChange: (value: boolean) => void;
  receiverName: string;
  receiverPhone: string;
  onReceiverChange: (patch: { receiverName?: string; receiverPhone?: string }) => void;
  /** The Yurtiçi agreement and the ambar the buyer may name. */
  details: MethodDetails;
  onDetailsChange: (patch: Partial<MethodDetails>) => void;
  /** What the cart is worth, and what the İstanbul van asks for, in TRY. */
  subtotal: number;
  istanbulMinimum: number;
  /** Whether the address on file can be shipped to as it stands; when it
      cannot, the one step that has no form for it grows one. */
  onFileAddressReady: boolean;
  /** Export only: how the shipment should travel, and the choice being made. */
  transportMode: TransportMode | null;
  onTransportModeChange: (mode: TransportMode) => void;
}

/**
 * Teslimat bilgileri: where the order goes, how it travels, and who signs for
 * it. There are three shapes of this step, and an account sees exactly one.
 *
 * A bireysel customer picks one of three cards and confirms it: the invoice
 * address — their own, or the firm's when the invoice is made out to one — a
 * Yurtiçi branch to collect from, or a new address typed for this order. A firm
 * picks one of five: its invoice address, a branch of its own,
 * Yurtiçi to the door, a nakliye ambarı, or — in İstanbul, above a limit the
 * panel sets — the shop's own van. In both the card is also the shipping
 * method, so nothing on screen can disagree with the order.
 *
 * An export customer does not type an address at all: theirs is read off the
 * account, and what they choose instead is how the shipment leaves — road, air
 * or sea — which is what the freight will be quoted against.
 */
export function DeliveryStep(props: DeliveryStepProps) {
  const abroad = shipsAbroad(props.accountType);
  const firmFlow = shipsToRegistered(props.accountType) && !abroad;

  return (
    <section
      aria-labelledby="delivery-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6"
    >
      <h2 id="delivery-heading" className="text-lg font-bold tracking-tight">
        Teslimat ve Adres
      </h2>

      {abroad ? (
        <ExportDelivery
          saved={props.saved}
          address={props.address}
          onAddressChange={props.onAddressChange}
          addressReady={props.onFileAddressReady}
          transportMode={props.transportMode}
          onTransportModeChange={props.onTransportModeChange}
        />
      ) : firmFlow ? (
        <FirmDelivery
          saved={props.saved}
          registeredInIstanbul={props.registeredInIstanbul}
          card={props.card}
          onCardChange={props.onCardChange}
          address={props.address}
          onAddressChange={props.onAddressChange}
          branchName={props.branchName}
          onBranchNameChange={props.onBranchNameChange}
          details={props.details}
          onDetailsChange={props.onDetailsChange}
          subtotal={props.subtotal}
          istanbulMinimum={props.istanbulMinimum}
          onFileAddressReady={props.onFileAddressReady}
        />
      ) : (
        <BireyselDelivery
          saved={props.saved}
          invoiceTarget={props.invoiceTarget}
          choice={props.choice}
          onChoiceChange={props.onChoiceChange}
          address={props.address}
          onAddressChange={props.onAddressChange}
          contractNo={props.details.contractNo}
          onContractNoChange={(contractNo) => props.onDetailsChange({ contractNo })}
          otherReceiver={props.otherReceiver}
          onOtherReceiverChange={props.onOtherReceiverChange}
          receiverName={props.receiverName}
          receiverPhone={props.receiverPhone}
          onReceiverChange={props.onReceiverChange}
        />
      )}
    </section>
  );
}
