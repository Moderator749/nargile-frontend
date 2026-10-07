"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Building2 } from "lucide-react";

import {
  B2BApplicationFields,
  B2B_SEGMENT_LABELS,
  EMPTY_APPLICATION,
  applicationProblem,
} from "@/components/auth/B2BApplicationFields";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { applyForB2B, fetchMyB2BApplication } from "@/lib/ordersApi";
import type { B2BApplication, B2BSegment } from "@/types";

/** Retail customers: apply for Kafe / Toptan / Bayi pricing, or see the application's status. */
export function B2BApplicationPanel() {
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
    const problem = applicationProblem(form);
    if (problem) return setError(problem);
    setSaving(true);
    setError(null);
    try {
      setApplication(await applyForB2B(form));
      setOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Başvuru gönderilemedi."));
    } finally {
      setSaving(false);
    }
  }

  if (application === undefined) return null;
  const label = (s: string) => B2B_SEGMENT_LABELS[s as B2BSegment] ?? s;

  return (
    <section aria-labelledby="b2b-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
      <h2 id="b2b-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Building2 className="h-5 w-5" aria-hidden /> İşletme hesabı
      </h2>

      {application?.status === "PENDING" ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
          {label(application.requested_segment)} başvurunuz ({application.company_title}) {formatDate(application.created_at)}{" "}
          tarihinden beri inceleniyor. Onaylanınca size özel fiyatlar otomatik uygulanır.
        </p>
      ) : application?.status === "APPROVED" ? (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">Başvurunuz onaylandı; işletme fiyatları hesabınızda tanımlı.</p>
      ) : (
        <>
          {application?.status === "REJECTED" && (
            <div className="mt-3">
              <Alert variant="error">
                Önceki başvurunuz onaylanmadı{application.admin_note ? `: ${application.admin_note}` : "."}
              </Alert>
            </div>
          )}
          {!open ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-zinc-400">Kafe, toptancı veya bayi misiniz? Size özel fiyatlar için başvurun.</p>
              <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="sm:w-auto!">
                Başvur
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <B2BApplicationFields value={form} onChange={setForm} />
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" loading={saving} className="sm:w-48!">
                Başvuruyu gönder
              </Button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
