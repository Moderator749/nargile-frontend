"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Search } from "lucide-react";

import { WalletPanel } from "@/components/account/WalletPanel";
import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { B2BApplicationsPanel } from "@/components/admin/B2BApplicationsPanel";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminAdjustPoints, adminCustomerWallet, adminListCustomers } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminCustomer, Wallet } from "@/types";

const SEGMENT: Record<string, string> = { RETAIL: "Perakende", CAFE: "Kafe", WHOLESALE: "Toptan", DEALER: "Bayi" };

/** Admin: find a customer, see their ParaPuan/Kumbarapuan wallet, and correct the balance. */
export function AdminCustomersView() {
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      adminListCustomers({ q: q.trim() }, controller.signal)
        .then((list) => {
          setCustomers(list);
          setListError(null);
        })
        .catch((err: unknown) => {
          if (!controller.signal.aborted) setListError(getApiErrorMessage(err, "Müşteriler yüklenemedi."));
        });
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    adminCustomerWallet(selected.id, controller.signal)
      .then(setWallet)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setResult({ kind: "error", text: getApiErrorMessage(err, "Cüzdan yüklenemedi.") });
      });
    return () => controller.abort();
  }, [selected]);

  const parsed = Number.parseInt(amount, 10);
  const problem =
    !amount || !Number.isFinite(parsed) || parsed === 0
      ? "Eklenecek (+) veya düşülecek (−) puanı girin."
      : note.trim().length < 3
        ? "Bir gerekçe yazın (müşteri geçmişinde görünür)."
        : null;

  async function adjust(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || problem || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const updated = await adminAdjustPoints(selected.id, parsed, note.trim());
      setWallet(updated);
      setCustomers((list) => list?.map((c) => (c.id === selected.id ? { ...c, balance: updated.balance } : c)) ?? list);
      setAmount("");
      setNote("");
      setResult({ kind: "success", text: `Kaydedildi. Yeni bakiye: ${updated.balance.toLocaleString("tr-TR")} puan.` });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Puan güncellenemedi.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Müşteriler & Puanlar"
        description="Müşterilerin ParaPuan/Kumbarapuan bakiyelerini görün; gerekçeyle puan ekleyin veya düşün. Eklenen puanlar 1 yıl geçerlidir."
      />

      <B2BApplicationsPanel />

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <section aria-labelledby="customers-heading" className={`${panelClass} h-fit overflow-hidden`}>
          <h2 id="customers-heading" className="sr-only">
            Müşteri listesi
          </h2>
          <div className="relative border-b border-slate-200 p-3 dark:border-white/10">
            <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <label htmlFor="customer-q" className="sr-only">
              Müşteri ara
            </label>
            <input
              id="customer-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="E-posta veya ad"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900"
            />
          </div>
          {listError ? (
            <div className="p-4">
              <Alert variant="error">{listError}</Alert>
            </div>
          ) : customers === null ? (
            <div className="h-48 motion-safe:animate-pulse" aria-busy />
          ) : customers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">Müşteri bulunamadı.</p>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setWallet(null);
                      setResult(null);
                    }}
                    aria-current={selected?.id === c.id || undefined}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      selected?.id === c.id ? "bg-red-50/70 dark:bg-red-500/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.full_name || c.email}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-zinc-400">
                        {c.full_name ? `${c.email} · ` : ""}
                        {c.segment ? SEGMENT[c.segment] : "—"} · {c.order_count} sipariş
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular-nums">{c.balance.toLocaleString("tr-TR")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="wallet-heading" className={`${panelClass} p-5 sm:p-6`}>
          {!selected ? (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-zinc-400">Bir müşteri seçin.</p>
          ) : (
            <>
              <h2 id="wallet-heading" className="text-lg font-bold tracking-tight">
                {selected.full_name || selected.email}
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{selected.email}</p>

              <form onSubmit={adjust} className="mt-5 grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
                <Input
                  label="Puan (+/−)"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ""))}
                  placeholder="ör. 500 / -200"
                />
                <Input label="Gerekçe" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="ör. Telafi, hatalı tanım düzeltmesi" />
                <Button type="submit" loading={saving} disabled={!!problem} className="sm:w-28!">
                  Kaydet
                </Button>
              </form>
              {result && (
                <div className="mt-3">
                  <Alert variant={result.kind}>{result.text}</Alert>
                </div>
              )}

              <div className="mt-6">
                {wallet ? <WalletPanel wallet={wallet} /> : <div className="h-40 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
