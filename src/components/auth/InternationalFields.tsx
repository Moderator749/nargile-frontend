"use client";

import { useMemo } from "react";
import { Ship } from "lucide-react";

import { radioCardClass } from "@/components/auth/FormSection";
import {
  INTERNATIONAL_KINDS,
  type CompanyDraft,
  type InternationalAddressDraft,
} from "@/components/auth/registrationDraft";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { COUNTRIES } from "@/lib/countries";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { internationalMessages } from "@/lib/i18n/messages/auth";
import type { InternationalKind } from "@/types";

/**
 * The international branch of the sign-up form: in English on the Turkish
 * and English sites, in Arabic on the Arabic one.
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
  const m = useMessages(internationalMessages);
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">{m.kind}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {INTERNATIONAL_KINDS.map(({ value: option }) => (
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
              <span className="block font-semibold text-slate-900 dark:text-zinc-100">{m.kinds[option].title}</span>
              <span className="block text-xs text-slate-500 dark:text-zinc-400">{m.kinds[option].hint}</span>
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
  const m = useMessages(internationalMessages);
  return (
    <div className="space-y-4">
      <AccountKindPicker value={kind} onChange={onKindChange} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={m.companyName}
          autoComplete="organization"
          maxLength={255}
          required
          value={company.title}
          onChange={(e) => onCompanyChange({ ...company, title: e.target.value })}
        />
        <Input
          label={m.taxId}
          maxLength={30}
          hint={m.taxIdHint}
          value={company.tax_number}
          onChange={(e) => onCompanyChange({ ...company, tax_number: e.target.value })}
        />
      </div>
    </div>
  );
}

/**
 * The countries in the page's language: lib/countries' English names as they
 * are, any other language's from the browser's own region names, sorted for
 * that language.
 */
function useCountries() {
  const locale = useLocale();
  return useMemo(() => {
    if (locale !== "ar") return COUNTRIES;
    const names = new Intl.DisplayNames([INTL_LOCALE[locale]], { type: "region" });
    const collator = new Intl.Collator(INTL_LOCALE[locale]);
    return COUNTRIES.map(({ code, name }) => ({ code, name: names.of(code) ?? name })).sort((a, b) =>
      collator.compare(a.name, b.name),
    );
  }, [locale]);
}

/** Country, city/state, postal code and two lines — the shape the rest of the world writes. */
export function InternationalAddressFields({
  value,
  onChange,
}: {
  value: InternationalAddressDraft;
  onChange: (value: InternationalAddressDraft) => void;
}) {
  const m = useMessages(internationalMessages);
  const countries = useCountries();
  const set = (patch: Partial<InternationalAddressDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-3">
        <Select
          label={m.country}
          autoComplete="country"
          required
          value={value.country}
          onChange={(e) => set({ country: e.target.value })}
        >
          <option value="">{m.selectCountry}</option>
          {countries.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-3">
        <Input
          label={m.city}
          autoComplete="address-level1"
          maxLength={80}
          required
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          label={m.postalCode}
          autoComplete="postal-code"
          maxLength={20}
          hint={m.optional}
          value={value.postal_code}
          onChange={(e) => set({ postal_code: e.target.value })}
        />
      </div>
      <div className="sm:col-span-4">
        <Input
          label={m.line1}
          autoComplete="address-line1"
          maxLength={200}
          required
          placeholder={m.line1Placeholder}
          value={value.address_line1}
          onChange={(e) => set({ address_line1: e.target.value })}
        />
      </div>
      <div className="sm:col-span-6">
        <Input
          label={m.line2}
          autoComplete="address-line2"
          maxLength={200}
          hint={m.line2Hint}
          value={value.address_line2}
          onChange={(e) => set({ address_line2: e.target.value })}
        />
      </div>
    </div>
  );
}

/** What an export order involves, said before they order rather than after. */
export function CustomsNotice() {
  const m = useMessages(internationalMessages);
  return (
    <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
      <Ship className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{m.customs}</span>
    </p>
  );
}
