"use client";

import { COUNTRIES } from "@/lib/countries";
import { TR_PROVINCES } from "@/lib/provinces";
import { TURKEY, type AddressDraft } from "@/components/cart/delivery/addressDraft";

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";

/**
 * Where this order goes, typed out.
 *
 * Two shapes, because two kinds of carrier read them: a Turkish address routes
 * on a province and an ilçe, an address abroad on a country and a postal code.
 * The fields are the same ones sign-up asks for, so a customer who gave an
 * address there recognises this one.
 */
export function AddressFields({
  value,
  onChange,
  /** An export order: country, state and postal code instead of il / ilçe. */
  abroad,
  /**
   * Hold the delivery location: the fields that say *where* are shown filled in
   * and read-only, the ones that say *where exactly* stay editable. A firm
   * corrects its street, not its city.
   */
  lockPlace = false,
}: {
  value: AddressDraft;
  onChange: (value: AddressDraft) => void;
  abroad: boolean;
  lockPlace?: boolean;
}) {
  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });
  const locked = lockPlace
    ? { disabled: true, "aria-describedby": "addr-place-note", className: `${inputClass} cursor-not-allowed opacity-70` }
    : { className: inputClass };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {lockPlace && (
        <p id="addr-place-note" className="text-xs text-slate-500 sm:col-span-2 dark:text-zinc-400">
          {abroad
            ? "The country and city come from your registered invoice address."
            : "İl ve ilçe kayıtlı fatura adresinizden gelir."}
        </p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="addr-name" className={labelClass}>
          {abroad ? "Recipient name" : "Ad Soyad"}
        </label>
        <input
          id="addr-name"
          autoComplete="name"
          maxLength={120}
          value={value.full_name}
          onChange={(e) => set({ full_name: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="addr-phone" className={labelClass}>
          {abroad ? "Phone" : "Telefon"}
        </label>
        <input
          id="addr-phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          maxLength={30}
          placeholder={abroad ? "+49 30 1234 5678" : "05xx xxx xx xx"}
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value })}
          className={inputClass}
        />
      </div>

      {abroad ? (
        <>
          <div className="space-y-1.5">
            <label htmlFor="addr-country" className={labelClass}>
              Country
            </label>
            <select
              id="addr-country"
              autoComplete="country"
              value={value.country === TURKEY ? "" : value.country}
              onChange={(e) => set({ country: e.target.value })}
              {...locked}
            >
              <option value="">Select a country</option>
              {COUNTRIES.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-city" className={labelClass}>
              City / State / Province
            </label>
            <input
              id="addr-city"
              autoComplete="address-level1"
              maxLength={80}
              value={value.city}
              onChange={(e) => set({ city: e.target.value })}
              {...locked}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-postal" className={labelClass}>
              Postal code / ZIP
            </label>
            <input
              id="addr-postal"
              autoComplete="postal-code"
              maxLength={20}
              value={value.postal_code}
              onChange={(e) => set({ postal_code: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="addr-line" className={labelClass}>
              Address
            </label>
            <textarea
              id="addr-line"
              autoComplete="street-address"
              rows={2}
              maxLength={300}
              value={value.line}
              onChange={(e) => set({ line: e.target.value })}
              placeholder="Street and building number, apartment, suite"
              className={`${inputClass} h-auto resize-y py-2.5`}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label htmlFor="addr-city" className={labelClass}>
              İl
            </label>
            <select
              id="addr-city"
              autoComplete="address-level1"
              value={value.city}
              onChange={(e) => set({ city: e.target.value })}
              {...locked}
            >
              <option value="">İl seçin</option>
              {TR_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-district" className={labelClass}>
              İlçe
            </label>
            <input
              id="addr-district"
              autoComplete="address-level2"
              maxLength={80}
              value={value.district}
              onChange={(e) => set({ district: e.target.value })}
              {...locked}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="addr-line" className={labelClass}>
              Açık adres
            </label>
            <textarea
              id="addr-line"
              autoComplete="street-address"
              rows={2}
              maxLength={300}
              value={value.line}
              onChange={(e) => set({ line: e.target.value })}
              placeholder="Mahalle, cadde/sokak, bina ve daire no"
              className={`${inputClass} h-auto resize-y py-2.5`}
            />
          </div>
        </>
      )}
    </div>
  );
}

