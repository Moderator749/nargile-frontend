"use client";

import { Ship } from "lucide-react";

import { radioCardClass } from "@/components/auth/FormSection";
import {
  INTERNATIONAL_KINDS,
  type CompanyDraft,
  type InternationalAddressDraft,
} from "@/components/auth/registrationDraft";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { COUNTRIES } from "@/lib/countries";
import type { InternationalKind } from "@/types";

/**
 * The international branch of the sign-up form, in English.
 *
 * It asks for less than the Turkish branches, and for different things: a
 * company's identity abroad is a name and whatever tax number its jurisdiction
 * issued, and its address is lines, a postal code and a country rather than a
 * mahalle and an ilçe. What it asks first is what the customer buys for —
 * wholesale or their own venue — since both are businesses and that is what
 * the sales team quotes against.
 */
export function AccountKindPicker({
  value,
  onChange,
}: {
  value: InternationalKind;
  onChange: (value: InternationalKind) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">Account kind</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {INTERNATIONAL_KINDS.map(({ value: option, title, hint }) => (
          <label key={option} className={radioCardClass(value === option)}>
            <input
              type="radio"
              name="international_kind"
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span>
              <span className="block font-semibold text-slate-900 dark:text-zinc-100">{title}</span>
              <span className="block text-xs text-slate-500 dark:text-zinc-400">{hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function InternationalIdentityFields({
  kind,
  onKindChange,
  company,
  onCompanyChange,
}: {
  kind: InternationalKind;
  onKindChange: (kind: InternationalKind) => void;
  company: CompanyDraft;
  onCompanyChange: (value: CompanyDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <AccountKindPicker value={kind} onChange={onKindChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company name"
          autoComplete="organization"
          maxLength={255}
          required
          value={company.title}
          onChange={(e) => onCompanyChange({ ...company, title: e.target.value })}
        />
        <Input
          label="Tax ID / VAT number"
          maxLength={30}
          hint="Optional · any format, e.g. DE811907980"
          value={company.tax_number}
          onChange={(e) => onCompanyChange({ ...company, tax_number: e.target.value })}
        />
      </div>
    </div>
  );
}

/** Country, city/state, postal code and two lines — the shape the rest of the world writes. */
export function InternationalAddressFields({
  value,
  onChange,
}: {
  value: InternationalAddressDraft;
  onChange: (value: InternationalAddressDraft) => void;
}) {
  const set = (patch: Partial<InternationalAddressDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Select
          label="Country"
          autoComplete="country"
          required
          value={value.country}
          onChange={(e) => set({ country: e.target.value })}
        >
          <option value="">Select a country</option>
          {COUNTRIES.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-3">
        <Input
          label="City / State / Province"
          autoComplete="address-level1"
          maxLength={80}
          required
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label="Postal code / ZIP"
          autoComplete="postal-code"
          maxLength={20}
          hint="Optional"
          value={value.postal_code}
          onChange={(e) => set({ postal_code: e.target.value })}
        />
      </div>
      <div className="sm:col-span-4">
        <Input
          label="Address line 1"
          autoComplete="address-line1"
          maxLength={200}
          required
          placeholder="Street and building number"
          value={value.address_line1}
          onChange={(e) => set({ address_line1: e.target.value })}
        />
      </div>
      <div className="sm:col-span-6">
        <Input
          label="Address line 2"
          autoComplete="address-line2"
          maxLength={200}
          hint="Optional · apartment, suite, unit"
          value={value.address_line2}
          onChange={(e) => set({ address_line2: e.target.value })}
        />
      </div>
    </div>
  );
}

/** What an export order involves, said before they order rather than after. */
export function CustomsNotice() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
      <Ship className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        International orders are subject to customs clearance and export documentation. Our sales team will
        contact you regarding wholesale pricing and shipping rates.
      </span>
    </p>
  );
}
