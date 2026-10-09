/**
 * The delivery step's state and its checks.
 *
 * A customer either ships to an address the shop already has — the ones
 * sign-up collected — or types a new one, and the two are kept apart: picking a
 * saved address copies it into the draft for this order only, because an order
 * freezes its own address and nothing here writes back to the account.
 *
 * The checks mirror `ShippingAddress` in `app/schemas/address.py`, which has the
 * last word. A Turkish address is held to the 81 provinces and needs an ilçe; an
 * address abroad needs a country and a city, and has neither.
 */

import { isValidPhone, isValidInternationalPhone } from "@/lib/trIdentity";
import type { AccountType, SavedAddress, ShippingAddress } from "@/types";

export const TURKEY = "TR";

export interface AddressDraft {
  full_name: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  postal_code: string;
  line: string;
}

export const EMPTY_ADDRESS: AddressDraft = {
  full_name: "",
  phone: "",
  country: TURKEY,
  city: "",
  district: "",
  postal_code: "",
  line: "",
};

/**
 * What this order's delivery is: an address on file, the one being typed, or a
 * Yurtiçi branch the customer collects from themselves.
 *
 * "branch" is one of the four cards a bireysel customer picks from, so the
 * choice and the shipping method are the same decision there — picking it is
 * what makes the order YURTICI_BRANCH.
 */
export type AddressChoice =
  | { kind: "saved"; index: number }
  | { kind: "branch" }
  | { kind: "new" };

export const NEW_ADDRESS: AddressChoice = { kind: "new" };
export const BRANCH_DELIVERY: AddressChoice = { kind: "branch" };

/**
 * Which saved address a choice reads from, or null for one that is typed.
 *
 * A branch collection is addressed to the customer, so it travels under the
 * address on file; with nothing on file, it is typed like any other.
 */
export function savedIndex(choice: AddressChoice | null, saved: SavedAddress[] | null): number | null {
  if (choice?.kind === "saved") return choice.index;
  if (choice?.kind === "branch" && saved?.length) return 0;
  return null;
}

/** An export customer's own address is abroad; everyone else's is Turkish. */
export const shipsAbroad = (accountType: AccountType) => accountType === "INTERNATIONAL";

/**
 * Whether this account ships to the address it registered and nowhere else.
 *
 * A firm does: its prices and its documents hang off that one place, so
 * checkout shows it the address on file and lets it correct the details —
 * street, building, door — while the il and the ilçe stay put. The server
 * enforces the same line (`app/services/delivery.py`).
 *
 * Read off the account alone, so it is known before the saved addresses load
 * and the step never offers a "Yeni Adres" card it is about to take away. An
 * account with nothing on file still has to be able to type one, which is
 * decided where the list is known.
 */
export const shipsToRegistered = (accountType: AccountType) => accountType !== "INDIVIDUAL";

export function fromSaved(saved: SavedAddress, fallback: { full_name?: string; phone?: string }): AddressDraft {
  return {
    full_name: saved.full_name ?? fallback.full_name ?? "",
    phone: saved.phone ?? fallback.phone ?? "",
    country: saved.country,
    city: saved.city,
    district: saved.district ?? "",
    postal_code: saved.postal_code ?? "",
    line: saved.line,
  };
}

/** Mirrors the server's checks; null = this address can be shipped to. */
export function addressProblem(a: AddressDraft): string | null {
  const abroad = a.country !== TURKEY;
  if (a.full_name.trim().length < 2) return "Teslimat için ad soyad girin.";
  const phoneOk = abroad ? isValidInternationalPhone(a.phone) : isValidPhone(a.phone);
  if (!phoneOk) return "Geçerli bir telefon numarası girin.";
  if (!a.country) return abroad ? "Select a country." : "Ülke seçin.";
  if (abroad) {
    if (a.city.trim().length < 2) return "Enter the city, state or province.";
    if (a.line.trim().length < 5) return "Enter the delivery address.";
    return null;
  }
  if (!a.city) return "İl seçin.";
  if (a.district.trim().length < 2) return "İlçe girin.";
  if (a.line.trim().length < 5) return "Açık adresi girin.";
  return null;
}

/** "Başka biri teslim alacak": both fields or neither, and both must be usable. */
export function receiverProblem(name: string, phone: string, abroad: boolean): string | null {
  if (name.trim().length < 2) return "Teslim alacak kişinin adını girin.";
  const ok = abroad ? isValidInternationalPhone(phone) : isValidPhone(phone);
  return ok ? null : "Teslim alacak kişinin telefonunu girin.";
}

/**
 * What a method asks for is optional — but a number nobody answers is worse
 * than none, so an ambar phone is checked if one is typed. The server applies
 * the same rule and would refuse the order.
 */
export function freightProblem(phone: string): string | null {
  if (!phone.trim()) return null;
  return isValidPhone(phone) ? null : "Ambar telefonunu kontrol edin veya boş bırakın.";
}

const trimmed = (value: string) => value.trim() || null;

/** The draft as the order's address: only what this shape of address has. */
export function toShippingAddress(a: AddressDraft): ShippingAddress {
  const abroad = a.country !== TURKEY;
  return {
    full_name: a.full_name.trim(),
    phone: a.phone.trim(),
    country: a.country,
    city: a.city.trim(),
    district: abroad ? null : a.district.trim(),
    postal_code: abroad ? trimmed(a.postal_code) : null,
    line: a.line.trim(),
  };
}

/** One line for a saved-address card: what distinguishes it at a glance. */
export function addressSummary(saved: SavedAddress, countryName: (code: string) => string | null): string {
  const place =
    saved.country === TURKEY
      ? [saved.district, saved.city].filter(Boolean).join(" / ")
      : [saved.postal_code, saved.city, countryName(saved.country)].filter(Boolean).join(" · ");
  return [saved.line, place].filter(Boolean).join(", ");
}
