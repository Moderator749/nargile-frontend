"use client";

import { useEffect, useState, type SubmitEvent } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { MIN_PASSWORD_LENGTH } from "@/components/auth/registrationDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { checkResetLink, confirmPasswordReset } from "@/lib/authApi";
import { getApiErrorMessage, translateApiDetail } from "@/lib/errors";
import { passwordMessages } from "@/lib/i18n/messages/auth";

/** The page the e-mailed link opens: a new password for the link's token. */
export function ResetPasswordForm({ token }: { token: string }) {
  const m = useMessages(passwordMessages);
  const [valid, setValid] = useState<boolean | null>(token ? null : false);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    checkResetLink(token)
      .then(setValid)
      .catch(() => setValid(true)); // can't tell: let the form try, it says so if not
  }, [token]);

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== repeat) return setError(m.mismatch);
    setBusy(true);
    setError(null);
    try {
      setDone(await confirmPasswordReset({ token, new_password: password }));
    } catch (err) {
      setError(getApiErrorMessage(err, m.changeFailed));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert variant="success">{translateApiDetail(done)}</Alert>
        <Link href="/login" className="block text-center text-sm font-semibold text-red-600 hover:underline dark:text-red-400">
          {m.signIn} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>
    );
  }
  if (valid === null) return <div className="h-40 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />;
  if (!valid) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{m.invalidLink}</Alert>
        <Link href="/sifremi-unuttum" className="block text-center text-sm font-semibold text-red-600 hover:underline dark:text-red-400">
          {m.newLink} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <Input label={m.newPassword} type="password" name="new-password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} hint={m.minLength(MIN_PASSWORD_LENGTH)} />
      <Input label={m.repeatPassword} type="password" name="repeat-password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      <Button type="submit" loading={busy}>
        {m.change}
      </Button>
    </form>
  );
}
