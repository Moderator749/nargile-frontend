"use client";

import { AlertTriangle } from "lucide-react";

import { law4207Terms, type Law4207Lang } from "@/lib/law4207";

/**
 * A non-blocking reminder under a text field: lists the words that 4207
 * (tobacco advertising law) rules out — tobacco, pleasure framing, "bol
 * duman" — found in `texts`. Saving is never stopped; nothing shows when the
 * text is clean.
 */
export function Law4207Notice({ texts, lang = "tr" }: { texts: Array<string | null | undefined>; lang?: Law4207Lang }) {
  const terms = law4207Terms(texts, lang);
  if (terms.length === 0) return null;
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        <strong>4207 uyarısı:</strong> {terms.map((t) => `“${t}”`).join(", ")}. Tütünden ve keyiften söz etmeden
        ekipmanı teknik olarak anlatın (malzeme, ölçü, uyumluluk). Kaydetmeye engel değildir.
      </span>
    </p>
  );
}
