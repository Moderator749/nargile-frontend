"use client";

import { radioCardClass } from "@/components/auth/FormSection";
import type { CompanyDraft } from "@/components/auth/registrationDraft";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Input } from "@/components/ui/Input";
import { companyFieldMessages } from "@/lib/i18n/messages/auth";
import type { BillingEntity } from "@/types";

const ENTITIES: BillingEntity[] = ["SOLE_PROPRIETOR", "COMPANY"];

/**
 * Whoever the invoice is made out to.
 *
 * The same fields serve a firm registering itself and an individual asking to
 * be invoiced in a firm's name; which kind of firm it is is always the
 * customer's own answer, because it decides the rest — a şahıs firması is a
 * person, so it may be registered under a TC number and may give one, while a
 * şirket has a 10-digit VKN and no TC number at all.
 */
export function CompanyFields({
  value,
  onChange,
  nationalId,
  onNationalIdChange,
}: {
  value: CompanyDraft;
  onChange: (value: CompanyDraft) => void;
  /** Pass both to offer the owner's TC number where it applies. */
  nationalId?: string;
  onNationalIdChange?: (value: string) => void;
}) {
  const m = useMessages(companyFieldMessages);
  const set = (patch: Partial<CompanyDraft>) => onChange({ ...value, ...patch });
  const company = value.entity_type === "COMPANY";
  // What a tax plate carries depends on whose it is: a company's name, or the
  // name of the person who is the şahıs firması. Until they say which, it says
  // both.
  const plateLabel =
    value.entity_type === "SOLE_PROPRIETOR"
      ? m.plateSole
      : company
        ? m.plateCompany
        : m.plateEither;
  // Shown for a şahıs firması, which is a person; a şirket is not one.
  const askTc = value.entity_type === "SOLE_PROPRIETOR" && onNationalIdChange !== undefined;

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">{m.entityType}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ENTITIES.map((option) => (
            <label key={option} className={radioCardClass(value.entity_type === option)}>
              <input
                type="radio"
                name="billing_entity_type"
                value={option}
                checked={value.entity_type === option}
                onChange={() => set({ entity_type: option })}
                className="sr-only"
              />
              <span className="font-medium text-slate-900 dark:text-zinc-100">{m.entities[option]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={m.title}
          autoComplete="organization"
          maxLength={255}
          required
          value={value.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder={m.titlePlaceholder}
        />
        <Input
          label={plateLabel}
          maxLength={150}
          required
          hint={m.plateHint}
          value={value.tax_plate_name}
          onChange={(e) => set({ tax_plate_name: e.target.value })}
        />
      </div>

      <div className={`grid gap-4 ${askTc ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <Input
          label={m.taxOffice}
          maxLength={100}
          required
          value={value.tax_office}
          onChange={(e) => set({ tax_office: e.target.value })}
        />
        <Input
          label={m.taxNumber}
          inputMode="numeric"
          // Ten for a şirket. A sole trader's levha may still carry their
          // 11-digit TC as its vergi no, so the field does not cut one short —
          // the hint names the usual case, and the TC has a field of its own.
          maxLength={company ? 10 : 11}
          required
          hint={m.taxNumberHint}
          value={value.tax_number}
          onChange={(e) => set({ tax_number: e.target.value.replace(/\D/g, "") })}
        />
        {askTc && (
          <Input
            label={m.nationalId}
            inputMode="numeric"
            maxLength={11}
            hint={m.optional}
            value={nationalId ?? ""}
            onChange={(e) => onNationalIdChange(e.target.value.replace(/\D/g, ""))}
          />
        )}
      </div>
    </div>
  );
}
