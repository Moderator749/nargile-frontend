"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { register } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Şifreniz en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });
      router.replace("/login?registered=1");
    } catch (err) {
      setError(getApiErrorMessage(err, "Kayıt tamamlanamadı. Lütfen tekrar deneyin."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Ad Soyad"
        name="name"
        autoComplete="name"
        required
        autoFocus
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Adınız Soyadınız"
      />
      <Input
        label="E-posta"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ornek@firma.com"
      />
      <Input
        label="Şifre"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`En az ${MIN_PASSWORD_LENGTH} karakter`}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" loading={submitting}>
        {submitting ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
      </Button>
    </form>
  );
}
