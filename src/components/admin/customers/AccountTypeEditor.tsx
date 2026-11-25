"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

import { ACCOUNT_TYPE_LABELS } from "@/components/admin/customers/CustomerLabels";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { adminEditAccountType } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import type { AdminCustomerDetail } from "@/types";

type Kind = "INDIVIDUAL" | "CORPORATE";
type Business = "CAFE" | "TOBACCO_SHOP";

/** A domestic account is Kurumsal when it trades as a business or is invoiced to a firm. */
export const isCorporate = (c: AdminCustomerDetail) =>
  c.account_type !== "INDIVIDUAL" || c.profile?.billing_entity_type != null;

/**
 * "Hesap Türü": switch an account between Bireysel and Kurumsal, and keep the
 * firm's invoice details (ünvan, vergi dairesi, VKN / TCKN). A customer who
 * signed up as Bireysel and was put on Kafe, Toptan or Bayi is made Kurumsal
 * here; their price list ("Fiyat Grubu") stays as it is. A 10-digit number is
 * a şirket's VKN, an 11-digit one a şahıs firması's TCKN.
 */
export function AccountTypeEditor({
  customer,
  onSaved,
}: {
  customer: AdminCustomerDetail;
  onSaved: (updated: AdminCustomerDetail) => void;
}) {
  const p = customer.profile;
  const initialBusiness: Business =
    customer.account_type === "CAFE" ? "CAFE" : customer.account_type === "TOBACCO_SHOP" ? "TOBACCO_SHOP" : customer.segment === "CAFE" ? "CAFE" : "TOBACCO_SHOP";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>(isCorporate(customer) ? "CORPORATE" : "INDIVIDUAL");
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [title, setTitle] = useState(p?.company_title ?? "");
  const [office, setOffice] = useState(p?.tax_office ?? "");
  const [number, setNumber] = useState(p?.tax_number ?? "");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  if (customer.account_type === "INTERNATIONAL") {
    return <p className="text-xs text-slate-500 dark:text-zinc-400">Yurt dışı hesapların türü buradan değiştirilemez.</p>;
  }

  const digits = number.replace(/\s/g, "");
  const numberError = kind === "CORPORATE" && digits && !/^\d{10,11}$/.test(digits) ? "10 haneli VKN ya da 11 haneli TCKN girin." : undefined;
  const missing = kind === "CORPORATE" && (!title.trim() || !office.trim() || !digits);

  async function save() {
    if (saving || missing || numberError) return;
    setSaving(true);
    setResult(null);
    try {
      const updated = await adminEditAccountType(
        customer.id,
        kind === "INDIVIDUAL"
          ? { kind }
          : { kind, business_type: business, company_title: title, tax_office: office, tax_number: digits },
      );
      onSaved(updated);
      setOpen(false);
      setResult({
        kind: "success",
        text: kind === "INDIVIDUAL" ? "Hesap Bireysel yapıldı." : "Hesap Kurumsal yapıldı; fatura bilgileri kaydedildi.",
      });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Hesap türü değiştirilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  const choice = (value: Kind, label: string, hint: string) => (
    <label
      className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-red-500/40 ${
        kind === value
          ? "border-red-600 bg-red-50/60 ring-1 ring-red-600 dark:border-red-400 dark:bg-red-500/10 dark:ring-red-400"
          : "border-slate-200 bg-slate-50 hover:border-slate-400 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/25"
      }`}
    >
      <input type="radio" name="account-kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
      <span>
        <span className="block font-semibold text-slate-900 dark:text-zinc-100">{label}</span>
        <span className="block text-xs text-slate-500 dark:text-zinc-400">{hint}</span>
      </span>
    </label>
  );

  if (!open) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700 dark:text-zinc-300">
          <strong className="font-semibold">{isCorporate(customer) ? "Kurumsal" : "Bireysel"}</strong>
          {" · "}
          {ACCOUNT_TYPE_LABELS[customer.account_type]}
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setResult(null);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors duration-200 hover:bg-slate-50 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden /> Hesap türünü düzenle
        </button>
        {result && <Alert variant={result.kind}>{result.text}</Alert>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Hesap türü</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {choice("INDIVIDUAL", "Bireysel", "Fatura kişiye kesilir.")}
          {choice("CORPORATE", "Kurumsal", "Fatura firmaya kesilir.")}
        </div>
      </fieldset>

      {kind === "CORPORATE" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700 dark:text-zinc-300">İş kolu</span>
            <select
              value={business}
              onChange={(e) => setBusiness(e.target.value as Business)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-zinc-900"
            >
              <option value="CAFE">{ACCOUNT_TYPE_LABELS.CAFE}</option>
              <option value="TOBACCO_SHOP">{ACCOUNT_TYPE_LABELS.TOBACCO_SHOP}</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <Input label="Şirket Ünvanı" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
          </div>
          <Input label="Vergi Dairesi" value={office} onChange={(e) => setOffice(e.target.value)} maxLength={100} />
          <Input
            label="Vergi Numarası / TCKN"
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d\s]/g, ""))}
            maxLength={14}
            error={numberError}
          />
        </div>
      )}
      {kind === "INDIVIDUAL" && isCorporate(customer) && (
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Firma bilgileri silinmez, yalnızca faturada kullanılmaz; tekrar Kurumsal yapıldığında yeniden görünür.
        </p>
      )}
      <p className="text-xs text-slate-500 dark:text-zinc-400">Fiyat grubu değişmez.</p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || missing || !!numberError}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          Hesap türünü kaydet
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5"
        >
          <X className="h-4 w-4" aria-hidden /> Vazgeç
        </button>
      </div>
      {result && <Alert variant={result.kind}>{result.text}</Alert>}
    </div>
  );
}
