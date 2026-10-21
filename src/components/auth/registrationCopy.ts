/**
 * The sign-up form's wording (registrationMessages in lib/i18n/messages/auth).
 *
 * On the Turkish site: Turkish for the three domestic account types, English
 * for the international one — the customer who needs that branch cannot read
 * the others. On the English and Arabic sites both are in the page's language.
 * Only the strings that both branches share live here; a section or field that
 * exists in one branch only carries its own label where it is written
 * (`CompanyFields`, `AddressFields`, `InternationalFields`), which is also
 * where it can be read next to what it belongs to.
 */

import type { Locale } from "@/lib/i18n/config";
import { registrationMessages, type RegistrationCopy } from "@/lib/i18n/messages/auth";

export type { RegistrationCopy };

export const copyFor = (international: boolean, locale: Locale = "tr"): RegistrationCopy =>
  registrationMessages[locale][international ? "international" : "domestic"];
