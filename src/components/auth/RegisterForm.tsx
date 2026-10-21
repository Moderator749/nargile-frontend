"use client";

import { useId, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { useLocalePath } from "@/components/i18n/navigation";
import { AccountTypePicker } from "@/components/auth/AccountTypePicker";
import { AddressFields } from "@/components/auth/AddressFields";
import { CompanyFields } from "@/components/auth/CompanyFields";
import { FormSection } from "@/components/auth/FormSection";
import {
  CustomsNotice,
  InternationalAddressFields,
  InternationalIdentityFields,
} from "@/components/auth/InternationalFields";
import { copyFor, type RegistrationCopy } from "@/components/auth/registrationCopy";
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
import { RichText } from "@/components/ui/RichText";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useLegalDocuments } from "@/hooks/useLegalDocuments";
import { register } from "@/lib/authApi";
import { getApiErrorMessage } from "@/lib/errors";
import { registrationMessages } from "@/lib/i18n/messages/auth";

/** What a firm has to bring to the approval, said once and left on screen. */
function DocumentNotice() {
  const m = useMessages(registrationMessages);
  return (
    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">{m.documentNoticeLabel}</strong> {m.documentNotice}
      </span>
    </p>
  );
}

/**
 * Sign-up for all four kinds of account.
 *
 * The account type at the top decides which sections are on screen, and which
 * language they are in: on the Turkish site the three Turkish types are asked
 * in Turkish, an international customer in English; on the English and Arabic
 * sites everything is in the page's language. Everything about what each one
 * requires lives in `registrationDraft`, which the server's own schema mirrors. Required
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
/**
 * Ticari elektronik ileti onayı (6563 sayılı Kanun). Optional and unticked
 * until the customer ticks it: the law forbids making it a condition of the
 * account, so the form never blocks on it and never pre-fills it. The link
 * opens the shop's privacy text, read live from the panel, so what they read
 * is what the shop last saved.
 */
function MarketingConsent({
  checked,
  onChange,
  copy,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  copy: RegistrationCopy;
}) {
  const m = useMessages(registrationMessages);
  const documents = useLegalDocuments();
  const [open, setOpen] = useState(false);
  const privacy = documents?.PRIVACY;

  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-white/5">
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="marketing_consent"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
        />
        <span>
          <span className="text-slate-700 dark:text-zinc-200">{copy.marketingConsent}</span>
          <span className="mt-1 block text-xs text-slate-500 dark:text-zinc-400">
            {copy.marketingConsentHint}{" "}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 font-medium text-red-700 underline-offset-2 hover:underline dark:text-red-400"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              {privacy?.title ?? copy.readPrivacy}
            </button>
          </span>
        </span>
      </label>

      <Dialog open={open} onClose={() => setOpen(false)} title={privacy?.title ?? copy.readPrivacy}>
        {privacy ? (
          <RichText html={privacy.body} nested className="text-sm text-slate-700 dark:text-zinc-300" />
        ) : (
          <p className="text-sm text-slate-500 dark:text-zinc-400">{m.privacyFailed}</p>
        )}
      </Dialog>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const to = useLocalePath();
  const locale = useLocale();
  const m = useMessages(registrationMessages);
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
  const copy = copyFor(international, locale);
  const set = (patch: Partial<RegistrationDraft>) => setDraft((current) => ({ ...current, ...patch }));

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const problem = registrationProblem(draft, locale);
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
      router.replace(to(`/login?registered=${next}`));
    } catch (err) {
      setError(getApiErrorMessage(err, m.failed));
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
          {m.pickFirst[0]} <span className="font-medium text-slate-700 dark:text-zinc-300">{m.cta}</span>
          {m.pickFirst[1]}
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
                <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">{m.address}</legend>
                <AddressFields value={draft.billing} onChange={(billing) => set({ billing })} required />
              </fieldset>
              <DocumentNotice />
            </div>
          )}
        </FormSection>
      )}

      <FormSection title={international || business ? copy.contactSection : m.personalSection}>
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
              label={m.fullName}
              autoComplete="name"
              maxLength={150}
              required
              autoFocus
              value={draft.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              placeholder={m.fullNamePlaceholder}
            />
          )}
          <Input
            label={copy.mobile}
            type="tel"
            // Phone numbers read left to right on the Arabic page too ("+966 …").
            dir="ltr"
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
              label={m.landline}
              type="tel"
              dir="ltr"
              inputMode="tel"
              maxLength={30}
              hint={m.optional}
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
              label={m.nationalId}
              inputMode="numeric"
              maxLength={11}
              hint={m.nationalIdHint}
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
        <FormSection title={m.corporateInvoiceSection}>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.corporateInvoice}
              onChange={(e) => set({ corporateInvoice: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-red-600"
            />
            <span>
              <span className="font-medium">{m.corporateInvoice}</span>
              <span className="block text-xs text-slate-500 dark:text-zinc-400">{m.corporateInvoiceHint}</span>
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
                <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">{m.address}</legend>
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

      <MarketingConsent
        checked={draft.marketingConsent}
        onChange={(marketingConsent) => set({ marketingConsent })}
        copy={copy}
      />

      <Button type="submit" loading={submitting}>
        {submitting ? copy.submitting : copy.submit}
      </Button>
        </div>
      )}
    </form>
  );
}
