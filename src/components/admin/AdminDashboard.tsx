"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, ClipboardList, Euro, DollarSign, UserCheck, Users } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { adminDashboard, adminListOrdersPage } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import type { AdminDashboardData, PeriodTotals } from "@/types";

const PERIODS: { key: "daily" | "weekly" | "monthly" | "yearly"; label: string; hint: string }[] = [
  { key: "daily", label: "Günlük", hint: "Bugün 00:00'dan bu yana" },
  { key: "weekly", label: "Haftalık", hint: "Pazartesiden bu yana" },
  { key: "monthly", label: "Aylık", hint: "Ayın 1'inden bu yana" },
  { key: "yearly", label: "Yıllık", hint: "1 Ocak'tan bu yana" },
];

const KPIS: { title: string; value: (t: PeriodTotals) => string }[] = [
  { title: "Toplam sipariş adedi", value: (t) => t.order_count.toLocaleString("tr-TR") },
  { title: "Sipariş toplamı", value: (t) => formatMoney(t.order_total) },
  { title: "Kredi kartı toplamı", value: (t) => formatMoney(t.card_total) },
  { title: "Havale toplamı", value: (t) => formatMoney(t.transfer_total) },
];

/**
 * "Live rate" marker: a breathing emerald dot. TCMB publishes one bulletin a day
 * and the API returns only that one, so there is no previous value to point an
 * up/down arrow at — this says the feed is live without inventing a direction.
 */
function LiveDot() {
  return (
    <span className="relative ml-1 inline-flex h-2 w-2 shrink-0 align-middle" title="Canlı TCMB kuru">
      <span className="absolute inset-0 rounded-full bg-emerald-500/70 motion-safe:animate-ping" aria-hidden />
      <span className="relative h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      <span className="sr-only">Canlı kur</span>
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  href,
  live = false,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  /** Marks a TCMB rate tile: adds the live pulse and a soft breathing glow. */
  live?: boolean;
}) {
  const body = (
    <>
      <Icon
        className={`h-5 w-5 shrink-0 ${
          live ? "text-emerald-600 motion-safe:animate-[rate-glow_3s_ease-in-out_infinite] dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"
        }`}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-mono text-lg font-semibold tabular-nums">
          {value}
          {live && value !== "…" && value !== "—" && <LiveDot />}
        </p>
        {sub && <p className="text-[11px] text-slate-500 dark:text-zinc-400">{sub}</p>}
      </div>
    </>
  );
  const cls = "flex items-center gap-3 px-5 py-4";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Genel Bakış, per the business blueprint: status strip, sales KPIs, latest orders. */
export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<{ transfer: number; approval: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      adminDashboard(controller.signal),
      adminListOrdersPage({ page: 0, pageSize: 1, status: "AWAITING_TRANSFER" }, controller.signal),
      adminListOrdersPage({ page: 0, pageSize: 1, status: "PENDING_APPROVAL" }, controller.signal),
    ])
      .then(([dash, transfer, approval]) => {
        setData(dash);
        setQueue({ transfer: transfer.total, approval: approval.total });
      })
      .catch((err: unknown) => {
        if (!axios.isCancel(err)) setError(getApiErrorMessage(err, "Genel bakış yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const rate = (v: string | null) => (v ? Number(v).toLocaleString("tr-TR", { minimumFractionDigits: 4 }) : "—");

  return (
    <>
      <AdminPageHeader title="Genel Bakış" description="Ödenmiş siparişlere göre satış özeti (Türkiye saati) ve üyeler. Siparişlerin kendisi Sipariş Yönetimi'nde." />

      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Status strip */}
      <section aria-label="Durum" className={`${panelClass} grid grid-cols-2 divide-slate-200 overflow-hidden sm:grid-cols-4 sm:divide-x dark:divide-white/10`}>
        <StatTile icon={DollarSign} label="Dolar" value={data ? rate(data.usd_try) : "…"} sub={data?.rates_date ? `TCMB · ${data.rates_date}` : undefined} live />
        <StatTile icon={Euro} label="Euro" value={data ? rate(data.eur_try) : "…"} sub={data?.rates_date ? "Döviz satış" : undefined} live />
        <StatTile icon={Users} label="Üye sayısı" value={data ? data.member_count.toLocaleString("tr-TR") : "…"} sub="Kayıtlı müşteri" />
        <StatTile
          icon={UserCheck}
          label="Onay bekleyen"
          value={data ? data.pending_applications.toLocaleString("tr-TR") : "…"}
          sub="İşletme (B2B) başvurusu"
          href="/admin/customers"
        />
      </section>

      {/* Sales KPIs: four columns, three periods each */}
      <section aria-labelledby="kpi-heading" className="mt-6">
        <h2 id="kpi-heading" className="sr-only">
          Satış özeti
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.title}
              className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:shadow-none"
            >
              <h3 className="border-b border-emerald-200 bg-emerald-100/70 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-100">
                {kpi.title}
              </h3>
              <dl className="divide-y divide-emerald-200/70 dark:divide-emerald-500/20">
                {PERIODS.map((p) => (
                  <div
                    key={p.key}
                    title={p.hint}
                    /* Today's figure is the one the admin reads all day: keep it on
                       white so it stands out of the green run-rate rows. */
                    className={`flex items-baseline justify-between gap-3 px-4 py-3 ${
                      p.key === "daily" ? "bg-white dark:bg-zinc-900" : ""
                    }`}
                  >
                    <dt
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        p.key === "daily" ? "text-slate-500 dark:text-zinc-400" : "text-emerald-800 dark:text-emerald-200"
                      }`}
                    >
                      {p.label}
                    </dt>
                    <dd
                      className={`font-mono text-base font-semibold tabular-nums ${
                        p.key === "daily" ? "" : "text-emerald-950 dark:text-emerald-50"
                      }`}
                    >
                      {data ? kpi.value(data[p.key]) : "…"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
          Yalnızca ödenmiş/onaylı siparişler, ödeme tarihine göre. İptal ve ödenmemiş siparişler dahil değildir. Tutar: müşterinin ödediği net tutar.
        </p>
      </section>

      {/* The way into Siparişler, with the queue that is waiting there beside it. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="group inline-flex items-center gap-2.5 rounded-lg bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:translate-y-px motion-reduce:transform-none dark:bg-red-500 dark:shadow-red-500/20 dark:hover:bg-red-400"
        >
          <ClipboardList className="h-5 w-5 shrink-0" aria-hidden />
          Sipariş Yönetimine Git
          <ArrowRight
            className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden
          />
        </Link>
        {/* Lemon yellow on black: the queue has to be seen from across the room,
            and it reads the same in either theme. */}
        {queue && (
          <ul className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <li className="rounded-full bg-yellow-300 px-3 py-1.5 text-black ring-1 ring-inset ring-yellow-400">
              <strong className="font-mono">{queue.transfer}</strong> havale bekliyor
            </li>
            <li className="rounded-full bg-yellow-300 px-3 py-1.5 text-black ring-1 ring-inset ring-yellow-400">
              <strong className="font-mono">{queue.approval}</strong> onay bekliyor
            </li>
          </ul>
        )}
        <p className="basis-full text-xs text-slate-500 dark:text-zinc-400">
          Tüm siparişler, havale ve onay bekleyenler, kargo ve kurye işlemleri.
        </p>
      </div>
    </>
  );
}
