"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, Save } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { LegalText } from "@/components/legal/LegalText";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { adminGetLegalDocuments, adminUpdateLegalDocument } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { LegalDocument, LegalKey } from "@/types";

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";

/** What each text is for, so it is clear which one the customer sees where. */
const PURPOSE: Record<LegalKey, string> = {
  PRIVACY_NOTICE: "Sepette, ödeme adımının yanındaki çerçeveli bilgilendirme kutusu.",
  PRIVACY: "Gizlilik kuralları: müşterinin verilerine ne olduğunu anlatan tam metin.",
  DISTANCE_SALES: "Sepette onay kutusundan açılan sözleşme. Onaylanmadan sipariş verilemez.",
  TERMS: "Sepette onay kutusundan açılan şartlar metni. Onaylanmadan sipariş verilemez.",
};

interface Draft {
  title: string;
  body: string;
  updated_at: string | null;
  /** False while this is still the text the shop was set up with. */
  edited: boolean;
  saving: boolean;
  result: { kind: "success" | "error"; text: string } | null;
}

const toDraft = (doc: LegalDocument): Draft => ({
  title: doc.title,
  body: doc.body,
  updated_at: doc.updated_at,
  edited: doc.edited,
  saving: false,
  result: null,
});

/**
 * Sözleşmeler ve metinler: the texts the storefront reads live.
 *
 * Each one saves on its own, because they are four separate documents and a
 * half-finished edit to one should not hold up another. What is saved here is
 * what the next buyer is shown and accepts, so the preview renders it exactly
 * as the cart modal will.
 */
export function AdminLegalView() {
  const [drafts, setDrafts] = useState<Partial<Record<LegalKey, Draft>> | null>(null);
  const [order, setOrder] = useState<LegalKey[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LegalKey | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminGetLegalDocuments(controller.signal)
      .then((docs) => {
        setOrder(docs.map((doc) => doc.key));
        setDrafts(Object.fromEntries(docs.map((doc) => [doc.key, toDraft(doc)])));
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setLoadError(getApiErrorMessage(err, "Metinler yüklenemedi."));
        }
      });
    return () => controller.abort();
  }, []);

  function patch(key: LegalKey, change: Partial<Draft>) {
    setDrafts((current) => {
      const draft = current?.[key];
      if (!draft) return current;
      return { ...current, [key]: { ...draft, ...change } };
    });
  }

  async function save(key: LegalKey) {
    const draft = drafts?.[key];
    if (!draft || draft.saving) return;
    patch(key, { saving: true, result: null });
    try {
      const saved = await adminUpdateLegalDocument(key, { title: draft.title, body: draft.body });
      patch(key, {
        title: saved.title,
        body: saved.body,
        updated_at: saved.updated_at,
        edited: saved.edited,
        saving: false,
        result: { kind: "success", text: "Kaydedildi. Sepette artık bu metin görünüyor." },
      });
    } catch (err) {
      patch(key, {
        saving: false,
        result: { kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") },
      });
    }
  }

  const shown = preview ? drafts?.[preview] : undefined;

  return (
    <>
      <AdminPageHeader
        title="Sözleşmeler ve Metinler"
        description="Sepetteki gizlilik bilgilendirmesi ve onay kutularından açılan sözleşmeler. Kaydettiğiniz metin, bir sonraki müşterinin okuyup onayladığı metindir."
      />

      {loadError && <Alert variant="error">{loadError}</Alert>}

      <div className="space-y-6">
        {(drafts === null ? [0, 1, 2, 3] : order).map((keyOrIndex, index) => {
          if (drafts === null) {
            // Reserve each panel's room, so the page does not jump when the
            // texts arrive.
            return (
              <div
                key={index}
                className={`${panelClass} h-80 motion-safe:animate-pulse`}
                aria-busy
              />
            );
          }
          const key = keyOrIndex as LegalKey;
          const draft = drafts[key];
          if (!draft) return null;
          return (
            <section key={key} className={`${panelClass} p-5 sm:p-6`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                    <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden />
                    {draft.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{PURPOSE[key]}</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                    {draft.edited && draft.updated_at
                      ? `Son güncelleme: ${formatDate(draft.updated_at)}`
                      : "Kurulumla gelen metin — henüz değiştirilmedi."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(key)}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden /> Müşterinin gördüğü hâli
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor={`legal-title-${key}`}
                    className="block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Başlık
                  </label>
                  <input
                    id={`legal-title-${key}`}
                    maxLength={150}
                    value={draft.title}
                    onChange={(e) => patch(key, { title: e.target.value, result: null })}
                    className={`${fieldClass} h-11 py-0`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor={`legal-body-${key}`}
                    className="block text-sm font-medium text-slate-700 dark:text-zinc-300"
                  >
                    Metin
                  </label>
                  <textarea
                    id={`legal-body-${key}`}
                    rows={key === "PRIVACY_NOTICE" ? 5 : 16}
                    value={draft.body}
                    onChange={(e) => patch(key, { body: e.target.value, result: null })}
                    className={`${fieldClass} resize-y font-mono leading-6`}
                  />
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Boş satır yeni paragraf açar. Bir satıra <code>## Başlık</code> yazarsanız ara başlık
                    olur.
                  </p>
                </div>
                {draft.result && (
                  <Alert variant={draft.result.kind === "success" ? "success" : "error"}>
                    {draft.result.text}
                  </Alert>
                )}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => save(key)}
                    loading={draft.saving}
                    disabled={!draft.title.trim() || !draft.body.trim()}
                    className="sm:w-auto"
                  >
                    <Save className="h-4 w-4" aria-hidden /> Kaydet
                  </Button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={preview !== null} onClose={() => setPreview(null)} title={shown?.title ?? "Önizleme"}>
        {shown && <LegalText body={shown.body} headingLevel={3} />}
      </Dialog>
    </>
  );
}
