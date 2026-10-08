"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TR_PROVINCES } from "@/lib/provinces";
import type { AddressDraft } from "@/components/auth/registrationDraft";

/**
 * A Turkish address field by field, the way an invoice and a cargo label need
 * it. One free-text line is quicker to type and impossible to use later: this
 * is the same seven fields the sign-up blueprint asks for.
 */
export function AddressFields({
  value,
  onChange,
  required,
}: {
  value: AddressDraft;
  onChange: (value: AddressDraft) => void;
  /** Marks district and province as required; the rest is never mandatory. */
  required: boolean;
}) {
  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Input
          label="Mahalle / Köy"
          autoComplete="address-level3"
          maxLength={120}
          value={value.neighbourhood}
          onChange={(e) => set({ neighbourhood: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3">
        <Input
          label="Cadde / Sokak"
          autoComplete="street-address"
          maxLength={120}
          value={value.street}
          onChange={(e) => set({ street: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Bina No"
          maxLength={20}
          value={value.building_no}
          onChange={(e) => set({ building_no: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Bina Adı"
          maxLength={120}
          value={value.building_name}
          onChange={(e) => set({ building_name: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Kapı No"
          maxLength={20}
          value={value.door_no}
          onChange={(e) => set({ door_no: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3">
        <Input
          label="İlçe"
          autoComplete="address-level2"
          maxLength={80}
          required={required}
          value={value.district}
          onChange={(e) => set({ district: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3">
        <Select
          label="Şehir"
          autoComplete="address-level1"
          required={required}
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
        >
          <option value="">Şehir seçin</option>
          {TR_PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
