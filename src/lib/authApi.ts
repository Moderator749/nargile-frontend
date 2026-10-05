import { api } from "@/lib/api";
import type { LoginRequest, Token, User, UserCreate } from "@/types";

export async function login(payload: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/login", payload);
  return data;
}

/** Fetches the profile for `token` explicitly, before it is stored. */
export async function fetchMe(token: string): Promise<User> {
  const { data } = await api.get<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function register(payload: UserCreate): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}
