"use client";

import { useState, type SubmitEvent } from "react";
import { Mail, MessageSquare } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import Link from "@/components/i18n/Link";
import { MIN_PASSWORD_LENGTH } from "@/components/auth/registrationDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { confirmPasswordReset, requestPasswordReset } from "@/lib/authApi";
import { getApiErrorMessage, translateApiDetail } from "@/lib/errors";
import { passwordMessages } from "@/lib/i18n/messages/auth";

type Channel = "email" | "sms";

const CHANNELS: { id: Channel; label: "byEmail" | "bySms"; Icon: typeof Mail }[] = [
  { id: "email", label: "byEmail", Icon: Mail },
  { id: "sms", label: "bySms", Icon: MessageSquare },
];

/**
 * "Şifremi unuttum": by e-mail a link arrives (and the page says so); by SMS a
 * six-digit code, entered here with the new password.
 */
export function ForgotPasswordForm() {
  const m = useMessages(passwordMessages);
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function request(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setSent(await requestPasswordReset(channel, identifier.trim()));
    } catch (err) {
      setError(getApiErrorMessage(err, m.requestFailed));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== repeat) return setError(m.mismatch);
    setBusy(true);
    setError(null);
    try {
      setDone(await confirmPasswordReset({ phone: identifier.trim(), code: code.trim(), new_password: password }));
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
          {m.backToLogin} <span aria-hidden className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>
    );
  }

  if (sent && channel === "sms") {
    return (
      <form onSubmit={confirm} className="space-y-4">
        <Alert variant="success">
          {translateApiDetail(sent)} {m.enterSmsCode}
        </Alert>
        {error && <Alert variant="error">{error}</Alert>}
        <Input
          label={m.smsCode}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
        />
        <Input label={m.newPassword} type="password" name="new-password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={password} onChange={(e) => setPassword(e.target.value)} hint={m.minLength(MIN_PASSWORD_LENGTH)} />
        <Input label={m.repeatPassword} type="password" name="repeat-password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
        <Button type="submit" loading={busy}>
          {m.change}
        </Button>
        <button type="button" onClick={() => setSent(null)} className="block w-full text-center text-sm text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100">
          {m.noCode}
        </button>
      </form>
    );
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert variant="success">{translateApiDetail(sent)}</Alert>
        <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">{m.emailSentHint}</p>
        <button type="button" onClick={() => setSent(null)} className="text-sm font-semibold text-red-600 hover:underline dark:text-red-400">
          {m.resend}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={request} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div role="radiogroup" aria-label={m.method} className="grid grid-cols-2 gap-2">
        {CHANNELS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={channel === id}
            onClick={() => {
              setChannel(id);
              setIdentifier("");
            }}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 ${
              channel === id
                ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/5"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden /> {m[label]}
          </button>
        ))}
      </div>
      {channel === "email" ? (
        <Input
          label={m.identifier}
          name="identifier"
          autoComplete="username"
          required
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={m.identifierPlaceholder}
          hint={m.identifierHint}
        />
      ) : (
        <Input
          label={m.phone}
          name="phone"
          type="tel"
          // Phone numbers read left to right on the Arabic page too.
          dir="ltr"
          autoComplete="tel"
          required
          autoFocus
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={m.phonePlaceholder}
          hint={m.phoneHint}
        />
      )}
      <Button type="submit" loading={busy}>
        {channel === "email" ? m.sendLink : m.sendCode}
      </Button>
    </form>
  );
}
