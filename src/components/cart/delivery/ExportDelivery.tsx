"use client";

import { MapPin, Plane, Ship, Truck, type LucideIcon } from "lucide-react";

import { AddressFields } from "@/components/cart/delivery/AddressFields";
import { addressSummary, billingIndex, type AddressDraft } from "@/components/cart/delivery/addressDraft";
import { DeliveryCard } from "@/components/cart/delivery/DeliveryCard";
import { countryName } from "@/lib/countries";
import { TRANSPORT_OPTIONS } from "@/lib/exportAccount";
import type { SavedAddress, TransportMode } from "@/types";

const ICONS: Record<TransportMode, LucideIcon> = { ROAD: Truck, AIR: Plane, SEA: Ship };

const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";
const noteClass = "text-xs text-slate-500 dark:text-zinc-400";

/**
 * Delivery for an export order request.
 *
 * The address is read, not asked for. It is the one the account registered —
 * the address the export prices and the paperwork were quoted against — so it
 * is shown as it stands rather than offered as a form to edit at checkout.
 * The exception is an account with nothing usable on file, which would
 * otherwise be stuck behind a button it cannot press: then, and only then, the
 * fields come back.
 *
 * What the customer does choose is how it travels. Road, air and sea are not
 * priced here — the quote that follows prices them, once the packages and the
 * weight are known — so each is a card to confirm rather than a tariff to
 * compare, and one of them must be confirmed before the request can be sent.
 */
export function ExportDelivery({
  saved,
  address,
  onAddressChange,
  addressReady,
  transportMode,
  onTransportModeChange,
}: {
  /** Addresses on file; null while they load. */
  saved: SavedAddress[] | null;
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
  /** False when nothing on file can be shipped to, which brings the form back. */
  addressReady: boolean;
  transportMode: TransportMode | null;
  onTransportModeChange: (mode: TransportMode) => void;
}) {
  // The same address the order will carry: the cart reads this one too.
  const registered = saved && saved.length > 0 ? saved[billingIndex(saved)] : null;
  const readOnly = registered !== null && addressReady;

  return (
    <>
      <section aria-labelledby="export-address-heading" className="mt-5">
        <h3 id="export-address-heading" className={labelClass}>
          Delivery address
        </h3>

        {saved === null ? (
          // One line either way, so nothing moves when the address lands.
          <p
            className="mt-2 h-16 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5"
            aria-busy
          />
        ) : readOnly ? (
          <div className="mt-2 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/[0.02]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900 dark:text-zinc-100">
                {registered.full_name}
              </span>
              <span className={`block ${noteClass}`}>{addressSummary(registered, countryName)}</span>
              <span className={`mt-1 block ${noteClass}`}>
                Your registered account address. To change it, update your profile.
              </span>
            </span>
          </div>
        ) : (
          <>
            <p className={`mt-1 ${noteClass}`}>
              {registered
                ? "Your registered address is not complete enough to ship to; please fill in the fields below."
                : "There is no address on your account yet; please enter where the goods should go."}
            </p>
            <div className="mt-2">
              <AddressFields value={address} onChange={onAddressChange} abroad lockPlace={false} />
            </div>
          </>
        )}
      </section>

      <fieldset className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
        <legend className={labelClass}>Delivery information</legend>
        <p className={`mt-1 ${noteClass}`}>
          Choose how your order should travel. Freight and customs are quoted after the
          request, against the option you confirm here.
        </p>
        <div className="mt-2 space-y-2">
          {TRANSPORT_OPTIONS.map(({ value, title, note }) => (
            <DeliveryCard
              key={value}
              name="export_transport"
              selected={transportMode === value}
              onSelect={() => onTransportModeChange(value)}
              title={title}
              summary={note}
              Icon={ICONS[value]}
            />
          ))}
        </div>
      </fieldset>
    </>
  );
}
