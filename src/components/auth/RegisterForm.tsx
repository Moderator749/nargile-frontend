"use client";

import { useId, useMemo, useRef, useState, type ReactNode, type SubmitEvent } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, FileText } from "lucide-react";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { useLocalePath } from "@/components/i18n/navigation";
import { BusinessKindPicker, CustomerGroupPicker } from "@/components/auth/AccountTypePicker";
import { AddressFields } from "@/components/auth/AddressFields";
import { CompanyFields } from "@/components/auth/CompanyFields";
import type { Bind } from "@/components/auth/fieldBinding";
import { UsernameField } from "@/components/auth/UsernameField";
import { FormSection } from "@/components/auth/FormSection";
import {
  CustomsNotice,
  InternationalAddressFields,
  InternationalIdentityFields,
} from "@/components/auth/InternationalFields";
import { copyFor, type RegistrationCopy } from "@/components/auth/registrationCopy";
import {
  MIN_PASSWORD_LENGTH,
  TURKISH_BUSINESS_TYPES,
  emptyDraft,
  groupOf,
  isExtraField,
  isTurkishBusiness,
  registrationErrors,
  showsNationalId,
  switchAccountType,
  toPayload,
  type BusinessKind,
  type CustomerGroup,
  type FieldErrors,
  type FieldKey,
  type RegistrationDraft,
} from "@/components/auth/registrationDraft";
import { RichText } from "@/components/ui/RichText";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Collapse } from "@/components/ui/Collapse";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { useLegalDocuments } from "@/hooks/useLegalDocuments";
import { register } from "@/lib/authApi";
import { apiDetailOf, getApiErrorMessage, translateApiDetail } from "@/lib/errors";
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

/**
 * The fields nobody has to give, behind one click: a username, a landline,
 * and for an individual their TC number, an address and a corporate invoice.
 * The header names what is inside, so whoever wants one of them knows where
 * it is without opening it to look.
 */
function ExtrasSection({
  id,
  open,
  onToggle,
  copy,
  contents,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  copy: RegistrationCopy;
  /** What is inside, as the labels it shows. */
  contents: string[];
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:hover:bg-white/5 sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-100">
            {copy.extras} <span className="font-normal text-slate-500 dark:text-zinc-400">({copy.optional})</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-zinc-400">{contents.join(" · ")}</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 dark:text-zinc-500 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <Collapse open={open} id={id}>
        <div className="space-y-5 border-t border-slate-200 px-4 pt-4 pb-5 dark:border-white/10 sm:px-5">{children}</div>
      </Collapse>
    </div>
  );
}

/** The first field on the page that needs fixing: in view, centred, and the cursor in it. */
function revealFirstError(form: HTMLFormElement | null) {
  if (!form) return;
  // A field in a closed fold is still in the page while it slides shut; it is
  // not one the customer can fix.
  const target = Array.from(form.querySelectorAll<HTMLElement>("[data-invalid]")).find(
    (el) => !el.closest("[inert]"),
  );
  if (!target) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
  // A radio group is marked on its fieldset; the cursor goes to its first card.
  const field = target.matches("input, select, textarea")
    ? target
    : target.querySelector<HTMLElement>("input:not([disabled]), select, textarea");
  // The smooth scroll is already on its way; focusing must not jump ahead of it.
  field?.focus({ preventScroll: true });
}

/** A sign-in name the server turned down, said under the field it is about. */
function serverFieldErrors(error: unknown): FieldErrors | null {
  const detail = apiDetailOf(error);
  if (detail === "Email already registered") return { email: translateApiDetail(detail) };
  if (detail === "Username already taken") return { username: translateApiDetail(detail) };
  return null;
}

const asBusinessKind = (accountType: RegistrationDraft["accountType"]): BusinessKind | null =>
  (TURKISH_BUSINESS_TYPES as string[]).includes(accountType) ? (accountType as BusinessKind) : null;

/**
 * Sign-up, for whoever is buying: a person, a Turkish business, or a business
 * abroad.
 *
 * The first question is who — two big cards and a slim one for abroad — and
 * the answer opens the fields it needs: a person gives a name, a phone, an
 * e-mail and a password, and nothing else unless they want to; a business
 * gets its invoice identity on top, sliding open above the contact fields.
 * Everything optional waits behind "Ek Bilgiler". On the Turkish site the
 * international form is in English, its customer's language; on the English
 * and Arabic sites everything is in the page's language. What each account
 * type requires lives in `registrationDraft`, which mirrors the server's schema.
 *
 * The form checks itself, not the browser (`noValidate`), so every problem is
 * said in words under the field it is about, with the field outlined in red.
 * A field is checked when it is left with something in it, and every field
 * once the button is pressed; a press that finds anything takes the customer
 * to the first field to fix — a long form's button is far from its top, and
 * a message up there is one they never see — and says so above the button too.
 * From then on the marks follow the typing: a field goes back to normal the
 * moment it is right.
 *
 * It asks who the customer is, how to reach them, how they will log in and who
 * to invoice, and stops there. Where an order should go is checkout's question,
 * which needs an order to answer; which price group a firm belongs to is an
 * admin's answer, given once the account exists.
 */
