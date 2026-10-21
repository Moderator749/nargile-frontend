"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Building2 } from "lucide-react";

import {
  B2BApplicationFields,
  EMPTY_APPLICATION,
  applicationProblem,
} from "@/components/auth/B2BApplicationFields";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { b2bPanelMessages } from "@/lib/i18n/messages/account";
import { b2bFieldMessages } from "@/lib/i18n/messages/auth";
import { applyForB2B, fetchMyB2BApplication } from "@/lib/ordersApi";
import type { Locale } from "@/lib/i18n/config";
import type { B2BApplication, B2BSegment } from "@/types";

/** formatDate's date and time, in the page's language (Turkish exactly as formatDate writes it). */
const dateIn = (locale: Locale, iso: string) =>
  locale === "tr"
    ? formatDate(iso)
    : new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/** Retail customers: apply for Kafe / Toptan / Bayi pricing, or see the application's status. */
export function B2BApplicationPanel() {
  const locale = useLocale();
  const m = useMessages(b2bPanelMessages);
  const segments = useMessages(b2bFieldMessages).segments;
  const [application, setApplication] = useState<B2BApplication | null | undefined>(undefined);
  const [form, setForm] = useState(EMPTY_APPLICATION);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyB2BApplication(controller.signal)
      .then(setApplication)
      .catch(() => {
        if (!controller.signal.aborted) setApplication(null);
      });
    return () => controller.abort();
  }, []);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = applicationProblem(form, locale);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      setApplication(await applyForB2B(form));
      setOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, m.failed));
    } finally {
      setSaving(false);
    }
  }

  if (application === undefined) return null;
  const label = (s: string) => segments[s as B2BSegment] ?? s;

  return (
    <section aria-labelledby="b2b-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
      <h2 id="b2b-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Building2 className="h-5 w-5" aria-hidden /> {m.heading}
      </h2>

      {application?.status === "PENDING" ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          {m.pending(label(application.requested_segment), application.company_title, dateIn(locale, application.created_at))}
        </p>
      ) : application?.status === "APPROVED" ? (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{m.approved}</p>
      ) : (
        <>
          {application?.status === "REJECTED" && (
            <div className="mt-3">
              <Alert variant="error">
                {m.rejected(application.admin_note)}
              </Alert>
            </div>
          )}
          {!open ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-zinc-400">{m.invite}</p>
              <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="sm:w-auto!">
                {m.apply}
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <B2BApplicationFields value={form} onChange={setForm} />
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" loading={saving} className="sm:w-48!">
                {m.submit}
              </Button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
