"use client";

import { useId, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { AccountTypePicker } from "@/components/auth/AccountTypePicker";
import { AddressFields } from "@/components/auth/AddressFields";
import { CompanyFields } from "@/components/auth/CompanyFields";
import { FormSection } from "@/components/auth/FormSection";
import {
  CustomsNotice,
  InternationalAddressFields,
  InternationalIdentityFields,
} from "@/components/auth/InternationalFields";
import { copyFor } from "@/components/auth/registrationCopy";
import {
  MIN_PASSWORD_LENGTH,
  emptyDraft,
  isTurkishBusiness,
  registrationProblem,
  showsNationalId,
  switchAccountType,
  toPayload,
  type RegistrationDraft,
} from "@/components/auth/registrationDraft";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { register } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";

/** What a firm has to bring to the approval, said once and left on screen. */
function DocumentNotice() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">NOT:</strong> Üyelik onayında vergi levhası ve varsa TAPDK belgesi
        istenecektir.
      </span>
    </p>
  );
}

/**
 * Sign-up for all four kinds of account.
 *
 * The account type at the top decides which sections are on screen, and which
 * language they are in: the three Turkish types are asked in Turkish, an
 * international customer in English. Everything about what each one requires
 * lives in `registrationDraft`, which the server's own schema mirrors. Required
 * fields keep their native `required`, so the browser catches a blank one and
 * puts the cursor in it; the rules a browser cannot express — a TC checksum, an
 * address that needs either a street or a neighbourhood — come back as one
 * message above the form.
 *
 * It asks who the customer is, how to reach them, how they will log in and who
 * to invoice, and stops there. Where an order should go is checkout's question,
 * which needs an order to answer; which price group a firm belongs to is an
 * admin's answer, given once the account exists. Neither belongs between a
 * visitor and their account.
 */
