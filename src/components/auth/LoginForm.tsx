"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchMe, login } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/useAuthStore";

interface LoginFormProps {
  justRegistered: boolean;
  redirectTo: string;
}

export function LoginForm({ justRegistered, redirectTo }: LoginFormProps) {
  const router = useRouter();
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
      router.replace(redirectTo);
      // Stay in the submitting state while navigating away.
    } catch (err) {
      setError(getApiErrorMessage(err, "Giriş yapılamadı. Lütfen tekrar deneyin."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {justRegistered && !error && (
        <Alert variant="success">Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.</Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="E-posta"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
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

      <Button type="submit" loading={submitting}>
        {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}
