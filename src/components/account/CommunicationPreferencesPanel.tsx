"use client";

import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Switch } from "@/components/ui/Switch";
import { getApiErrorMessage } from "@/lib/errors";
import {
  fetchCommunicationPreferences,
  updateCommunicationPreferences,
  type CommunicationPreferences,
} from "@/lib/ordersApi";

const ROWS: { key: keyof CommunicationPreferences; title: string; hint: string }[] = [
  { key: "email", title: "Kampanya e-postaları", hint: "Yeni ürünler, indirimler ve kampanyalar e-postanıza gelsin." },
  { key: "sms", title: "Kampanya SMS'leri", hint: "Kampanya ve fırsatlar cep telefonunuza SMS olarak gelsin." },
];

/**
 * Ticari elektronik ileti onayı: the customer turns campaign e-mail and SMS
 * on and off. Order and password messages come either way.
 */
export function CommunicationPreferencesPanel() {
  const [prefs, setPrefs] = useState<CommunicationPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchCommunicationPreferences(controller.signal)
      .then(setPrefs)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "İletişim tercihleri yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  async function toggle(key: keyof CommunicationPreferences, value: boolean) {
    if (!prefs) return;
    const before = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setError(null);
    setSaved(false);
    try {
      setPrefs(await updateCommunicationPreferences(next));
      setSaved(true);
    } catch (err) {
      setPrefs(before);
      setError(getApiErrorMessage(err, "Tercih kaydedilemedi."));
    }
  }

  return (
    <section aria-labelledby="comm-prefs" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
      <h2 id="comm-prefs" className="text-lg font-bold tracking-tight">
        İletişim tercihleri
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        Kampanya iletilerini ne zaman isterseniz açıp kapatabilirsiniz. Sipariş ve şifre bildirimleri her durumda gönderilir.
      </p>
      <div className="mt-4 space-y-3">
        {prefs === null && !error ? (
          <div className="h-32 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
        ) : (
          prefs &&
          ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div>
                <p id={`pref-${row.key}`} className="text-sm font-medium">
                  {row.title}
                </p>
                <p id={`pref-${row.key}-hint`} className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  {row.hint}
                </p>
              </div>
              <Switch
                checked={prefs[row.key]}
                onChange={(v) => toggle(row.key, v)}
                labelledBy={`pref-${row.key}`}
                describedBy={`pref-${row.key}-hint`}
              />
            </div>
          ))
        )}
        {error && <Alert variant="error">{error}</Alert>}
        {saved && !error && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400" role="status">
            Tercihiniz kaydedildi.
          </p>
        )}
      </div>
    </section>
  );
}