export function RegisterForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<RegistrationDraft>(() => emptyDraft());
  // The form is a long one, so it waits to be asked for: picking a card selects
  // it, pressing the card's own button is what opens this.
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();

  const international = draft.accountType === "INTERNATIONAL";
  // A Turkish firm. An international account has its own identity section, and
  // its own question about whether it is a business at all.
  const business = isTurkishBusiness(draft.accountType);
  const copy = copyFor(international);
  const set = (patch: Partial<RegistrationDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const problem = registrationProblem(draft);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await register(toPayload(draft));
      // An account exists at once; a firm's prices wait for a person, and an
      // international customer waits to hear from the sales team.
      const next = international ? "export" : business ? "review" : "1";
      router.replace(`/login?registered=${next}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Kayıt tamamlanamadı. Lütfen tekrar deneyin."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}

      <AccountTypePicker
        value={draft.accountType}
        opened={opened}
        formId={formId}
        onChange={(accountType) => setDraft((current) => switchAccountType(current, accountType))}
        onRegister={(accountType) => {
          setDraft((current) => switchAccountType(current, accountType));
          setOpened(true);
          setError(null);
        }}
      />

      {!opened && (
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Hesap türünüzü seçip <span className="font-medium text-slate-700 dark:text-zinc-300">Üye Ol</span>{" "}
          düğmesine basın; yalnızca size uygun alanlar sorulacak.
        </p>
      )}

      {opened && (
        <div id={formId} className="space-y-5">
      {(business || international) && (
        <FormSection title={copy.identitySection} description={copy.identityHint}>
          {international ? (
            <InternationalIdentityFields
              kind={draft.internationalKind}
              onKindChange={(internationalKind) => set({ internationalKind })}
              company={draft.company}
              onCompanyChange={(company) => set({ company })}
            />
          ) : (
            <div className="space-y-4">
              <CompanyFields
                value={draft.company}
                onChange={(company) => set({ company })}
                nationalId={draft.nationalId}
                onNationalIdChange={(nationalId) => set({ nationalId })}
              />
              {/* The invoice address, in the section the invoice is described
                  in rather than one of its own. */}
              <fieldset className="border-t border-slate-200 pt-4 dark:border-white/10">
                <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Adres</legend>
                <AddressFields value={draft.billing} onChange={(billing) => set({ billing })} required />
              </fieldset>
              <DocumentNotice />
            </div>
          )}
        </FormSection>
      )}

      <FormSection title={international || business ? copy.contactSection : "Kişisel Bilgiler"}>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* An international account gave its company name in the section above. */}
          {(business || international) && (
            <Input
              label={copy.contactPerson}
              autoComplete="name"
              maxLength={150}
              required
              value={draft.contactName}
              onChange={(e) => set({ contactName: e.target.value })}
            />
          )}
          {!business && !international && (
            <Input
              label="İsim Soyisim"
              autoComplete="name"
              maxLength={150}
              required
              autoFocus
              value={draft.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              placeholder="Adınız Soyadınız"
            />
          )}
          <Input
            label={copy.mobile}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={30}
            required
            placeholder={copy.mobilePlaceholder}
            value={draft.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
          {!international && (
            <Input
              label="Sabit Telefon"
              type="tel"
              inputMode="tel"
              maxLength={30}
              hint="İsteğe bağlı"
              value={draft.landlinePhone}
              onChange={(e) => set({ landlinePhone: e.target.value })}
            />
          )}
          <Input
            label={copy.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={255}
            required
            placeholder={copy.emailPlaceholder}
            value={draft.email}
            onChange={(e) => set({ email: e.target.value })}
          />
          <Input
            label={copy.username}
            autoComplete="username"
            maxLength={30}
            hint={copy.usernameHint}
            value={draft.username}
            onChange={(e) => set({ username: e.target.value })}
          />
          <Input
            label={copy.password}
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            hint={copy.passwordHint(MIN_PASSWORD_LENGTH)}
            value={draft.password}
            onChange={(e) => set({ password: e.target.value })}
          />
          {showsNationalId(draft) && !business && (
            <Input
              label="TC Kimlik No"
              inputMode="numeric"
              maxLength={11}
              hint="İsteğe bağlı · fatura ve kargo işlemlerini hızlandırır"
              value={draft.nationalId}
              onChange={(e) => set({ nationalId: e.target.value.replace(/\D/g, "") })}
            />
          )}
        </div>
      </FormSection>

      {!business && (
        <FormSection
          title={copy.addressSection}
          description={international ? undefined : copy.addressHint}
        >
          {international ? (
            <InternationalAddressFields
              value={draft.internationalAddress}
              onChange={(internationalAddress) => set({ internationalAddress })}
            />
          ) : (
            <AddressFields
              value={draft.billing}
              onChange={(billing) => set({ billing })}
              required={false}
            />
          )}
        </FormSection>
      )}

      {!business && !international && (
        <FormSection title="Kurumsal Fatura">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.corporateInvoice}
              onChange={(e) => set({ corporateInvoice: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span>
              <span className="font-medium">Faturayı Firmaya / Şirkete İstiyorum</span>
              <span className="block text-xs text-slate-500 dark:text-zinc-400">
                Fatura bir firma adına kesilsin. Fiyatlarınız değişmez.
              </span>
            </span>
          </label>
          {draft.corporateInvoice && (
            <div className="mt-4 space-y-4">
              <CompanyFields
                value={draft.company}
                onChange={(company) => set({ company })}
              />
              {/* The firm's own address, whichever kind of firm it is: the
                  invoice is addressed to it, not to the customer. */}
              <fieldset className="border-t border-slate-200 pt-4 dark:border-white/10">
                <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">Adres</legend>
                <AddressFields
                  value={draft.corporateAddress}
                  onChange={(corporateAddress) => set({ corporateAddress })}
                  required
                />
              </fieldset>
            </div>
          )}
        </FormSection>
      )}

      {international && <CustomsNotice />}

      <Button type="submit" loading={submitting}>
        {submitting ? copy.submitting : copy.submit}
      </Button>
        </div>
      )}
    </form>
  );
}
