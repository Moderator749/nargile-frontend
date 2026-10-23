"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Languages, Sparkles } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminTranslationDraftsView } from "@/components/admin/AdminTranslationDraftsView";
import { TranslationsTab } from "@/components/admin/homepage/TranslationsTab";
import { Alert } from "@/components/ui/Alert";
import { adminGetHomepage, adminTranslationDrafts } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { resolveHomepage } from "@/lib/homepage";
import type { Homepage } from "@/types";

const PATH = "/admin/translations";
const TAB_PARAM = "sekme";
type Tab = "texts" | "approvals";
const PARAM_OF: Record<Tab, string> = { texts: "ceviriler", approvals: "onaylar" };

const TABS: { value: Tab; label: string; Icon: typeof Languages; description: string }[] = [
  {
    value: "texts",
    label: "Çeviriler (EN / AR)",
    Icon: Languages,
    description: "Ana sayfa metinlerinin İngilizcesi ve Arapçası: eksik olanları doldurun ya da düzeltin; bu sekme kendi kaydedilir.",
  },
  {
    value: "approvals",
    label: "Çeviri Onayları",
    Icon: Sparkles,
    description:
      "Claude’un yazdığı İngilizce ve Arapça çeviriler. Sayfalarda görünürler ama siz onaylayana kadar arama motorlarına kapalıdırlar: açın, okuyun, gerekirse düzeltin ve “Onayla”ya basıp kaydedin.",
  },
];

/** The homepage document, as saved, for its texts to translate. */
function HomepageTexts() {
  const [doc, setDoc] = useState<Homepage | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    adminGetHomepage(controller.signal)
      .then((settings) => setDoc(resolveHomepage(settings.data)))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(err, "Ana sayfa metinleri yüklenemedi."));
      });
    return () => controller.abort();
  }, []);
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!doc) return <div className="h-48 rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />;
  return <TranslationsTab doc={doc} />;
}

/**
 * "Çeviriler": the homepage's English and Arabic texts and the drafts Claude
 * wrote waiting for approval, as two tabs under one heading (the sidebar's
 * one entry for both). The tab is in the address — `?sekme=ceviriler` or
 * `?sekme=onaylar` — so a refresh or a link opens it again; the bare address,
 * the old "Çeviri Onayları" page's, opens the approvals. Each tab, once
 * opened, stays mounted behind the other, so a half-typed translation
 * survives a look at the approvals. The approvals tab counts what waits.
 */
export function AdminTranslationsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get(TAB_PARAM);
  const [tab, setTab] = useState<Tab>(requested === PARAM_OF.texts ? "texts" : "approvals");
  const [mounted, setMounted] = useState<Record<Tab, boolean>>({ texts: tab === "texts", approvals: tab === "approvals" });
  const [pending, setPending] = useState<number | null>(null);

  // The bare address (an old bookmark of "Çeviri Onayları") says so in the address.
  useEffect(() => {
    if (!requested) router.replace(`${PATH}?${TAB_PARAM}=${PARAM_OF.approvals}`, { scroll: false });
  }, [requested, router]);

  // How many wait, for the tab's badge.
  useEffect(() => {
    const controller = new AbortController();
    adminTranslationDrafts(controller.signal)
      .then((rows) => setPending(rows.length))
      .catch(() => {
        // No badge: the tab still lists them.
      });
    return () => controller.abort();
  }, []);

  function show(next: Tab) {
    setTab(next);
    setMounted((m) => ({ ...m, [next]: true }));
    router.replace(`${PATH}?${TAB_PARAM}=${PARAM_OF[next]}`, { scroll: false });
  }

  const active = TABS.find((t) => t.value === tab) ?? TABS[0];
  return (
    <>
      <AdminPageHeader title="Çeviriler" description={active.description} />

      <div role="tablist" aria-label="Çeviriler" className="mb-6 flex gap-1 border-b border-slate-200 dark:border-white/10">
        {TABS.map(({ value, label, Icon }) => {
          const selected = value === tab;
          const count = value === "approvals" ? pending : null;
          return (
            <button
              key={value}
              id={`translations-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`translations-panel-${value}`}
              onClick={() => show(value)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-500 ${
                selected
                  ? "border-red-600 text-red-700 dark:border-red-500 dark:text-red-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              {!!count && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  {count}
                  <span className="sr-only"> onay bekliyor</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mounted.texts && (
        <div id="translations-panel-texts" role="tabpanel" aria-labelledby="translations-tab-texts" hidden={tab !== "texts"}>
          <HomepageTexts />
        </div>
      )}
      {mounted.approvals && (
        <div id="translations-panel-approvals" role="tabpanel" aria-labelledby="translations-tab-approvals" hidden={tab !== "approvals"}>
          <AdminTranslationDraftsView embedded onCount={setPending} />
        </div>
      )}
    </>
  );
}
