import { api } from "@/lib/api";
import type { LoginRequest, OrderLookup, RegistrationCreate, Token, User } from "@/types";

export async function login(payload: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/login", payload);
  return data;
}

/**
 * Fetches the current profile. Pass `token` right after login, before it is
 * stored; otherwise the interceptor attaches the stored one.
 */
export async function fetchMe(token?: string): Promise<User> {
  const { data } = await api.get<User>("/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function register(payload: RegistrationCreate): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

/** "Şifremi unuttum". Answers the same whether or not the account exists. */
export async function requestPasswordReset(channel: "email" | "sms", identifier: string): Promise<string> {
  const { data } = await api.post<{ detail: string }>("/auth/password-reset/request", { channel, identifier });
  return data.detail;
}

/** Whether an e-mailed reset link can still be used. */
export async function checkResetLink(token: string): Promise<boolean> {
  const { data } = await api.post<{ valid: boolean }>("/auth/password-reset/check", { token });
  return data.valid;
}

/** Set a new password with the e-mailed link's token, or the SMS code and its number. */
export async function confirmPasswordReset(
  body: { new_password: string } & ({ token: string } | { phone: string; code: string }),
): Promise<string> {
  const { data } = await api.post<{ detail: string }>("/auth/password-reset/confirm", body);
  return data.detail;
}

/** "Üye olmadan devam et": a session for one guest checkout. 409 when the address has an account. */
export async function startGuest(body: { email: string; full_name: string; phone: string }): Promise<Token> {
  const { data } = await api.post<Token>("/auth/guest", body);
  return data;
}

/** A guest sets a password: its checkout becomes an account (a new session; the guest's ends). */
export async function claimGuest(password: string): Promise<Token> {
  const { data } = await api.post<Token>("/auth/guest/claim", { password });
  return data;
}

/** "Kargo Takip" without signing in: the order with this number, placed under this address. */
export async function lookupOrder(orderNumber: string, email: string): Promise<OrderLookup> {
  const { data } = await api.get<OrderLookup>("/orders/lookup", { params: { order_number: orderNumber, email } });
  return data;
}
