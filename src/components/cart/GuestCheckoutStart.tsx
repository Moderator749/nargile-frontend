"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { LogIn, UserPlus } from "lucide-react";

import Link from "@/components/i18n/Link";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchMe, startGuest } from "@/lib/authApi";
import { guestMessages } from "@/lib/i18n/messages/guest";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Where /checkout starts for a visitor: "Üye olmadan devam et" — a name, an
 * e-mail address and a mobile number, the three an order cannot do without —
 * beside signing in or signing up. Going on as a guest opens a guest session
 * (POST /auth/guest), and the cart's own steps (invoice, delivery, payment,
 * agreements) follow exactly as for an account: the same fields, the same
 * checks, so a guest order is never missing anything an order needs.
 */
export function GuestCheckoutStart() {
  const t = useMessages(guestMessages).start;
  const setAuth = useAuthStore((s) => s.setAuth);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; signIn: boolean } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { access_token } = await startGuest({ email: email.trim(), full_name: fullName.trim(), phone: phone.trim() });
      setAuth(access_token, await fetchMe(access_token));
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      // A field the server refused says which, in its own (Turkish) words; the
      // rest are said here, in the page's language.
      const fieldError = Array.isArray(detail) ? detail[0]?.msg?.replace(/^Value error, /, "") : null;
      setError(
        status === 409
          ? { text: t.accountExists, signIn: true }
          : { text: (status === 422 && fieldError) || t.failed, signIn: false },
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <form
        onSubmit={submit}
        aria-labelledby="guest-start-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-zinc-900"
      >
        <h2 id="guest-start-title" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{t.lead}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label={t.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required minLength={2} maxLength={150} />
          </div>
          <Input label={t.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required maxLength={255} />
          <Input
            label={t.phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="05xx xxx xx xx"
            hint={t.phoneHint}
            required
            maxLength={30}
          />
        </div>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error.text}{" "}
            {error.signIn && (
              <Link href="/login?next=/checkout" className="font-semibold underline underline-offset-2">
                {t.signIn}
              </Link>
            )}
          </p>
        )}
        <Button type="submit" loading={busy} className="mt-5 w-full sm:w-auto">
          {t.submit}
        </Button>
        <p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">{t.privacy}</p>
      </form>

      <aside className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-5 text-sm dark:bg-white/[0.03]">
        <p className="font-semibold text-slate-900 dark:text-white">{t.haveAccount}</p>
        <Link
          href="/login?next=/checkout"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 transition-colors hover:border-slate-900 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:border-white"
        >
          <LogIn className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {t.signIn}
        </Link>
        <p className="text-center text-xs text-slate-500 dark:text-zinc-500">{t.or}</p>
        <Link
          href="/register?next=/checkout"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 transition-colors hover:border-slate-900 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:border-white"
        >
          <UserPlus className="h-4 w-4" aria-hidden /> {t.register}
        </Link>
        <p className="text-xs leading-5 text-slate-500 dark:text-zinc-400">{t.registerNote}</p>
      </aside>
    </div>
  );
}
