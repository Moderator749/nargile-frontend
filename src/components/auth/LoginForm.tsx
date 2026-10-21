"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { useLocalePath } from "@/components/i18n/navigation";
import Link from "@/components/i18n/Link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchMe, login } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { loginMessages } from "@/lib/i18n/messages/auth";
import { useAuthStore } from "@/store/useAuthStore";

/** What to say above the form when the visitor has just registered (loginMessages.notices). */
export type RegistrationNotice = keyof (typeof loginMessages)["tr"]["notices"];

interface LoginFormProps {
  /** Shown when they arrive straight from sign-up; which one depends on the account. */
  notice: RegistrationNotice | null;
  redirectTo: string;
}

export function LoginForm({ notice, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const to = useLocalePath();
  const setAuth = useAuthStore((s) => s.setAuth);
  const m = useMessages(loginMessages);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const { access_token } = await login({ email: email.trim(), password });
      const user = await fetchMe(access_token);
      setAuth(access_token, user);
      router.replace(to(redirectTo));
      // Stay in the submitting state while navigating away.
    } catch (err) {
      setError(getApiErrorMessage(err, m.failed));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {notice && !error && <Alert variant="success">{m.notices[notice]}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        // Either identifier is accepted, so the field cannot be type="email".
        label={m.identifier}
        name="email"
        autoComplete="username"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={m.identifierPlaceholder}
      />
      <Input
        label={m.password}
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p className="-mt-2 text-end text-sm">
        <Link href="/sifremi-unuttum" className="font-medium text-red-600 hover:underline dark:text-red-400">
          {m.forgot}
        </Link>
      </p>

      <Button type="submit" loading={submitting}>
        {submitting ? m.submitting : m.submit}
      </Button>
    </form>
  );
}
