"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { ExternalLink, ReceiptText } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { lookupOrder } from "@/lib/authApi";
import { formatDate } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n/messages";
import { guestMessages } from "@/lib/i18n/messages/guest";
import type { OrderLookup } from "@/types";

/**
 * "Siparişini sorgula": an order found by its number and the e-mail address
 * it was placed with — what a guest has once its session is over, and anyone
 * without their account at hand. It says where the order stands and where the
 * parcel is, nothing about who ordered it.
 */
export function OrderLookupForm() {
  const locale = useLocale();
  const t = useMessages(guestMessages).lookup;
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<OrderLookup | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setFound(null);
    try {
      setFound(await lookupOrder(number.trim(), email.trim()));
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 429 ? t.tooMany : t.notFound);
    } finally {
      setBusy(false);
    }
  }

  const parcel = found?.tracking_url ?? null;
  return (
    <section aria-labelledby="track-by-order">
      <h2 id="track-by-order" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <ReceiptText className="h-5 w-5 text-red-600" aria-hidden /> {t.title}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{t.lead}</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input
          label={t.orderNumber}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          autoComplete="off"
          placeholder="ORD-…"
          className="font-mono"
          required
          minLength={6}
          maxLength={30}
        />
        <Input label={t.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={255} />
        <Button type="submit" loading={busy} className="sm:w-auto!">
          {t.submit}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {found && (
        <dl className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 dark:border-white/10 dark:bg-zinc-900" role="status">
          <div>
            <dt className="text-xs text-slate-500 dark:text-zinc-400">{t.status}</dt>
            <dd className="mt-1">
              <StatusBadge status={found.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500 dark:text-zinc-400">{t.placedAt}</dt>
            <dd className="mt-1 font-medium">{formatDate(found.created_at, INTL_LOCALE[locale])}</dd>
          </div>
          {found.shipped_at ? (
            <>
              <div>
                <dt className="text-xs text-slate-500 dark:text-zinc-400">{t.carrier}</dt>
                <dd className="mt-1 font-medium">{found.carrier_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-zinc-400">{t.trackingCode}</dt>
                <dd className="mt-1 font-mono">{found.tracking_code ?? "—"}</dd>
              </div>
              {parcel && (
                <div className="sm:col-span-2">
                  <a href={parcel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-red-700 hover:underline dark:text-red-400">
                    {t.trackParcel} <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-600 sm:col-span-2 dark:text-zinc-400">{t.notShipped}</p>
          )}
        </dl>
      )}
    </section>
  );
}
