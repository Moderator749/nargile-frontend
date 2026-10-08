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
