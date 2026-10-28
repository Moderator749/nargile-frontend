"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { UserRoundCheck } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { claimGuest, fetchMe } from "@/lib/authApi";
import { guestMessages } from "@/lib/i18n/messages/guest";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * A guest's offer to keep its order in an account: a password, and the guest
 * checkout becomes an account with the same e-mail address (POST
 * /auth/guest/claim), its order and Sultan Puan with it. Shown only to a
 * guest session; says how to look the order up otherwise.
 */
export function GuestClaim() {
  const t = useMessages(guestMessages).claim;
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        {t.done}
      </p>
    );
  }
  if (!user?.is_guest) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { access_token } = await claimGuest(password);
      setAuth(access_token, await fetchMe(access_token));
      setDone(true);
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 409 ? t.accountExists : t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="guest-claim-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex gap-3">
        <UserRoundCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="guest-claim-heading" className="text-base font-bold tracking-tight">
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{t.lead(user.email)}</p>
          <form onSubmit={submit} className="mt-4 max-w-sm space-y-3">
            <div>
              <Input
                label={t.password}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                maxLength={128}
                required
                hint={t.passwordHint}
              />
            </div>
            <Button type="submit" loading={busy} className="w-full sm:w-auto!">
              {t.submit}
            </Button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">{t.track}</p>
        </div>
      </div>
    </section>
  );
}
