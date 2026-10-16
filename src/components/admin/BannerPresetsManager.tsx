"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus, Trash2, Wand2 } from "lucide-react";

import { panelClass } from "@/components/admin/AdminShell";
import { DateTimeField } from "@/components/admin/DateTimeField";
import { BannerMoodIcon } from "@/components/banner/BannerMoodIcon";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useNow } from "@/hooks/useNow";
import {
  adminCreateBannerPreset,
  adminDeleteBannerPreset,
  adminListBannerPresets,
  adminUpdateBannerPreset,
} from "@/lib/adminApi";
import {
  BANNER_ICONS,
  DEFAULT_BANNER_ICON,
  fromLocalInputValue,
  resolveBannerIcon,
  toLocalInputValue,
} from "@/lib/banner";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { BannerIcon, BannerPreset } from "@/types";

const MAX = 200;
const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";
const ghostClass =
  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5";

type Phase = "off" | "planned" | "live" | "over";

/** Where a preset stands now; the server decides the same way (`BannerPreset.is_live`). */
export function presetPhase(p: BannerPreset, now: number | null): Phase {
  if (!p.is_scheduled || !p.starts_at || !p.ends_at) return "off";
  if (now === null) return "planned";
  if (Date.parse(p.ends_at) <= now) return "over";
  return Date.parse(p.starts_at) <= now ? "live" : "planned";
}

/** The scheduled preset the banner shows right now: the latest to start, as on the server. */
export function livePreset(presets: BannerPreset[], now: number | null): BannerPreset | null {
  return (
    presets
      .filter((p) => presetPhase(p, now) === "live")
      .sort((a, b) => Date.parse(b.starts_at!) - Date.parse(a.starts_at!) || b.id - a.id)[0] ?? null
  );
}

const PHASE: Record<Phase, { text: string; className: string }> = {
  off: {
    text: "Otomatik yayın kapalı",
    className: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10",
  },
  planned: {
    text: "Planlandı",
    className: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  },
  live: {
    text: "Şu an yayında",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  },
  over: {
    text: "Süresi doldu",
    className:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  },
};

interface Draft {
  id: number | null;
  message: string;
  icon: BannerIcon;
  starts: string;
  ends: string;
  scheduled: boolean;
}

const blank: Draft = {
  id: null,
  message: "",
  icon: DEFAULT_BANNER_ICON,
  starts: "",
  ends: "",
  scheduled: false,
};

function draftOf(p: BannerPreset): Draft {
  return {
    id: p.id,
    message: p.message,
    icon: resolveBannerIcon(p.icon_type),
    starts: toLocalInputValue(p.starts_at),
    ends: toLocalInputValue(p.ends_at),
    scheduled: p.is_scheduled,
  };
}

function rangeText(p: BannerPreset): string {
  if (!p.starts_at && !p.ends_at) return "Tarih yok";
  return `${p.starts_at ? formatDate(p.starts_at) : "…"} – ${p.ends_at ? formatDate(p.ends_at) : "…"}`;
}

