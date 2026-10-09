"use client";

import { useEffect, useState } from "react";
import { Save, Truck } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminGetShippingSettings, adminUpdateShippingSettings } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatMoney, parseDecimalInput } from "@/lib/format";
import { ISTANBUL_FREE_MIN_DEFAULT } from "@/lib/settingsApi";

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";

/**
 * Teslimat ayarları: the limits the checkout engine applies.
 *
 * One number so far — what an İstanbul firm has to spend before the shop's own
 * van carries the order for nothing. It is read live by both ends: the cart
 * names the figure beside the option, and the engine refuses the option below
 * it, so saving here is the whole change.
 */
export function AdminShippingSettingsView() {
  // Null while it loads: the panel never shows a limit that is not the live one.
  const [typed, setTyped] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminGetShippingSettings(controller.signal)
      .then(({ istanbul_free_min_subtotal }) => {
        setSaved(istanbul_free_min_subtotal);
        setTyped(istanbul_free_min_subtotal);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setLoadError(getApiErrorMessage(err, "Ayarlar yüklenemedi."));
        }
      });
    return () => controller.abort();
  }, []);

  // Accepts "20.000", "20000,50" and "20000.50" alike; null means unusable.
  const parsed = typed === null ? null : parseDecimalInput(typed);
  const unchanged = parsed !== null && saved !== null && Number(parsed) === Number(saved);

  async function save() {
    if (parsed === null || saving) return;
    setSaving(true);
    setResult(null);
    try {
      const next = await adminUpdateShippingSettings({ istanbul_free_min_subtotal: parsed });
      setSaved(next.istanbul_free_min_subtotal);
      setTyped(next.istanbul_free_min_subtotal);
      setResult({
        kind: "success",
        text: `Kaydedildi. İstanbul içi teslimat artık ${formatMoney(next.istanbul_free_min_subtotal)} ve üzeri siparişlerde ücretsiz.`,
      });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Teslimat Ayarları"
        description="Kurumsal siparişlerde İstanbul içi ücretsiz teslimatın alt limiti. Kaydettiğiniz tutar, sepette görünen ve siparişte uygulanan tutardır."
      />

      {loadError && <Alert variant="error">{loadError}</Alert>}

      <section className={`${panelClass} p-5 sm:p-6`}>
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Truck className="h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden />
          İstanbul İçi B2B Ücretsiz Teslimat Alt Limiti (TL)
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Kafe, toptan ve diğer kurumsal hesaplar için geçerlidir: kayıtlı fatura adresi İstanbul’da
          olan bir firmanın sepeti bu tutara ulaştığında teslimat kendi aracımızla ve ücretsiz
          yapılır. Altında kaldığında seçenek sepette kapalı görünür ve ne kadar eksik olduğu yazar.
        </p>

        <div className="mt-5 max-w-sm space-y-1.5">
          <label htmlFor="istanbul-free-min" className="block text-sm font-medium text-slate-700 dark:text-zinc-300">
            Alt limit
          </label>
          {typed === null ? (
            // Hold the field's exact height, so the panel does not jump.
            <div className="h-11 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
          ) : (
            <input
              id="istanbul-free-min"
              inputMode="decimal"
              maxLength={12}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setResult(null);
              }}
              aria-describedby="istanbul-free-min-note"
              className={`${fieldClass} h-11 py-0`}
            />
          )}
          <p id="istanbul-free-min-note" className="text-xs text-slate-500 dark:text-zinc-400">
            {parsed === null
              ? `Tutarı sayı olarak girin (örn. ${ISTANBUL_FREE_MIN_DEFAULT}).`
              : `Sepette “${formatMoney(parsed)} ve üzeri alışverişlerde ücretsiz teslimat” olarak görünür.`}
          </p>
        </div>

        {result && (
          <div className="mt-4">
            <Alert variant={result.kind === "success" ? "success" : "error"}>{result.text}</Alert>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={save}
            loading={saving}
            disabled={parsed === null || unchanged}
            className="sm:w-auto"
          >
            <Save className="h-4 w-4" aria-hidden /> Kaydet
          </Button>
        </div>
      </section>
    </>
  );
}
