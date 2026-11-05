"use client";

import { Building2, Coffee, Globe, Store, User } from "lucide-react";

import { groupInvalid } from "@/components/auth/fieldBinding";
import { GroupError, radioCardClass } from "@/components/auth/FormSection";
import {
  CUSTOMER_GROUPS,
  TURKISH_BUSINESS_TYPES,
  type BusinessKind,
  type CustomerGroup,
} from "@/components/auth/registrationDraft";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { registrationMessages } from "@/lib/i18n/messages/auth";

const GROUP_ICONS: Record<CustomerGroup, typeof User> = {
  INDIVIDUAL: User,
  BUSINESS: Building2,
  INTERNATIONAL: Globe,
};
const KIND_ICONS: Record<BusinessKind, typeof User> = { CAFE: Coffee, TOBACCO_SHOP: Store };

/**
 * The first question on the form, and the one that decides the rest of it:
 * who is buying. Two big answers side by side — a person, or a business — and
 * a slimmer third under them for customers abroad, who are businesses too but
 * get a form of their own (in English on the Turkish site).
 *
 * Picking one is all it takes: the fields for that answer slide open under it.
 * Nothing is picked to begin with, so a café owner cannot sign up as an
 * individual by not noticing the question.
 */
export function CustomerGroupPicker({
  value,
  onChange,
}: {
  value: CustomerGroup | null;
  onChange: (value: CustomerGroup) => void;
}) {
  const m = useMessages(registrationMessages);
  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-900 dark:text-zinc-100">{m.accountType}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {CUSTOMER_GROUPS.map((option) => {
          const Icon = GROUP_ICONS[option];
          const selected = value === option;
          const abroad = option === "INTERNATIONAL";
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 transition-[color,background-color,border-color,box-shadow] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
                abroad ? "px-4 py-3 sm:col-span-2" : "p-4 sm:p-5"
              } ${
                selected
                  ? "border-red-600 bg-red-50/70 shadow-sm dark:border-red-400 dark:bg-red-500/10"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:hover:border-white/25"
              }`}
            >
              <input
                type="radio"
                name="customer_group"
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span
                className={`flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                  abroad ? "h-9 w-9" : "h-12 w-12"
                } ${
                  selected
                    ? "bg-red-600 text-white dark:bg-red-500"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-zinc-400"
                }`}
              >
                <Icon className={abroad ? "h-4 w-4" : "h-6 w-6"} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-semibold text-slate-900 dark:text-zinc-100 ${abroad ? "text-sm" : "text-base sm:text-lg"}`}
                >
                  {m.groups[option].title}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
                  {m.groups[option].hint}
                </span>
              </span>
              {/* A radio's dot, drawn: the card is the control, and should look like one. */}
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                  selected ? "border-red-600 dark:border-red-400" : "border-slate-300 dark:border-white/25"
                }`}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-400" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A kafe or a tobacco shop: asked first in the business fields, and required. */
export function BusinessKindPicker({
  value,
  onChange,
  error,
}: {
  value: BusinessKind | null;
  onChange: (value: BusinessKind) => void;
  error?: string;
}) {
  const m = useMessages(registrationMessages);
  return (
    <fieldset {...groupInvalid(error)}>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">{m.businessKind}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {TURKISH_BUSINESS_TYPES.map((option) => {
          const Icon = KIND_ICONS[option];
          const selected = value === option;
          return (
            <label key={option} className={`${radioCardClass(selected, false, !!error)} items-center`}>
              <input
                type="radio"
                name="business_kind"
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <Icon
                className={`h-5 w-5 shrink-0 ${selected ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`}
                aria-hidden
              />
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{m.accountTypes[option]}</span>
            </label>
          );
        })}
      </div>
      {error && <GroupError>{error}</GroupError>}
    </fieldset>
  );
}
