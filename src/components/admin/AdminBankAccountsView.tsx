"use client";

import { ContentEditor } from "@/components/admin/ContentEditor";
import { Input } from "@/components/ui/Input";
import { adminBankAccounts } from "@/lib/adminApi";
import { formatIban } from "@/lib/provinces";
import type { BankAccount, BankAccountWrite } from "@/types";

const blank = (): BankAccountWrite => ({
  bank_name: "",
  account_holder: "",
  iban: "",
  branch: null,
  is_active: true,
  sort_order: 100,
});

const toWrite = (a: BankAccount): BankAccountWrite => ({
  bank_name: a.bank_name,
  account_holder: a.account_holder,
  iban: formatIban(a.iban),
  branch: a.branch,
  is_active: a.is_active,
  sort_order: a.sort_order,
});

/** TR IBAN: "TR" + 24 digits with a valid ISO 13616 checksum (the server checks too). */
function ibanProblem(raw: string): string | null {
  const iban = raw.replace(/\s+/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(iban)) return "IBAN, TR ile başlayan 26 karakter olmalı.";
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let mod = 0;
  for (const d of digits) mod = (mod * 10 + Number(d)) % 97;
  return mod === 1 ? null : "IBAN geçersiz (kontrol hanesi tutmuyor).";
}

/** Admin: bank accounts shown to customers paying by havale/EFT. */
export function AdminBankAccountsView() {
  return (
    <ContentEditor
      title="Banka Hesapları"
      description="Havale/EFT ile ödeyen müşterilere sipariş sonrasında gösterilen hesaplar."
      noun="hesap"
      api={adminBankAccounts}
      blank={blank}
      toWrite={toWrite}
      summary={(a) => ({ primary: a.bank_name, secondary: `${formatIban(a.iban)} · ${a.account_holder}` })}
      validate={(v) =>
        v.bank_name.trim().length < 2 || v.account_holder.trim().length < 2
          ? "Banka adı ve hesap sahibi gerekli."
          : ibanProblem(v.iban)
      }
      listNote="En az bir etkin hesap olmalı; yoksa müşteriye “bizimle iletişime geçin” mesajı gösterilir."
      fields={(v, set) => (
        <>
          <Input label="Banka" value={v.bank_name} maxLength={100} onChange={(e) => set({ bank_name: e.target.value })} placeholder="ör. Ziraat Bankası" />
          <Input
            label="Hesap sahibi (alıcı adı)"
            value={v.account_holder}
            maxLength={150}
            onChange={(e) => set({ account_holder: e.target.value })}
          />
          <Input
            label="IBAN"
            value={v.iban}
            maxLength={42}
            onChange={(e) => set({ iban: e.target.value.toUpperCase() })}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            className="font-mono"
          />
          <Input label="Şube (isteğe bağlı)" value={v.branch ?? ""} maxLength={100} onChange={(e) => set({ branch: e.target.value || null })} />
        </>
      )}
    />
  );
}
