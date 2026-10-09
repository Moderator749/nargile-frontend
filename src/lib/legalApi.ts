import { api } from "@/lib/api";
import type { LegalDocument, LegalKey } from "@/types";

/**
 * The shop's legal texts, as the storefront reads them: public, and always
 * complete — a document nobody has edited comes back on the text it was seeded
 * with, so the cart never has a blank agreement to accept.
 */
export async function fetchLegalDocuments(signal?: AbortSignal): Promise<LegalDocument[]> {
  const { data } = await api.get<LegalDocument[]>("/settings/legal", { signal });
  return data;
}

/** The documents by key, for picking out the two the cart needs. */
export function byKey(documents: LegalDocument[]): Partial<Record<LegalKey, LegalDocument>> {
  return Object.fromEntries(documents.map((doc) => [doc.key, doc]));
}
