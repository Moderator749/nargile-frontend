"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Building2, Home, MapPin, Plus } from "lucide-react";

import { addressSummary, TURKEY } from "@/components/cart/delivery/addressDraft";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { addAddress, deleteAddress, editAddress, fetchAddressBook } from "@/lib/accountApi";
import { countryName, countryOptions } from "@/lib/countries";
import { getApiErrorMessage } from "@/lib/errors";
import { addressBookMessages } from "@/lib/i18n/messages/account";
import { TR_PROVINCES } from "@/lib/provinces";
import type { AddressBookEntry, AddressBookInput, User } from "@/types";

/** As many delivery addresses as the server keeps (SHIPPING_ADDRESS_LIMIT). */
const SHIPPING_LIMIT = 10;

const inputClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-zinc-300";
const linkButton = "text-sm font-medium text-red-600 hover:underline dark:text-red-400";

/** The form being filled: a new delivery address, or an entry being edited. */
type Editing = { id: number | null; withLabel: boolean; draft: AddressBookInput };

const NEW_DRAFT: AddressBookInput = { label: "", country: TURKEY, city: "", district: "", postal_code: "", line: "" };

function draftOf(entry: AddressBookEntry): AddressBookInput {
  return {
    label: entry.kind === "SHIPPING" ? entry.label : null,
    country: entry.country,
    city: entry.city,
    district: entry.district ?? "",
    postal_code: entry.postal_code ?? "",
    line: entry.line,
  };
}

/**
 * "Adreslerim": the invoice address sign-up took (or the old store brought
 * over) and the delivery addresses kept beside it, each offered as a card at
 * checkout. An individual adds, edits and deletes delivery addresses and
 * corrects their own invoice address; a firm sees the address it registered,
 * which is where its orders go.
 */
