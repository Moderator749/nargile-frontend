"use client";

import { useState, type FormEvent } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/lib/accountApi";
import { fetchMe } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { profileMessages } from "@/lib/i18n/messages/account";
import { isValidInternationalPhone, isValidPhone } from "@/lib/trIdentity";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/types";

/** "Ayşe Nur Kaya" → ["Ayşe Nur", "Kaya"]: the account keeps one name field. */
function splitName(full: string | null): [string, string] {
  const words = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [words[0] ?? "", ""];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}

/** As the server reads it: a number with its own dialling code is held to the
 *  international rule, anything else is Turkish. */
function phoneOk(value: string): boolean {
  const given = value.trim();
  return given.startsWith("+") || given.replace(/\s/g, "").startsWith("00")
    ? isValidInternationalPhone(given)
    : isValidPhone(given);
}

/** "Hesap bilgilerim": the name and number orders go out under. */
export function ProfilePanel({ user }: { user: User }) {
  const m = useMessages(profileMessages);
  const [initialFirst, initialLast] = splitName(user.full_name);
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    if (!first.trim() || !last.trim()) return setError(m.nameProblem);
    if (!phoneOk(phone)) return setError(m.phoneProblem);
    setError(null);
    setSaving(true);
    try {
      await updateProfile({ full_name: `${first.trim()} ${last.trim()}`, phone: phone.trim() });
      useAuthStore.getState().setUser(await fetchMe());
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err, m.saveFailed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="profile-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <h2 id="profile-heading" className="text-lg font-bold tracking-tight">
        {m.heading}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{m.intro}</p>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input label={m.firstName} name="given-name" autoComplete="given-name" maxLength={75} value={first} onChange={(e) => setFirst(e.target.value)} />
        <Input label={m.lastName} name="family-name" autoComplete="family-name" maxLength={75} value={last} onChange={(e) => setLast(e.target.value)} />
        <Input
          label={m.phone}
          type="tel"
          name="tel"
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
          maxLength={30}
          placeholder={m.phonePlaceholder}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rtl:text-right"
        />
        <Input label={m.email} type="email" value={user.email} disabled readOnly hint={m.emailNote} dir="ltr" className="rtl:text-right" />
        <div className="space-y-3 sm:col-span-2">
          {error && <Alert variant="error">{error}</Alert>}
          {saved && !error && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400" role="status">
              {m.saved}
            </p>
          )}
          <Button type="submit" loading={saving} className="sm:w-auto sm:px-8">
            {m.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