/** `next`: where signing in after sign-up should land (the checkout, from the cart). */
export function RegisterForm({ next: back = null }: { next?: string | null } = {}) {
  const router = useRouter();
  const to = useLocalePath();
  const locale = useLocale();
  const m = useMessages(registrationMessages);
  const [draft, setDraft] = useState<RegistrationDraft>(() => emptyDraft());
  // Nothing is open until they say who is buying.
  const [group, setGroup] = useState<CustomerGroup | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<ReadonlySet<FieldKey>>(() => new Set());
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const extrasId = useId();


  const international = draft.accountType === "INTERNATIONAL";
  // A Turkish firm. An international account has its own identity section, and
  // its own question about whether it is a business at all.
  const business = isTurkishBusiness(draft.accountType);
  const individual = group === "INDIVIDUAL";
  const copy = copyFor(international, locale);

  const checks = useMemo(() => registrationErrors(draft, locale), [draft, locale]);
  const shown: FieldErrors = { ...serverErrors };
  for (const key of Object.keys(checks) as FieldKey[]) {
    if (attempted || touched.has(key)) shown[key] ??= checks[key];
  }
  const bind: Bind = (key) => ({
    error: shown[key],
    // Left with something in it: worth checking now. Left empty: that waits
    // for the button, or every field tabbed past would turn red.
    onBlur: (event) => {
      if (event.target.value.trim() && !touched.has(key)) setTouched((current) => new Set(current).add(key));
    },
  });

  const set = (patch: Partial<RegistrationDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    // What the server said about an address is about the one it was sent.
    if ("email" in patch || "username" in patch) {
      setServerErrors(({ email, username, ...rest }) => ({
        ...rest,
        ...("email" in patch ? {} : email ? { email } : {}),
        ...("username" in patch ? {} : username ? { username } : {}),
      }));
    }
  };

  function pickGroup(next: CustomerGroup) {
    setGroup(next);
    setDraft((current) =>
      switchAccountType(
        current,
        // A business keeps the kind it already picked, coming back to the card.
        next === "BUSINESS" ? (groupOf(current.accountType) === "BUSINESS" ? current.accountType : "BUSINESS") : next,
      ),
    );
    // A new form: nothing on it has been checked yet.
    setAttempted(false);
    setTouched(new Set());
    setServerErrors({});
    setError(null);
  }

  /** Marks everything that needs fixing, opens the fold it may be in, and goes to the first. */
  function showErrors(found: FieldErrors) {
    flushSync(() => {
      setAttempted(true);
      if ((Object.keys(found) as FieldKey[]).some((key) => isExtraField(key, draft.accountType))) setExtrasOpen(true);
    });
    revealFirstError(formRef.current);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (Object.keys(checks).length > 0) {
      setError(null);
      showErrors(checks);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await register(toPayload(draft));
      // An account exists at once; a firm's prices wait for a person, and an
      // international customer waits to hear from the sales team.
      const next = international ? "export" : business ? "review" : "1";
      router.replace(to(`/login?registered=${next}${back ? `&next=${encodeURIComponent(back)}` : ""}`));
    } catch (err) {
      const fields = serverFieldErrors(err);
      setSubmitting(false);
      if (fields) {
        flushSync(() => setServerErrors(fields));
        showErrors(fields);
      } else {
        setError(getApiErrorMessage(err, m.failed));
      }
    }
  }

  const username = (
    <UsernameField
      copy={copy}
      value={draft.username}
      error={shown.username}
      onChange={(username) => set({ username })}
      onLeave={(username) => {
        if (username !== draft.username) set({ username });
        if (username && !touched.has("username")) setTouched((current) => new Set(current).add("username"));
      }}
    />
  );

  // What "Ek Bilgiler" holds, said on its header.
  const extras = [copy.username];
  if (!international) extras.push(m.landline);
  if (individual) extras.push(m.nationalId, copy.addressSection, m.corporateInvoiceSection);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <CustomerGroupPicker value={group} onChange={pickGroup} />

      <Collapse open={group !== null} id={formId}>
        <div className="pt-6">
          {/* A business's invoice identity, sliding open above the contact
              fields when the business card is picked. */}
          <Collapse open={business}>
            <div className="pb-5">
              <FormSection title={copy.identitySection} description={copy.identityHint}>
                <div className="space-y-4">
                  <BusinessKindPicker
                    value={asBusinessKind(draft.accountType)}
                    onChange={(kind) => setDraft((current) => switchAccountType(current, kind))}
                    error={shown.kind}
                  />
                  <CompanyFields
                    value={draft.company}
                    onChange={(company) => set({ company })}
                    nationalId={draft.nationalId}
                    onNationalIdChange={(nationalId) => set({ nationalId })}
                    bind={bind}
                  />
                  {/* The invoice address, in the section the invoice is described
                      in rather than one of its own. */}
                  <fieldset className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">{m.address}</legend>
                    <AddressFields
                      value={draft.billing}
                      onChange={(billing) => set({ billing })}
                      required
                      prefix="billing"
                      bind={bind}
                    />
                  </fieldset>
                  <DocumentNotice />
                </div>
              </FormSection>
            </div>
          </Collapse>

          <div className="space-y-5">
            {international && (
              <FormSection title={copy.identitySection} description={copy.identityHint}>
                <InternationalIdentityFields
                  kind={draft.internationalKind}
                  onKindChange={(internationalKind) => set({ internationalKind })}
                  company={draft.company}
                  onCompanyChange={(company) => set({ company })}
                  bind={bind}
                />
              </FormSection>
            )}

            <FormSection title={international || business ? copy.contactSection : m.personalSection}>
              <div className="grid gap-4 sm:grid-cols-2">
                {individual ? (
                  <Input
                    label={m.fullName}
                    autoComplete="name"
                    maxLength={150}
                    required
                    value={draft.fullName}
                    onChange={(e) => set({ fullName: e.target.value })}
                    placeholder={m.fullNamePlaceholder}
                    {...bind("fullName")}
                  />
                ) : (
                  // An international account gave its company name in the section above.
                  <Input
                    label={copy.contactPerson}
                    autoComplete="name"
                    maxLength={150}
                    required
                    value={draft.contactName}
                    onChange={(e) => set({ contactName: e.target.value })}
                    {...bind("contactName")}
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
                  {...bind("phone")}
                />
                <Input
                  label={copy.email}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  maxLength={255}
                  required
                  placeholder={copy.emailPlaceholder}
                  value={draft.email}
                  onChange={(e) => set({ email: e.target.value })}
                  {...bind("email")}
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
                  {...bind("password")}
                />
              </div>
            </FormSection>

            {international && (
              <FormSection title={copy.addressSection}>
                <InternationalAddressFields
                  value={draft.internationalAddress}
                  onChange={(internationalAddress) => set({ internationalAddress })}
                  bind={bind}
                />
              </FormSection>
            )}

            <ExtrasSection
              id={extrasId}
              open={extrasOpen}
              onToggle={() => setExtrasOpen((open) => !open)}
              copy={copy}
              contents={extras}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {username}
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
                    {...bind("landline")}
                  />
                )}
                {individual && showsNationalId(draft) && (
                  <Input
                    label={m.nationalId}
                    inputMode="numeric"
                    maxLength={11}
                    hint={m.nationalIdHint}
                    value={draft.nationalId}
                    onChange={(e) => set({ nationalId: e.target.value.replace(/\D/g, "") })}
                    {...bind("nationalId")}
                  />
                )}
              </div>

              {individual && (
                <>
                  <fieldset className="border-t border-slate-200 pt-4 dark:border-white/10">
                    <legend className="text-sm font-semibold text-slate-700 dark:text-zinc-300">{copy.addressSection}</legend>
                    {copy.addressHint && (
                      <p className="mt-1 mb-3 text-xs text-slate-500 dark:text-zinc-400">{copy.addressHint}</p>
                    )}
                    <AddressFields
                      value={draft.billing}
                      onChange={(billing) => set({ billing })}
                      required={false}
                      prefix="billing"
                      bind={bind}
                    />
                  </fieldset>

                  <div className="border-t border-slate-200 pt-4 dark:border-white/10">
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
                    <Collapse open={draft.corporateInvoice}>
                      <div className="space-y-4 pt-4">
                        <CompanyFields value={draft.company} onChange={(company) => set({ company })} bind={bind} />
                        {/* The firm's own address, whichever kind of firm it is: the
                            invoice is addressed to it, not to the customer. */}
                        <fieldset className="border-t border-slate-200 pt-4 dark:border-white/10">
                          <legend className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-300">{m.address}</legend>
                          <AddressFields
                            value={draft.corporateAddress}
                            onChange={(corporateAddress) => set({ corporateAddress })}
                            required
                            prefix="corporate"
                            bind={bind}
                          />
                        </fieldset>
                      </div>
                    </Collapse>
                  </div>
                </>
              )}
            </ExtrasSection>

            {international && <CustomsNotice />}

            <MarketingConsent
              checked={draft.marketingConsent}
              onChange={(marketingConsent) => set({ marketingConsent })}
              copy={copy}
            />

            {/* Said here, by the button, where whoever pressed it is looking. */}
            <div className="space-y-3">
              {attempted && Object.keys(shown).length > 0 && <Alert variant="error">{copy.fixFields}</Alert>}
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" loading={submitting}>
                {submitting ? copy.submitting : copy.submit}
              </Button>
            </div>
          </div>
        </div>
      </Collapse>
    </form>
  );
}