export function AddressBookPanel({ user }: { user: User }) {
  const locale = useLocale();
  const m = useMessages(addressBookMessages);
  const individual = user.account_type === "INDIVIDUAL";
  const [entries, setEntries] = useState<AddressBookEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchAddressBook(controller.signal)
      .then(setEntries)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, m.loadFailed));
      });
    return () => controller.abort();
  }, [m.loadFailed]);

  const shippingCount = entries?.filter((e) => e.kind === "SHIPPING").length ?? 0;

  function open(next: Editing) {
    setEditing(next);
    setConfirming(null);
    setError(null);
    setNotice(null);
  }

  function problem(d: AddressBookInput): string | null {
    if (d.country === TURKEY) {
      if (!d.city) return m.problems.city;
      if ((d.district ?? "").trim().length < 2) return m.problems.district;
    } else {
      if (!d.country) return m.problems.country;
      if (d.city.trim().length < 2) return m.problems.cityAbroad;
    }
    return d.line.trim().length < 5 ? m.problems.line : null;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const found = problem(editing.draft);
    if (found) return setError(found);
    const body: AddressBookInput = {
      ...editing.draft,
      label: editing.withLabel ? editing.draft.label?.trim() || null : null,
      district: editing.draft.district?.trim() || null,
      postal_code: editing.draft.postal_code?.trim() || null,
    };
    setBusy(true);
    setError(null);
    try {
      const saved = editing.id === null ? await addAddress(body) : await editAddress(editing.id, body);
      setEntries((list) =>
        editing.id === null ? [...(list ?? []), saved] : (list ?? []).map((e) => (e.id === saved.id ? saved : e)),
      );
      setEditing(null);
      setNotice(m.saved);
    } catch (err) {
      setError(getApiErrorMessage(err, m.saveFailed));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setError(null);
    try {
      await deleteAddress(id);
      setEntries((list) => (list ?? []).filter((e) => e.id !== id));
      setConfirming(null);
      setNotice(m.removed);
    } catch (err) {
      setError(getApiErrorMessage(err, m.removeFailed));
    } finally {
      setBusy(false);
    }
  }

  const form = editing && (
    <form onSubmit={save} noValidate className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 dark:border-white/10">
      {editing.withLabel && (
        <div className="space-y-1.5 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
          <label htmlFor="book-label" className={labelClass}>
            {m.label}
          </label>
          <input
            id="book-label"
            maxLength={60}
            placeholder={m.labelPlaceholder}
            value={editing.draft.label ?? ""}
            onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, label: e.target.value } })}
            className={inputClass}
          />
        </div>
      )}
      {editing.draft.country === TURKEY ? (
        <>
          <div className="space-y-1.5">
            <label htmlFor="book-city" className={labelClass}>
              {m.city}
            </label>
            <select
              id="book-city"
              autoComplete="address-level1"
              value={editing.draft.city}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, city: e.target.value } })}
              className={inputClass}
            >
              <option value="">{m.citySelect}</option>
              {TR_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="book-district" className={labelClass}>
              {m.district}
            </label>
            <input
              id="book-district"
              autoComplete="address-level2"
              maxLength={80}
              value={editing.draft.district ?? ""}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, district: e.target.value } })}
              className={inputClass}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label htmlFor="book-country" className={labelClass}>
              {m.country}
            </label>
            <select
              id="book-country"
              autoComplete="country"
              value={editing.draft.country}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, country: e.target.value } })}
              className={inputClass}
            >
              {countryOptions(locale).map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="book-city" className={labelClass}>
              {m.city}
            </label>
            <input
              id="book-city"
              maxLength={80}
              value={editing.draft.city}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, city: e.target.value } })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="book-postal" className={labelClass}>
              {m.postal}
            </label>
            <input
              id="book-postal"
              autoComplete="postal-code"
              maxLength={20}
              value={editing.draft.postal_code ?? ""}
              onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, postal_code: e.target.value } })}
              className={inputClass}
            />
          </div>
        </>
      )}
      <div className="space-y-1.5 sm:col-span-2">
        <label htmlFor="book-line" className={labelClass}>
          {m.line}
        </label>
        <textarea
          id="book-line"
          autoComplete="street-address"
          rows={2}
          maxLength={200}
          placeholder={m.linePlaceholder}
          value={editing.draft.line}
          onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, line: e.target.value } })}
          className={`${inputClass} h-auto resize-y py-2.5`}
        />
      </div>
      {error && (
        <div className="sm:col-span-2">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={busy} className="w-auto px-8">
          {m.save}
        </Button>
        <Button type="button" variant="secondary" className="w-auto px-6" onClick={() => setEditing(null)}>
          {m.cancel}
        </Button>
      </div>
    </form>
  );

  return (
    <section aria-labelledby="address-book-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <h2 id="address-book-heading" className="text-lg font-bold tracking-tight">
        {m.heading}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{individual ? m.intro : m.firmIntro}</p>

      <div className="mt-4 space-y-3">
        {loadError ? (
          <Alert variant="error">{loadError}</Alert>
        ) : entries === null ? (
          <div className="h-24 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
        ) : (
          <>
            {entries.length === 0 && !editing && <p className="text-sm text-slate-500 dark:text-zinc-400">{m.empty}</p>}
            <ul className="space-y-3">
              {entries.map((entry) => {
                const Icon = entry.kind === "SHIPPING" ? Home : entry.kind === "CORPORATE_BILLING" || !individual ? Building2 : MapPin;
                if (editing?.id === entry.id) return <li key={entry.id}>{form}</li>;
                const note = entry.deletable
                  ? null
                  : entry.kind === "CORPORATE_BILLING"
                    ? m.corporateNote
                    : entry.editable
                      ? m.invoiceNote
                      : m.registeredNote;
                return (
                  <li key={entry.id} className="flex gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        {entry.kind === "SHIPPING"
                          ? entry.label
                          : entry.kind === "CORPORATE_BILLING" || !individual
                            ? m.corporateTitle
                            : m.billingTitle}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-zinc-300">
                        {addressSummary(entry, (code) => countryName(code, locale))}
                      </p>
                      {note && <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{note}</p>}
                      {confirming === entry.id ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <span className="text-sm">{m.confirmRemove(entry.label)}</span>
                          <button type="button" disabled={busy} onClick={() => remove(entry.id)} className={linkButton}>
                            {m.remove}
                          </button>
                          <button type="button" onClick={() => setConfirming(null)} className="text-sm text-slate-500 hover:underline dark:text-zinc-400">
                            {m.cancel}
                          </button>
                        </div>
                      ) : (
                        (entry.editable || entry.deletable) && (
                          <div className="mt-2 flex gap-4">
                            {entry.editable && (
                              <button
                                type="button"
                                onClick={() => open({ id: entry.id, withLabel: entry.kind === "SHIPPING", draft: draftOf(entry) })}
                                className={linkButton}
                              >
                                {m.edit}
                              </button>
                            )}
                            {entry.deletable && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirming(entry.id);
                                  setEditing(null);
                                  setNotice(null);
                                }}
                                className={linkButton}
                              >
                                {m.remove}
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {editing?.id === null && form}
            {error && !editing && <Alert variant="error">{error}</Alert>}
            {notice && !editing && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400" role="status">
                {notice}
              </p>
            )}

            {individual && !editing && (
              shippingCount < SHIPPING_LIMIT ? (
                <button
                  type="button"
                  onClick={() => open({ id: null, withLabel: true, draft: NEW_DRAFT })}
                  className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-zinc-100 dark:ring-white/15 dark:hover:bg-white/5"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {m.add}
                </button>
              ) : (
                <p className="text-xs text-slate-500 dark:text-zinc-400">{m.limit(SHIPPING_LIMIT)}</p>
              )
            )}
          </>
        )}
      </div>
    </section>
  );
}
