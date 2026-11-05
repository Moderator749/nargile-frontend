"use client";

import { UNBOUND, type Bind } from "@/components/auth/fieldBinding";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { companyFieldMessages } from "@/lib/i18n/messages/auth";
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
  prefix,
  bind = UNBOUND,
}: {
  value: AddressDraft;
  onChange: (value: AddressDraft) => void;
  /** Marks district and province as required; the rest is never mandatory. */
  required: boolean;
  /** Which address this is, for the form's checks. */
  prefix: "billing" | "corporate";
  bind?: Bind;
}) {
  const m = useMessages(companyFieldMessages).address;
  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });
  // One rule covers the pair — a mahalle/köy or a cadde/sokak — so both turn
  // red, and the message is said once, under the first.
  const pair = bind(`${prefix}.street`);

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Input
          label={m.neighbourhood}
          autoComplete="address-level3"
          maxLength={120}
          {...pair}
          value={value.neighbourhood}
          onChange={(e) => set({ neighbourhood: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3">
        <Input
          label={m.street}
          autoComplete="street-address"
          maxLength={120}
          onBlur={pair.onBlur}
          invalid={!!pair.error}
          value={value.street}
          onChange={(e) => set({ street: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label={m.buildingNo}
          maxLength={20}
          value={value.building_no}
          onChange={(e) => set({ building_no: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label={m.buildingName}
          maxLength={120}
          value={value.building_name}
          onChange={(e) => set({ building_name: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label={m.doorNo}
          maxLength={20}
          value={value.door_no}
          onChange={(e) => set({ door_no: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3">
        <Input
          label={m.district}
          autoComplete="address-level2"
          {...bind(`${prefix}.district`)}
          maxLength={80}
          required={required}
          value={value.district}
          onChange={(e) => set({ district: e.target.value })}
        />
      </div>
      <div className="sm:col-span-3">
        <Select
          label={m.city}
          autoComplete="address-level1"
          {...bind(`${prefix}.city`)}
          required={required}
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
        >
          <option value="">{m.selectCity}</option>
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
