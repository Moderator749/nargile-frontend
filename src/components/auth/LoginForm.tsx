"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { useLocalePath } from "@/components/i18n/navigation";
import Link from "@/components/i18n/Link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchMe, login } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/useAuthStore";

/** What to say above the form when the visitor has just registered. */
const NOTICES = {
  account: "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
  review:
    "Hesabınız oluşturuldu. Firma başvurunuz incelenecek; onaylanınca size özel fiyatlar tanımlanır. Şimdi giriş yapabilirsiniz.",
  // In English, like the form this visitor came from.
  export:
    "Your account has been created. Our sales team will contact you about wholesale pricing and shipping rates. You can sign in now.",
} as const;

export type RegistrationNotice = keyof typeof NOTICES;

interface LoginFormProps {
  /** Shown when they arrive straight from sign-up; which one depends on the account. */
  notice: RegistrationNotice | null;
  redirectTo: string;
}

export function LoginForm({ notice, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const to = useLocalePath();
  const setAuth = useAuthStore((s) => s.setAuth);

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
      setError(getApiErrorMessage(err, "Giriş yapılamadı. Lütfen tekrar deneyin."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {notice && !error && <Alert variant="success">{NOTICES[notice]}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        // Either identifier is accepted, so the field cannot be type="email".
        label="E-posta veya kullanıcı adı"
        name="email"
        autoComplete="username"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ornek@firma.com"
      />
      <Input
        label="Şifre"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p className="-mt-2 text-right text-sm">
        <Link href="/sifremi-unuttum" className="font-medium text-red-600 hover:underline dark:text-red-400">
          Şifremi unuttum
        </Link>
      </p>

      <Button type="submit" loading={submitting}>
        {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}
