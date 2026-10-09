"use client";

import { MapPin, Ship } from "lucide-react";

import { AddressFields } from "@/components/cart/delivery/AddressFields";
import type { AddressDraft } from "@/components/cart/delivery/addressDraft";
import { shippingOption } from "@/lib/shipping";

const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";

/**
 * Delivery for an export order.
 *
 * It goes to the address the customer registered, the one the prices and the
 * paperwork were quoted against, so the country and the city are held and the
 * rest is theirs to correct. There is one way for it to travel and no price to
 * put on it yet, so this says so rather than offering a choice.
 */
export function ExportDelivery({
  address,
  onAddressChange,
  lockPlace,
}: {
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
  /** False only for an account with nothing on file, which has to type one. */
  lockPlace: boolean;
}) {
  return (
    <>
      {lockPlace && (
        <p className="mt-5 flex gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:bg-white/5 dark:text-zinc-300">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>Your order is delivered to your registered invoice address.</span>
        </p>
      )}

      <div className="mt-5">
        <AddressFields value={address} onChange={onAddressChange} abroad lockPlace={lockPlace} />
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
        <p className={labelClass}>Kargo</p>
        <div className="mt-2 flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.02]">
          <Ship className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
          <span>
            <span className="block font-semibold text-slate-900 dark:text-zinc-100">
              {shippingOption("INTERNATIONAL_FREIGHT").title}
            </span>
            <span className="block text-xs text-slate-500 dark:text-zinc-400">
              Kargo bedeli sipariş sonrasında belirlenecektir.
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
