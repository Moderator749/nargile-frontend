"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { answerConsentPrompt } from "@/lib/accountApi";
import { fetchMe } from "@/lib/authApi";
import { consentPromptMessages } from "@/lib/i18n/messages/account";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * "Kampanyalardan haberdar olmak ister misiniz?": asked once of an account
 * that was never asked (the customers the old store brought over), on
 * "Hesabım" or after an order. Both channels start unticked; whichever the
 * customer ticks is recorded with the moment, and either answer — "Şimdi
 * değil" too — ends the question for good.
 */
export function ConsentPrompt({ onAnswered }: { onAnswered?: () => void } = {}) {
  const m = useMessages(consentPromptMessages);
  const due = useAuthStore((s) => !!s.user?.consent_prompt_due);
  const [email, setEmail] = useState(false);
  const [sms, setSms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [thanked, setThanked] = useState(false);

  async function answer(choice: { email: boolean; sms: boolean }) {
    setBusy(true);
    setError(false);
    try {
      await answerConsentPrompt(choice);
      if (choice.email || choice.sms) setThanked(true);
      useAuthStore.getState().setUser(await fetchMe());
      onAnswered?.();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (thanked) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" role="status">
        {m.thanks}
      </p>
    );
  }
  if (!due) return null;

  const box = "h-4 w-4 shrink-0 accent-red-600";
  return (
    <section aria-labelledby="consent-prompt-heading" className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/30 dark:bg-red-500/10">
      <div className="flex gap-3">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="consent-prompt-heading" className="text-base font-bold tracking-tight">
            {m.heading}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">{m.intro}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" className={box} checked={email} onChange={(e) => setEmail(e.target.checked)} />
              {m.email}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" className={box} checked={sms} onChange={(e) => setSms(e.target.checked)} />
              {m.sms}
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-red-700 dark:text-red-400">{m.failed}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={busy || (!email && !sms)}
              onClick={() => answer({ email, sms })}
              className="inline-flex h-10 items-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {m.save}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => answer({ email: false, sms: false })}
              className="text-sm font-medium text-slate-600 hover:underline dark:text-zinc-300"
            >
              {m.notNow}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
