"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * A field's one-click copy on the order sheet: the address or number goes to
 * the clipboard as text, for pasting into the carrier's form or a message. A
 * tick says it worked; never printed.
 */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      data-print-hide
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => setCopied(true));
      }}
      aria-label={copied ? `${label} kopyalandı` : `${label} kopyala`}
      title={copied ? "Kopyalandı" : "Kopyala"}
      className="-my-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-600 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}
