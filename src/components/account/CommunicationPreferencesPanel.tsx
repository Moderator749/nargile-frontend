"use client";

import { useEffect, useState } from "react";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { Alert } from "@/components/ui/Alert";
import { Switch } from "@/components/ui/Switch";
import { getApiErrorMessage } from "@/lib/errors";
import {
  fetchCommunicationPreferences,
  updateCommunicationPreferences,
  type CommunicationPreferences,
} from "@/lib/ordersApi";
import { communicationMessages } from "@/lib/i18n/messages/account";
import { useAuthStore } from "@/store/useAuthStore";

/** The switches, in order; their words are communicationMessages[key]. */
const ROWS: (keyof CommunicationPreferences)[] = ["email", "sms"];

/**
 * Ticari elektronik ileti onayı: the customer turns campaign e-mail and SMS
 * on and off. Order and password messages come either way.
 */
export function CommunicationPreferencesPanel() {
  const m = useMessages(communicationMessages);
  const [prefs, setPrefs] = useState<CommunicationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchCommunicationPreferences(controller.signal)
      .then(setPrefs)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, m.loadFailed));
      });
    return () => controller.abort();
  }, [m.loadFailed]);

  async function toggle(key: keyof CommunicationPreferences, value: boolean) {
    if (!prefs) return;
    const before = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setError(null);
    setSaved(false);
    try {
      const stored = await updateCommunicationPreferences(next);
      setPrefs(stored);
      setSaved(true);
      // Answered here, so the one-time card has nothing left to ask.
      const { user, setUser } = useAuthStore.getState();
      if (user) {
        setUser({ ...user, marketing_email_consent: stored.email, marketing_sms_consent: stored.sms, consent_prompt_due: false });
      }
    } catch (err) {
      setPrefs(before);
      setError(getApiErrorMessage(err, m.saveFailed));
    }
  }

  return (
    <section aria-labelledby="comm-prefs" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <h2 id="comm-prefs" className="text-lg font-bold tracking-tight">
        {m.heading}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {m.intro}
      </p>
      <div className="mt-4 space-y-3">
        {prefs === null && !error ? (
          <div className="h-32 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
        ) : (
          prefs &&
          ROWS.map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div>
                <p id={`pref-${key}`} className="text-sm font-medium">
                  {m[key].title}
                </p>
                <p id={`pref-${key}-hint`} className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  {m[key].hint}
                </p>
              </div>
              <Switch
                checked={prefs[key]}
                onChange={(v) => toggle(key, v)}
                labelledBy={`pref-${key}`}
                describedBy={`pref-${key}-hint`}
              />
            </div>
          ))
        )}
        {error && <Alert variant="error">{error}</Alert>}
        {saved && !error && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400" role="status">
            {m.saved}
          </p>
        )}
      </div>
    </section>
  );
}
