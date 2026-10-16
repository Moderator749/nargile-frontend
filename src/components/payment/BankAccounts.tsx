"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { formatIban } from "@/lib/provinces";
import type { BankAccount } from "@/types";

/**
 * Turkish banks by the code inside the IBAN (its 5th–9th characters), for the
 * mark beside each account: the bank's short name and a colour close to its
 * own. A monogram rather than the bank's logo — the shop holds no licence to
 * those — so it reads as a label, not as the bank speaking.
 */
const BANKS: Record<string, { mark: string; color: string; ink?: string }> = {
  "00010": { mark: "ZB", color: "#e30a17" }, // Ziraat
  "00012": { mark: "HB", color: "#0058a3" }, // Halkbank
  "00015": { mark: "VB", color: "#fdb913", ink: "#1a1a1a" }, // VakıfBank
  "00032": { mark: "TEB", color: "#00a651" },
  "00046": { mark: "AK", color: "#e2001a" }, // Akbank
  "00062": { mark: "G", color: "#00854a" }, // Garanti BBVA
  "00064": { mark: "İŞ", color: "#0b3b8c" }, // İş Bankası
  "00067": { mark: "YK", color: "#004990" }, // Yapı Kredi
  "00099": { mark: "ING", color: "#ff6200" },
  "00111": { mark: "QNB", color: "#7b1f45" },
  "00134": { mark: "DB", color: "#003b7a" }, // DenizBank
  "00205": { mark: "KT", color: "#00a28a" }, // Kuveyt Türk
};

function BankMark({ account }: { account: BankAccount }) {
  const known = BANKS[account.iban.slice(4, 9)];
  const initials = account.bank_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold tracking-tight"
      style={{ backgroundColor: known?.color ?? "#334155", color: known?.ink ?? "#ffffff" }}
    >
      {known?.mark ?? initials}
    </span>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      aria-label={`${label} kopyala`}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

/** The active accounts from "Banka Hesapları", each with a copyable IBAN. */
export function BankAccountList({ accounts }: { accounts: BankAccount[] }) {
  return (
    <ul className="space-y-3">
      {accounts.map((acc) => (
        <li key={acc.id} className="rounded-xl bg-white p-4 ring-1 ring-inset ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
          <div className="flex items-center gap-3">
            <BankMark account={acc} />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {acc.bank_name}
                {acc.branch && <span className="font-normal text-slate-500 dark:text-zinc-400"> · {acc.branch}</span>}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">Alıcı: {acc.account_holder}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="break-all font-mono text-sm tracking-wide">{formatIban(acc.iban)}</p>
            <CopyButton text={acc.iban} label={`${acc.bank_name} IBAN`} />
          </div>
        </li>
      ))}
    </ul>
  );
}
