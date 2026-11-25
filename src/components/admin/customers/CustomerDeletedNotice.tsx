"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

import {
  DELETED_MODE_PARAM,
  DELETED_ORDERS_PARAM,
  DELETED_PARAM,
  deletionNotice,
  type DeleteMode,
} from "@/lib/customerDelete";

/**
 * After "Kalıcı Olarak Sil": the customer list says what was done, once. The
 * parameters that carried it are dropped from the address at once, so a
 * reload or a shared link does not repeat it.
 */
export function CustomerDeletedNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const name = params.get(DELETED_PARAM);
  const mode = (params.get(DELETED_MODE_PARAM) as DeleteMode | null) ?? "deleted";
  const orders = Number(params.get(DELETED_ORDERS_PARAM) ?? 0) || 0;
  // Read once, kept after the address is cleaned.
  const [text, setText] = useState<string | null>(() => (name ? deletionNotice(mode, name, orders) : null));

  // The address loses the parameters that carried the notice (navigation is an external system).
  useEffect(() => {
    if (!name) return;
    const rest = new URLSearchParams(params.toString());
    [DELETED_PARAM, DELETED_MODE_PARAM, DELETED_ORDERS_PARAM].forEach((k) => rest.delete(k));
    router.replace(rest.size ? `${pathname}?${rest.toString()}` : pathname, { scroll: false });
  }, [name, params, pathname, router]);

  if (!text) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1">{text}</p>
      <button
        type="button"
        onClick={() => setText(null)}
        aria-label="Kapat"
        className="rounded p-0.5 text-emerald-700 transition-colors duration-150 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
