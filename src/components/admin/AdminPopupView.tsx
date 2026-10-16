"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { Eye, Save } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { DateTimeField as DateField } from "@/components/admin/DateTimeField";
import { PopupCard } from "@/components/banner/PopupCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useNow } from "@/hooks/useNow";
import { adminGetPopup, adminUpdatePopup } from "@/lib/adminApi";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/banner";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { PopupAnnouncement } from "@/types";

// Mirrors the server's bounds (`app/models/site.py`).
const TITLE_MAX = 80;
const MESSAGE_MAX = 1000;

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:[color-scheme:dark]";
const hintClass = "mt-2 text-xs text-slate-500 dark:text-zinc-400";

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span
      className={`text-xs tabular-nums ${value.length > max * 0.9 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-zinc-500"}`}
    >
      {value.length}/{max}
    </span>
  );
}

/**
 * "Açılış Duyurusu": the card visitors see once when they land on the shop
 * (`AnnouncementPopup`), with its time range and on/off switch.
 */
export function AdminPopupView() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const now = useNow();

  function applySaved(p: PopupAnnouncement) {
    setTitle(p.title);
    setMessage(p.message);
    setActive(p.is_active);
    setStartsLocal(toLocalInputValue(p.starts_at));
    setEndsLocal(toLocalInputValue(p.ends_at));
    setUpdatedAt(p.updated_at);
  }

  useEffect(() => {
    const controller = new AbortController();
    adminGetPopup(controller.signal)
      .then((p) => {
        applySaved(p);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(getApiErrorMessage(err, "Açılış duyurusu yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  /** A setter that also clears the last save's message. */
  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setResult(null);
    };
  }

  const trimmed = message.trim();
  const startsAt = fromLocalInputValue(startsLocal);
  const endsAt = fromLocalInputValue(endsLocal);
  const problem =
    active && !trimmed
      ? "Yayındaki bir açılış duyurusunun metni olmalı."
      : startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)
        ? "Bitiş zamanı başlangıçtan sonra olmalı."
        : null;

  const notStarted = now !== null && startsAt !== null && Date.parse(startsAt) > now;
  const over = now !== null && endsAt !== null && Date.parse(endsAt) <= now;
  const status = !active
    ? { text: "Kapalı", className: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10" }
    : over
      ? { text: "Süresi doldu", className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30" }
      : notStarted
        ? { text: "Zamanı gelince yayında", className: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30" }
        : { text: "Yayında olacak", className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" };

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || problem) return;
    setSaving(true);
    setResult(null);
    try {
      const saved = await adminUpdatePopup({
        title: title.trim(),
        message: trimmed,
        is_active: active,
        starts_at: startsAt,
        ends_at: endsAt,
      });
      applySaved(saved);
      setResult({
        kind: "success",
        text: saved.is_active
          ? "Kaydedildi. Ziyaretçiler siteye girdiğinde duyuruyu görecek; daha önce kapatanlar da bu değişiklikten sonra bir kez daha görür."
          : "Kaydedildi. Duyuru kapalı; sitede görünmez.",
      });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Açılış duyurusu kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <section aria-labelledby="popup-heading" className="space-y-4">
      <div>
        <h2 id="popup-heading" className="text-lg font-semibold tracking-tight">
          Açılış Duyurusu (Popup)
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-zinc-400">
          Ziyaretçiler siteye girdiğinde ortada açılan duyuru kartı. Ziyaretçi kartı kapattığında, siz duyuruyu
          değiştirene kadar ona tekrar gösterilmez.
        </p>
      </div>

      {loadError ? (
        <Alert variant="error">{loadError}</Alert>
      ) : !loaded ? (
        <div className={`${panelClass} h-80 motion-safe:animate-pulse`} aria-busy />
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className={`${panelClass} @container space-y-5 p-5 sm:p-6`}>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="popup-title" className="text-sm font-medium">
                  Başlık
                </label>
                <Counter value={title} max={TITLE_MAX} />
              </div>
              <input
                id="popup-title"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => edit(setTitle)(e.target.value)}
                placeholder="Örn. Bayram Tatili Duyurusu"
                className={`${fieldClass} mt-2 h-11`}
              />
              <p className={hintClass}>Boş bırakılırsa “Duyuru” yazar.</p>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="popup-message" className="text-sm font-medium">
                  Duyuru metni
                </label>
                <Counter value={message} max={MESSAGE_MAX} />
              </div>
              <textarea
                id="popup-message"
                value={message}
                maxLength={MESSAGE_MAX}
                rows={5}
                onChange={(e) => edit(setMessage)(e.target.value)}
                placeholder="Örn. Bayram süresince verilen siparişler 17 Haziran'da kargoya teslim edilecektir."
                className={`${fieldClass} mt-2 resize-y py-3`}
              />
              <p className={hintClass}>Satır başları korunur. Metinde yazan bir indirim sepete otomatik uygulanmaz.</p>
            </div>

            {/* Side by side only when the form itself is wide enough for two date
                boxes; beside the preview it is too narrow on most screens. */}
            <div className="grid gap-4 border-t border-slate-200 pt-5 @xl:grid-cols-2 dark:border-white/10">
              <DateField
                id="popup-starts"
                label="Başlangıç"
                value={startsLocal}
                onChange={edit(setStartsLocal)}
                hint={`Boş bırakılırsa hemen başlar. Saat dilimi: ${zone}.`}
              />
              <DateField
                id="popup-ends"
                label="Bitiş"
                value={endsLocal}
                onChange={edit(setEndsLocal)}
                hint={over ? "Bu zaman geçmişte: kaydederseniz duyuru görünmez." : "Bu zamanda kendiliğinden kalkar. Boşsa süresiz."}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <div>
                <p id="popup-active-label" className="text-sm font-medium">
                  Açılış duyurusunu yayınla
                </p>
                <p id="popup-active-hint" className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                  Kapalıyken metin taslak olarak saklanır, sitede görünmez.
                </p>
              </div>
              <Switch
                checked={active}
                onChange={edit(setActive)}
                labelledBy="popup-active-label"
                describedBy="popup-active-hint"
              />
            </div>

            {problem && <Alert variant="error">{problem}</Alert>}
            {result && <Alert variant={result.kind}>{result.text}</Alert>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-zinc-500">
                {updatedAt ? `Son güncelleme: ${formatDate(updatedAt)}` : "Henüz kaydedilmedi."}
              </p>
              <Button type="submit" loading={saving} disabled={!!problem} className="sm:w-auto!">
                <Save className="h-4 w-4" aria-hidden /> Kaydet
              </Button>
            </div>
          </div>

          <div className={`${panelClass} self-start overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-white/10">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden /> Önizleme
              </h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>
                {status.text}
              </span>
            </div>
            <div className="flex justify-center bg-slate-100/70 p-5 dark:bg-white/[0.03]">
              {trimmed ? (
                <div className={`flex w-full justify-center transition-[filter,opacity] duration-300 ${active && !over ? "" : "opacity-50 grayscale"}`}>
                  <PopupCard title={title.trim()} message={trimmed} heading="h4" />
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-slate-500 dark:text-zinc-400">
                  Önizleme için bir duyuru metni yazın.
                </p>
              )}
            </div>
          </div>
        </form>
      )}
    </section>
  );
}
