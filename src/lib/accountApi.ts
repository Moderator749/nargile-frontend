/**
 * "Hesabım": the customer's name and number, password and address book.
 * Checkout reads the same addresses through fetchSavedAddresses.
 */

import { api } from "@/lib/api";
import type { CommunicationPreferences } from "@/lib/ordersApi";
import type { AddressBookEntry, AddressBookInput, Token } from "@/types";

export interface ProfileInput {
  full_name: string;
  phone: string;
}

export async function updateProfile(body: ProfileInput): Promise<ProfileInput> {
  const { data } = await api.put<ProfileInput>("/me/profile", body);
  return data;
}

/** The new session's token: every other session ends with the old password. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<Token> {
  const { data } = await api.post<Token>("/me/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}

export async function fetchAddressBook(signal?: AbortSignal): Promise<AddressBookEntry[]> {
  const { data } = await api.get<AddressBookEntry[]>("/me/address-book", { signal });
  return data;
}

export async function addAddress(body: AddressBookInput): Promise<AddressBookEntry> {
  const { data } = await api.post<AddressBookEntry>("/me/address-book", body);
  return data;
}

export async function editAddress(id: number, body: AddressBookInput): Promise<AddressBookEntry> {
  const { data } = await api.put<AddressBookEntry>(`/me/address-book/${id}`, body);
  return data;
}

export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/me/address-book/${id}`);
}

/**
 * The one-time consent card: the channels ticked are consented to, and the
 * card is not shown again. "Şimdi değil" sends neither.
 */
export async function answerConsentPrompt(body: CommunicationPreferences): Promise<CommunicationPreferences> {
  const { data } = await api.post<CommunicationPreferences>("/me/consent-prompt", body);
  return data;
}
