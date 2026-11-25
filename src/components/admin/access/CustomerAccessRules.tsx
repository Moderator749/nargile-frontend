"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { AccessRulesEditor } from "@/components/admin/access/AccessRulesEditor";
import { Alert } from "@/components/ui/Alert";
import {
  ACCESS_TIERS,
  customerLabel,
  fetchAccessRules,
  fetchCustomerRules,
  sameRules,
  saveCustomerRules,
  type AccessRules,
  type AccessTier,
  type CustomerRules,
  type TierRules,
} from "@/lib/accessRules";
import { getApiErrorMessage } from "@/lib/errors";

/**
 * One customer's own access rules ("Cari bazında"): what they may not see on
 * top of what their group (Perakende, Kafe, Toptan, Bayi) already may not —
 * shown here ticked and locked. Loads and saves by itself; used on the rules
 * page and on the customer's own page.
 */
export function CustomerAccessRules({
  userId,
  options,
  onSaved,
  showName = false,
}: {
  userId: string;
  /** The categories, brands and group sets, when the caller has them already. */
  options?: AccessRules | null;
  onSaved?: (saved: CustomerRules) => void;
  showName?: boolean;
}) {
  const [all, setAll] = useState<AccessRules | null>(options ?? null);
  const [saved, setSaved] = useState<CustomerRules | null>(null);
  const [draft, setDraft] = useState<TierRules | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (!options) {
      fetchAccessRules(controller.signal)
        .then(setAll)
        .catch((err) => {
          if (!controller.signal.aborted) setResult({ kind: "error", text: getApiErrorMessage(err, "Kısıtlamalar yüklenemedi.") });
        });
    }
    fetchCustomerRules(userId, controller.signal)
      .then((r) => {
        setSaved(r);
        setDraft(r.rules);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setResult({ kind: "error", text: getApiErrorMessage(err, "Cari kısıtlamaları yüklenemedi.") });
      });
    return () => controller.abort();
  }, [userId, options]);

  const data = options ?? all;
  if (!data || !saved || !draft) {
    return result ? <Alert variant={result.kind}>{result.text}</Alert> : <div className="h-64 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />;
  }

  const tier = (saved.customer.segment ?? "RETAIL") as AccessTier;
  const group = data.tiers[tier];
  const groupLabel = ACCESS_TIERS.find((t) => t.tier === tier)?.label ?? tier;
  const dirty = !sameRules(draft, saved.rules);

  async function save() {
    if (!draft || !dirty || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const next = await saveCustomerRules(userId, draft);
      setSaved(next);
      setDraft(next.rules);
      onSaved?.(next);
      setResult({ kind: "success", text: "Cari kısıtlamaları kaydedildi; müşterinin bir sonraki isteğinde uygulanır." });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-zinc-300">
          {showName && <strong className="font-semibold text-slate-900 dark:text-zinc-100">{customerLabel(saved.customer)} · </strong>}
          Fiyat grubu: <strong className="font-semibold">{groupLabel}</strong>. “grubundan” işaretliler {groupLabel} grubunun
          kısıtlamalarıdır; burada işaretledikleriniz yalnızca bu cariye eklenir.
        </p>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Cari kısıtlamalarını kaydet
        </button>
      </div>
      {result && <Alert variant={result.kind}>{result.text}</Alert>}
      <AccessRulesEditor
        draft={draft}
        categories={data.categories}
        brands={data.brands}
        inherited={group}
        onChange={(next) => {
          setDraft(next);
          setResult(null);
        }}
      />
    </div>
  );
}
