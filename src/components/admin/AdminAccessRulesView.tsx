"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Search, UserRound } from "lucide-react";

import { AccessRulesEditor } from "@/components/admin/access/AccessRulesEditor";
import { CustomerAccessRules } from "@/components/admin/access/CustomerAccessRules";
import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { SEGMENT_LABELS } from "@/components/admin/customers/CustomerLabels";
import { Alert } from "@/components/ui/Alert";
import {
  ACCESS_TIERS,
  customerLabel,
  fetchAccessRules,
  fetchRuleCustomers,
  sameRules,
  saveTierRules,
  type AccessRules,
  type AccessTier,
  type RuleCustomer,
  type TierRules,
} from "@/lib/accessRules";
import { adminListCustomersPage } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";
import type { SegmentType } from "@/types";

type Tab = AccessTier | "CUSTOMER";

/**
 * "Grup Erişim Kısıtlamaları": per customer group (and for visitors not
 * signed in) — or per customer ("Cari (Müşteri)") — the categories, brands
 * and storefront pages it may not see. A customer's own rules add to their
 * group's. Saved per group or customer; the API enforces them from the next
 * request on (lists, search, product pages, the price catalogue, the cart),
 * and the storefront shows a notice in place of a closed page.
 */
export function AdminAccessRulesView() {
  const [data, setData] = useState<AccessRules | null>(null);
  const [tab, setTab] = useState<Tab>("WHOLESALE");
  const [drafts, setDrafts] = useState<Partial<Record<AccessTier, TierRules>>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchAccessRules(controller.signal)
      .then(setData)
      .catch((err) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Kısıtlamalar yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  if (!data) {
    return (
      <>
        <AdminPageHeader title="Grup Erişim Kısıtlamaları" />
        {loadError ? <Alert variant="error">{loadError}</Alert> : <div className={`${panelClass} h-96 motion-safe:animate-pulse`} />}
      </>
    );
  }

  const tier = tab === "CUSTOMER" ? null : tab;
  const saved = tier ? data.tiers[tier] : null;
  const draft = tier ? (drafts[tier] ?? saved!) : null;
  const dirty = !!(draft && saved && !sameRules(draft, saved));

  async function save() {
    if (!tier || !draft || !dirty || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const next = await saveTierRules(tier, draft);
      setData(next);
      setDrafts((d) => ({ ...d, [tier]: undefined }));
      void refreshStorefront(); // a visitor's cached pages follow the new rules
      setResult({ kind: "success", text: `${ACCESS_TIERS.find((t) => t.tier === tier)!.label} kısıtlamaları kaydedildi; hemen uygulanır.` });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  const count = (t: AccessTier) => {
    const r = drafts[t] ?? data.tiers[t];
    return r.category_ids.length + r.brand_ids.length + r.routes.length;
  };
  const tabClass = (on: boolean) =>
    `inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 ${
      on
        ? "bg-red-600 text-white dark:bg-red-500"
        : "text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5"
    }`;

  return (
    <>
      <AdminPageHeader
        title="Grup Erişim Kısıtlamaları"
        description="Seçtiğiniz müşteri grubunun — ya da tek bir carinin — göremeyeceği kategorileri, markaları ve sayfaları işaretleyin. Kapalı ürünler listelerde, aramada, ürün sayfalarında, fiyat kataloğunda ve sepette görünmez; doğrudan adresle girilince “Bu sayfa veya ürün grubu hesap türünüz için görüntülemeye kapalıdır” uyarısı çıkar. Carinin kendi kısıtlamaları grubununkilere eklenir. Yöneticiler her şeyi görür."
        actions={
          tier ? (
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Kaydet
            </button>
          ) : undefined
        }
      />

      <div role="tablist" aria-label="Kısıtlama kapsamı" className="mb-4 flex flex-wrap gap-2">
        {ACCESS_TIERS.map(({ tier: t, label, hint }) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            title={hint}
            onClick={() => {
              setTab(t);
              setResult(null);
            }}
            className={tabClass(tab === t)}
          >
            {label}
            {count(t) > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] ${tab === t ? "bg-white/20" : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`}>
                {count(t)}
              </span>
            )}
            {drafts[t] && !sameRules(drafts[t]!, data.tiers[t]) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="kaydedilmedi" />}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={tab === "CUSTOMER"}
          title="Tek bir müşteriye özel kısıtlamalar"
          onClick={() => {
            setTab("CUSTOMER");
            setResult(null);
          }}
          className={tabClass(tab === "CUSTOMER")}
        >
          <UserRound className="h-4 w-4" aria-hidden /> Cari (Müşteri)
        </button>
      </div>

      {result && (
        <div className="mb-4">
          <Alert variant={result.kind}>{result.text}</Alert>
        </div>
      )}

      {tier && draft ? (
        <AccessRulesEditor
          draft={draft}
          categories={data.categories}
          brands={data.brands}
          dirty={dirty}
          onChange={(next) => {
            setDrafts((d) => ({ ...d, [tier]: next }));
            setResult(null);
          }}
        />
      ) : (
        <CustomerTab options={data} />
      )}
    </>
  );
}

/** "Cari (Müşteri)": find a customer by name, firm, e-mail or phone, or pick one that has rules; edit theirs. */
function CustomerTab({ options }: { options: AccessRules }) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ id: string; label: string; detail: string; segment: SegmentType | null }[]>([]);
  const [withRules, setWithRules] = useState<RuleCustomer[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchRuleCustomers(controller.signal)
      .then(setWithRules)
      .catch(() => setWithRules([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      adminListCustomersPage({ q, page: 0, pageSize: 10 }, controller.signal)
        .then(({ customers }) =>
          setFound(
            customers
              .filter((c) => !c.is_guest)
              .map((c) => ({
                id: c.id,
                label: customerLabel(c),
                detail: [c.full_name !== customerLabel(c) ? c.full_name : null, c.email, c.phone].filter(Boolean).join(" · "),
                segment: c.segment,
              })),
          ),
        )
        .catch(() => undefined);
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const results = query.trim().length >= 2 ? found : [];

  // Full width, stacked: the finding on top, the chosen customer's rules below
  // at the same roomy width as a group's (a side column squeezed the names).
  return (
    <div className="space-y-6">
      <section className={`${panelClass} p-5`} aria-label="Cari seç">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">Cari ara</h3>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ad, firma, e-posta, telefon"
                aria-label="Cari ara"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm dark:border-white/15 dark:bg-zinc-900"
              />
            </label>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {results.map((c) => (
                <li key={c.id}>
                  <PickButton active={picked === c.id} onClick={() => setPicked(c.id)} label={c.label} detail={c.detail} segment={c.segment} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">Kısıtlaması olan cariler</h3>
            <ul className="mt-2 grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
              {withRules === null && <li className="h-8 rounded bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />}
              {withRules?.length === 0 && <li className="text-sm text-slate-500 dark:text-zinc-400">Henüz yok.</li>}
              {withRules?.map((c) => (
                <li key={c.id}>
                  <PickButton
                    active={picked === c.id}
                    onClick={() => setPicked(c.id)}
                    label={customerLabel(c)}
                    detail={`${c.rule_count} kısıtlama · ${c.email}`}
                    segment={(c.segment as SegmentType | null) ?? null}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <div>
        {picked ? (
          <CustomerAccessRules
            key={picked}
            userId={picked}
            options={options}
            showName
            onSaved={(s) =>
              setWithRules((list) => {
                const rest = (list ?? []).filter((c) => c.id !== s.customer.id);
                return s.customer.rule_count > 0 ? [s.customer, ...rest] : rest;
              })
            }
          />
        ) : (
          <div className={`${panelClass} p-8 text-center text-sm text-slate-500 dark:text-zinc-400`}>
            Kısıtlama tanımlamak için soldan bir cari arayın ya da seçin.
          </div>
        )}
      </div>
    </div>
  );
}

function PickButton({
  active,
  onClick,
  label,
  detail,
  segment,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  detail: string;
  segment: SegmentType | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-2 text-left transition-colors duration-150 ${
        active ? "bg-red-50 ring-1 ring-red-600 dark:bg-red-500/10 dark:ring-red-400" : "hover:bg-slate-50 dark:hover:bg-white/5"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">{label}</span>
        {segment && <span className="shrink-0 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{SEGMENT_LABELS[segment]}</span>}
      </span>
      <span className="block truncate text-xs text-slate-500 dark:text-zinc-400">{detail}</span>
    </button>
  );
}
