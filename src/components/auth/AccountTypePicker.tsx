"use client";

import { Building2, Coffee, Globe, Store, User } from "lucide-react";

import { ACCOUNT_TYPES } from "@/components/auth/registrationDraft";
import type { AccountType } from "@/types";

const ICONS: Record<AccountType, typeof User> = {
  INDIVIDUAL: User,
  CAFE: Coffee,
  TOBACCO_SHOP: Store,
  INTERNATIONAL: Globe,
  // The two cards these replaced; kept so a legacy account type still has a face.
  SOLE_PROPRIETOR: Store,
  COMPANY: Building2,
};

/**
 * The first choice on the form, and the one that decides the rest of it.
 *
 * Nothing opens until a card's own button is pressed: four short cards are
 * read in a glance, where four cards above a long form are skimmed past. A name
 * and a button is all each one needs — what the choice means is in the fields it
 * reveals, not in a line of explanation nobody reads twice.
 *
 * The card and its button do different things — the card picks, the button
 * picks and begins — so the button is a sibling of the label rather than inside
 * it, which would make one click do both by accident.
 */
export function AccountTypePicker({
  value,
  opened,
  formId,
  onChange,
  onRegister,
}: {
  value: AccountType;
  /** Whether the form below is already showing. */
  opened: boolean;
  /** The region the buttons disclose, for screen readers. */
  formId: string;
  onChange: (value: AccountType) => void;
  onRegister: (value: AccountType) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-zinc-300">Hesap türü</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ACCOUNT_TYPES.map(({ value: option, title, cta }) => {
          const Icon = ICONS[option];
          const selected = value === option;
          return (
            <div
              key={option}
              className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
                selected
                  ? "border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
                  : "border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/25"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="radio"
                  name="account_type"
                  value={option}
                  checked={selected}
                  onChange={() => onChange(option)}
                  className="sr-only"
                />
                <Icon
                  className={`h-5 w-5 shrink-0 ${selected ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`}
                  aria-hidden
                />
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{title}</span>
              </label>
              <button
                type="button"
                onClick={() => onRegister(option)}
                aria-expanded={selected && opened}
                aria-controls={formId}
                className={`mt-auto h-9 w-full rounded-lg text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${
                  selected
                    ? "bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
                    : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
                }`}
              >
                {cta}
              </button>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
