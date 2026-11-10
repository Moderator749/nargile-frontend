import { api } from "@/lib/api";

/**
 * Takes the token's address off campaign e-mail ("Abonelikten Çık"); no
 * session needed. Resolves to the address, as the API names it.
 */
export async function unsubscribeEmail(token: string): Promise<string> {
  const { data } = await api.post<{ email: string }>("/newsletter/unsubscribe", null, { params: { token } });
  return data.email;
}
