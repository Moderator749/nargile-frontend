"use client";

import { Bike, Truck } from "lucide-react";

import { ISTANBUL, TR_PROVINCES } from "@/lib/provinces";
import type { ShippingAddress, ShippingMethod } from "@/types";

export type AddressDraft = ShippingAddress;

export const EMPTY_ADDRESS: AddressDraft = { full_name: "", phone: "", city: "", district: "", line: "" };

/** Client-side check mirroring the server's; null = ready to order. */
export function addressProblem(a: AddressDraft): string | null {
  if (a.full_name.trim().length < 2) return "Teslimat için ad soyad girin.";
  if (a.phone.replace(/\D/g, "").length < 10) return "Geçerli bir telefon numarası girin.";
  if (!a.city) return "İl seçin.";
  if (a.district.trim().length < 2) return "İlçe girin.";
  if (a.line.trim().length < 5) return "Açık adresi girin.";
  return null;
}

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";

interface DeliveryFormProps {
  method: ShippingMethod;
  onMethodChange: (method: ShippingMethod) => void;
  address: AddressDraft;
  onAddressChange: (address: AddressDraft) => void;
}

/** Delivery address and method. The Istanbul courier is offered only for Istanbul addresses. */
export function DeliveryForm({ method, onMethodChange, address, onAddressChange }: DeliveryFormProps) {
  const set = (patch: Partial<AddressDraft>) => onAddressChange({ ...address, ...patch });
  const inIstanbul = address.city === ISTANBUL;

  const options: {
    value: ShippingMethod;
    title: string;
    hint: string;
    Icon: typeof Truck;
    disabled: boolean;
  }[] = [
    { value: "CARGO", title: "Kargo", hint: "₺3.000 üzeri ücretsiz", Icon: Truck, disabled: false },
    {
      value: "COURIER_ISTANBUL",
      title: "İstanbul İçi Kurye",
      hint: inIstanbul ? "Aynı gün, 10:00 – 20:00 · ücret teslimatta" : "Yalnızca İstanbul adresleri",
      Icon: Bike,
      disabled: !inIstanbul,
    },
  ];

  return (
    <section
      aria-labelledby="delivery-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6"
    >
      <h2 id="delivery-heading" className="text-lg font-bold tracking-tight">
        Teslimat
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="addr-name" className={labelClass}>
            Ad Soyad
          </label>
          <input id="addr-name" autoComplete="name" maxLength={120} value={address.full_name} onChange={(e) => set({ full_name: e.target.value })} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="addr-phone" className={labelClass}>
            Telefon
          </label>
          <input id="addr-phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="05xx xxx xx xx" value={address.phone} onChange={(e) => set({ phone: e.target.value })} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="addr-city" className={labelClass}>
            İl
          </label>
          <select
            id="addr-city"
            autoComplete="address-level1"
            value={address.city}
            onChange={(e) => {
              set({ city: e.target.value });
              // The courier only serves Istanbul: leaving it falls back to cargo.
              if (e.target.value !== ISTANBUL && method === "COURIER_ISTANBUL") onMethodChange("CARGO");
            }}
            className={inputClass}
          >
            <option value="">İl seçin</option>
            {TR_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="addr-district" className={labelClass}>
            İlçe
          </label>
          <input id="addr-district" autoComplete="address-level2" maxLength={80} value={address.district} onChange={(e) => set({ district: e.target.value })} className={inputClass} />
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
            value={address.line}
            onChange={(e) => set({ line: e.target.value })}
            placeholder="Mahalle, cadde/sokak, bina ve daire no"
            className={`${inputClass} h-auto resize-y py-2.5`}
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className={labelClass}>Teslimat yöntemi</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map(({ value, title, hint, Icon, disabled }) => (
            <label
              key={value}
              className={`flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
                disabled
                  ? "cursor-not-allowed border-slate-200 opacity-60 dark:border-white/10"
                  : method === value
                    ? "cursor-pointer border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
                    : "cursor-pointer border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="shipping_method"
                value={value}
                checked={method === value}
                disabled={disabled}
                onChange={() => onMethodChange(value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-zinc-100">
                <Icon className="h-4 w-4" aria-hidden /> {title}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
