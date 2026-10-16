import { api } from "@/lib/api";
import type { LoginRequest, RegistrationCreate, Token, User } from "@/types";

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