/** The editor for one preset: a new one or the one being edited. */
function PresetEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const key = draft.id ?? "new";
  const startsAt = fromLocalInputValue(draft.starts);
  const endsAt = fromLocalInputValue(draft.ends);
  const hasRange = !!startsAt && !!endsAt;
  const problem = !draft.message.trim()
    ? "Bir metin yazın."
    : startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)
      ? "Bitiş zamanı başlangıçtan sonra olmalı."
      : draft.scheduled && !hasRange
        ? "Otomatik yayın için başlangıç ve bitiş seçin."
        : null;

  return (
    <div className="@container space-y-4 rounded-xl border border-red-200 bg-red-50/40 p-4 dark:border-red-500/30 dark:bg-red-500/5">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={`preset-${key}-message`} className="text-sm font-medium">
            Metin
          </label>
          <span className="text-xs tabular-nums text-slate-500 dark:text-zinc-500">
            {draft.message.length}/{MAX}
          </span>
        </div>
        <textarea
          id={`preset-${key}-message`}
          value={draft.message}
          maxLength={MAX}
          rows={2}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Örn. 29 Ekim Cumhuriyet Bayramımız Kutlu Olsun!"
          className={`${fieldClass} mt-2 resize-y py-2.5`}
        />
      </div>

      <div>
        <p id={`preset-${key}-icon`} className="text-sm font-medium">
          Simge
        </p>
        <div role="radiogroup" aria-labelledby={`preset-${key}-icon`} className="mt-2 flex flex-wrap gap-2">
          {BANNER_ICONS.map((i) => (
            <button
              key={i.id}
              type="button"
              role="radio"
              aria-checked={draft.icon === i.id}
              onClick={() => onChange({ icon: i.id })}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                draft.icon === i.id
                  ? "border-red-500 bg-white text-red-700 ring-4 ring-red-500/15 dark:bg-zinc-950 dark:text-red-300"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
              }`}
            >
              {i.id !== "none" && <BannerMoodIcon icon={i.id} small className="h-4 w-4" />}
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 @xl:grid-cols-2">
        <DateTimeField
          id={`preset-${key}-starts`}
          label="Başlangıç"
          value={draft.starts}
          onChange={(starts) => onChange({ starts })}
          hint="Bu zamanda band bu metni kendiliğinden yayınlar."
        />
        <DateTimeField
          id={`preset-${key}-ends`}
          label="Bitiş"
          value={draft.ends}
          onChange={(ends) => onChange({ ends, ...(ends ? {} : { scheduled: false }) })}
          hint={`Bu zamanda kalkar. Saat dilimi: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
        <div>
          <p id={`preset-${key}-auto-label`} className="text-sm font-medium">
            Otomatik yayınla
          </p>
          <p id={`preset-${key}-auto-hint`} className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            {hasRange
              ? "Açıkken band bu tarihlerde, yukarıdaki duyurunun yerine bu metni gösterir."
              : "Önce başlangıç ve bitiş seçin."}
          </p>
        </div>
        <Switch
          checked={draft.scheduled && hasRange}
          disabled={!hasRange}
          onChange={(scheduled) => onChange({ scheduled })}
          labelledBy={`preset-${key}-auto-label`}
          describedBy={`preset-${key}-auto-hint`}
        />
      </div>

      {(problem || error) && <Alert variant="error">{error ?? problem}</Alert>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={ghostClass}>
          Vazgeç
        </button>
        <Button type="button" onClick={onSave} loading={saving} disabled={!!problem} className="h-9! w-auto! text-xs!">
          Kaydet
        </Button>
      </div>
    </div>
  );
}

/**
 * "Hazır metinler": the special-day banner's ready-made texts, each with its
 * own date range. "Varsayılana uygula" copies one into the default banner above; with
 * "Otomatik yayınla" on, the banner shows it by itself within its range.
 */
export function BannerPresetsManager({
  onApply,
  onPresetsChange,
}: {
  onApply: (message: string, icon: BannerIcon) => void;
  /** The current list, so the banner editor can tell which preset is live. */
  onPresetsChange?: (presets: BannerPreset[]) => void;
}) {
  const [presets, setPresets] = useState<BannerPreset[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const now = useNow();

  useEffect(() => {
    const controller = new AbortController();
    adminListBannerPresets(controller.signal)
      .then(setPresets)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Hazır metinler yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (presets) onPresetsChange?.(presets);
  }, [presets, onPresetsChange]);

  function startEdit(next: Draft) {
    setDraft(next);
    setError(null);
    setConfirmDelete(null);
  }

  async function save() {
    if (!draft || saving) return;
    setSaving(true);
    setError(null);
    const body = {
      message: draft.message.trim(),
      icon_type: draft.icon,
      starts_at: fromLocalInputValue(draft.starts),
      ends_at: fromLocalInputValue(draft.ends),
      is_scheduled: draft.scheduled && !!draft.starts && !!draft.ends,
      sort_order:
        draft.id === null ? (presets?.length ?? 0) : (presets?.find((p) => p.id === draft.id)?.sort_order ?? 0),
    };
    try {
      const saved =
        draft.id === null ? await adminCreateBannerPreset(body) : await adminUpdateBannerPreset(draft.id, body);
      setPresets((list) =>
        draft.id === null ? [...(list ?? []), saved] : (list ?? []).map((p) => (p.id === saved.id ? saved : p)),
      );
      setDraft(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Hazır metin kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await adminDeleteBannerPreset(id);
      setPresets((list) => (list ?? []).filter((p) => p.id !== id));
      if (draft?.id === id) setDraft(null);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Hazır metin silinemedi."));
    } finally {
      setConfirmDelete(null);
    }
  }

  const live = presets ? livePreset(presets, now) : null;

  return (
    <section aria-labelledby="presets-heading" className={`${panelClass} space-y-4 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="presets-heading" className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-slate-400 dark:text-zinc-500" aria-hidden /> Planlı Hazır Metinler (Süreli)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-zinc-400">
            Her metnin kendi başlangıç ve bitiş tarihi var. “Otomatik yayınla” açık bir metin, tarihi gelince
            varsayılan bandın yerine kendiliğinden yayınlanır; bitişte kalkar ve band varsayılana döner. “Varsayılana
            uygula” metni yukarıdaki süresiz banda aktarır.
          </p>
        </div>
        {draft?.id !== null && (
          <button type="button" onClick={() => startEdit(blank)} className={ghostClass}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Yeni hazır metin
          </button>
        )}
      </div>

      {loadError && <Alert variant="error">{loadError}</Alert>}
      {draft?.id === null && (
        <PresetEditor
          draft={draft}
          onChange={(patch) => setDraft((d) => d && { ...d, ...patch })}
          onSave={save}
          onCancel={() => setDraft(null)}
          saving={saving}
          error={error}
        />
      )}

      {!presets && !loadError ? (
        <div className="h-40 rounded-xl bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" aria-busy />
      ) : presets && presets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-zinc-400">
          Henüz hazır metin yok.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
          {presets?.map((p) => {
            const phase = presetPhase(p, now);
            const isLive = live?.id === p.id;
            if (draft?.id === p.id) {
              return (
                <li key={p.id} className="p-3">
                  <PresetEditor
                    draft={draft}
                    onChange={(patch) => setDraft((d) => d && { ...d, ...patch })}
                    onSave={save}
                    onCancel={() => setDraft(null)}
                    saving={saving}
                    error={error}
                  />
                </li>
              );
            }
            return (
              <li key={p.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300">
                    {resolveBannerIcon(p.icon_type) !== "none" ? (
                      <BannerMoodIcon icon={resolveBannerIcon(p.icon_type)} small className="h-4 w-4" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{p.message}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="tabular-nums">{rangeText(p)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          phase === "live" && !isLive ? PHASE.planned.className : PHASE[phase].className
                        }`}
                      >
                        {phase === "live" && !isLive ? "Başka bir metnin arkasında" : PHASE[phase].text}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => onApply(p.message, resolveBannerIcon(p.icon_type))}
                    className={ghostClass}
                  >
                    <Wand2 className="h-3.5 w-3.5" aria-hidden /> Varsayılana uygula
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(draftOf(p))}
                    className={ghostClass}
                    aria-label={`Düzenle: ${p.message}`}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Düzenle
                  </button>
                  {confirmDelete === p.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden /> Evet, sil
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className={ghostClass}>
                        Vazgeç
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(p.id)}
                      className={`${ghostClass} text-red-700! dark:text-red-300!`}
                      aria-label={`Sil: ${p.message}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Sil
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
