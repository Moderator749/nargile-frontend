"use client";

import { useState, type FormEvent } from "react";

import { MIN_PASSWORD_LENGTH } from "@/components/auth/registrationDraft";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { changePassword } from "@/lib/accountApi";
import { getApiErrorMessage } from "@/lib/errors";
import { passwordMessages } from "@/lib/i18n/messages/account";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * "Şifre değiştir". The server ends every other session with the old
 * password and hands this one a fresh token, which is kept here.
 */
export function PasswordPanel() {
  const m = useMessages(passwordMessages);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    if (!current) return setError(m.missingCurrent);
    if (next.length < MIN_PASSWORD_LENGTH) return setError(m.tooShort(MIN_PASSWORD_LENGTH));
    if (next !== repeat) return setError(m.mismatch);
    setError(null);
    setSaving(true);
    try {
      const { access_token } = await changePassword(current, next);
      const { user, setAuth } = useAuthStore.getState();
      if (user) setAuth(access_token, user);
      setCurrent("");
      setNext("");
      setRepeat("");
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err, m.saveFailed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="password-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <h2 id="password-heading" className="text-lg font-bold tracking-tight">
        {m.heading}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{m.intro}</p>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
          <Input label={m.current} type="password" name="current-password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <Input
          label={m.next}
          type="password"
          name="new-password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={m.minimum(MIN_PASSWORD_LENGTH)}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input label={m.repeat} type="password" name="repeat-password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        <div className="space-y-3 sm:col-span-2">
          {error && <Alert variant="error">{error}</Alert>}
          {saved && !error && <Alert variant="success">{m.saved}</Alert>}
          <Button type="submit" loading={saving} className="sm:w-auto sm:px-8">
            {m.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
