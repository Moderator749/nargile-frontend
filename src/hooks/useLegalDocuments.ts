"use client";

import { useEffect, useState } from "react";

import { byKey, fetchLegalDocuments } from "@/lib/legalApi";
import type { LegalDocument, LegalKey } from "@/types";

/**
 * The shop's legal texts, read once per page.
 *
 * Null while they load, so a box that shows one can hold its place instead of
 * appearing late. A failed read leaves them null rather than blocking checkout:
 * the agreements are still accepted, and the server keeps its own record of the
 * text that was live.
 */
export function useLegalDocuments(): Partial<Record<LegalKey, LegalDocument>> | null {
  const [documents, setDocuments] = useState<Partial<Record<LegalKey, LegalDocument>> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchLegalDocuments(controller.signal)
      .then((docs) => setDocuments(byKey(docs)))
      .catch(() => {
        // Non-critical: the cart renders without the texts.
      });
    return () => controller.abort();
  }, []);

  return documents;
}
