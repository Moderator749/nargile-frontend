"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import {
  B2BApplicationFields,
  EMPTY_APPLICATION,
  applicationProblem,
} from "@/components/auth/B2BApplicationFields";
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
  const [applyB2B, setApplyB2B] = useState(false);
  const [application, setApplication] = useState(EMPTY_APPLICATION);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Şifreniz en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
      return;
    }
    const b2bProblem = applyB2B ? applicationProblem(application) : null;
    if (b2bProblem) {
      setError(b2bProblem);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        b2b_application: applyB2B ? application : null,
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

      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={applyB2B}
            onChange={(e) => setApplyB2B(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-red-600"
          />
          <span>
            <span className="font-medium">Kafe, toptancı veya bayi misiniz?</span>
            <span className="block text-xs text-slate-500 dark:text-zinc-400">
              Başvurun; onaylanınca size özel fiyatlar hesabınıza tanımlanır. O zamana kadar perakende fiyatları geçerlidir.
            </span>
          </span>
        </label>
        {applyB2B && (
          <div className="mt-4">
            <B2BApplicationFields value={application} onChange={setApplication} />
          </div>
        )}
      </div>

      <Button type="submit" loading={submitting}>
        {submitting ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
      </Button>
    </form>
  );
}
