"use client";

import { useEffect, useRef, useState, type ReactNode, type SubmitEvent } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2, X } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { ImageDropZone } from "@/components/admin/ImageDropZone";
import { SortableList } from "@/components/admin/SortableList";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { getApiErrorMessage } from "@/lib/errors";
import { refreshStorefront } from "@/lib/revalidate";

const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100";

export const adminSelectClass =
  "block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100";

interface BaseRow {
  id: number;
  is_active: boolean;
  sort_order: number;
  image?: string | null;
  has_upload?: boolean;
}

interface BaseWrite {
  is_active: boolean;
  sort_order: number;
}

export interface ContentApi<Row, Write> {
  list: (signal?: AbortSignal) => Promise<Row[]>;
  create: (body: Write) => Promise<Row>;
  update: (id: number, body: Write) => Promise<Row>;
  remove: (id: number) => Promise<void>;
  uploadImage?: (id: number, file: File) => Promise<Row>;
  removeImage?: (id: number) => Promise<Row>;
  /**
   * Every row's id, first to last. Given, the list is put in order by dragging
   * (saved on the drop) and the form has no "Sıra" box: a row keeps the place
   * it was dragged to, and a new one goes to the end.
   */
  reorder?: (ids: number[]) => Promise<Row[]>;
}

interface ContentEditorProps<Row extends BaseRow, Write extends BaseWrite> {
  title: string;
  description: string;
  noun: string; // e.g. "slayt"
  api: ContentApi<Row, Write>;
  blank: () => Write;
  toWrite: (row: Row) => Write;
  /** Row summary in the list. */
  summary: (row: Row) => { primary: string; secondary?: string };
  /** The type-specific form fields; `current` is the row being edited, if any. */
  fields: (value: Write, set: (patch: Partial<Write>) => void, current: Row | null) => ReactNode;
  /** Client-side check; null = OK. The server validates again. */
  validate: (value: Write) => string | null;
  /** Extra note under the list (e.g. how rows are grouped). */
  listNote?: ReactNode;
  /** The form under the list at full width, instead of beside it (for a wide editor). */
  stacked?: boolean;
}

/**
 * Generic admin editor for homepage CMS rows: list (ordered by sort_order) with
 * on/off switches, a create/edit form, delete, and optional image upload.
 * Every save refreshes the storefront cache.
 */
export function ContentEditor<Row extends BaseRow, Write extends BaseWrite>({
  title,
  description,
  noun,
  api,
  blank,
  toWrite,
  summary,
  fields,
  validate,
  listNote,
  stacked = false,
}: ContentEditorProps<Row, Write>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<Write>(blank);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .list(controller.signal)
      .then(setRows)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "İçerik yüklenemedi."));
      });
    return () => controller.abort();
  }, [api]);

  const upsert = (row: Row) => {
    setRows((list) => [...(list ?? []).filter((r) => r.id !== row.id), row].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
    if (editing?.id === row.id) setEditing(row);
  };

  const set = (patch: Partial<Write>) => {
    setForm((f) => ({ ...f, ...patch }));
    setResult(null);
  };

  const startNew = () => {
    setEditing(null);
    setForm(blank());
    setResult(null);
  };

  const problem = validate(form);
  const draggable = !!api.reorder;

  /**
   * What is saved. Where the list is dragged, the place is the list's, not the
   * form's: the row's place as it stands now (it may have been dragged since
   * the form opened), or the end for a new one.
   */
  const body = (): Write => {
    if (!draggable) return form;
    const current = editing ? rows?.find((r) => r.id === editing.id) : undefined;
    const end = Math.max(0, ...(rows ?? []).map((r) => r.sort_order)) + 10;
    return { ...form, sort_order: current?.sort_order ?? end };
  };

  /** A drop: shown at once, saved, and put back as it was if the save fails. */
  async function reorder(next: Row[]) {
    if (!api.reorder) return;
    const before = rows;
    setRows(next);
    setResult(null);
    try {
      const saved = await api.reorder(next.map((r) => r.id));
      setRows(saved);
      if (editing) {
        const moved = saved.find((r) => r.id === editing.id);
        if (moved) setEditing(moved);
      }
      void refreshStorefront();
    } catch (err) {
      setRows(before);
      setResult({ kind: "error", text: getApiErrorMessage(err, "Sıra kaydedilemedi. Sayfayı yenileyip tekrar deneyin.") });
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || problem) return;
    setSaving(true);
    try {
      const data = body();
      const saved = editing ? await api.update(editing.id, data) : await api.create(data);
      upsert(saved);
      void refreshStorefront();
      setEditing(saved);
      setForm(toWrite(saved));
      setResult({ kind: "success", text: "Kaydedildi. Ana sayfa güncellendi." });
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, "Kaydedilemedi.") });
    } finally {
      setSaving(false);
    }
  }

  async function run(row: Row, action: () => Promise<Row | void>, fallback: string) {
    setBusyId(row.id);
    setResult(null);
    try {
      const updated = await action();
      if (updated) upsert(updated);
      void refreshStorefront();
    } catch (err) {
      setResult({ kind: "error", text: getApiErrorMessage(err, fallback) });
    } finally {
      setBusyId(null);
    }
  }

  const toggle = (row: Row, active: boolean) =>
    run(row, () => api.update(row.id, { ...toWrite(row), is_active: active }), "Durum değiştirilemedi.");

  const remove = (row: Row) => {
    if (!window.confirm(`Bu ${noun} silinsin mi?`)) return;
    void run(
      row,
      async () => {
        await api.remove(row.id);
        setRows((list) => (list ?? []).filter((r) => r.id !== row.id));
        if (editing?.id === row.id) startNew();
      },
      "Silinemedi.",
    );
  };

  function upload(file: File) {
    if (!editing || !api.uploadImage) return;
    const target = editing;
    void run(target, () => api.uploadImage!(target.id, file), "Görsel yüklenemedi (PNG, JPEG veya WebP).");
  }

  /** A row's photo, summary, switch and buttons — the same dragged or not. */
  const renderRow = (row: Row) => {
    const { primary, secondary } = summary(row);
    return (
      <>
        {"image" in row && (
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
            {row.image && <Image src={row.image} alt="" fill sizes="64px" unoptimized className="object-cover" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${row.is_active ? "" : "text-slate-400 line-through dark:text-zinc-500"}`}>{primary}</p>
          {secondary && <p className="truncate text-xs text-slate-500 dark:text-zinc-400">{secondary}</p>}
        </div>
        {!draggable && (
          <span className="font-mono text-xs text-slate-400" title="Sıra">
            #{row.sort_order}
          </span>
        )}
        <span id={`row-${row.id}-active`} className="sr-only">
          {primary} yayında
        </span>
        <Switch
          checked={row.is_active}
          disabled={busyId === row.id}
          onChange={(v) => void toggle(row, v)}
          labelledBy={`row-${row.id}-active`}
        />
        <button
          type="button"
          onClick={() => {
            setEditing(row);
            setForm(toWrite(row));
            setResult(null);
            // Stacked, the form is below the list: bring it into view.
            if (stacked) requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
          aria-label={`Düzenle: ${primary}`}
          className={iconBtn}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => remove(row)} disabled={busyId === row.id} aria-label={`Sil: ${primary}`} className={iconBtn}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </>
    );
  };

  return (
    <>
      <AdminPageHeader title={title} description={description} />

      <div className={stacked ? "grid gap-6" : "grid gap-6 xl:grid-cols-[1fr_28rem]"}>
        <section aria-labelledby="content-list" className={`${panelClass} h-fit overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-white/10">
            <h2 id="content-list" className="text-sm font-semibold">
              Kayıtlar
            </h2>
            <button type="button" onClick={startNew} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400">
              <Plus className="h-4 w-4" aria-hidden /> Yeni {noun}
            </button>
          </div>
          {loadError ? (
            <div className="p-5">
              <Alert variant="error">{loadError}</Alert>
            </div>
          ) : rows === null ? (
            <div className="h-48 motion-safe:animate-pulse" aria-busy />
          ) : rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">Henüz kayıt yok.</p>
          ) : draggable ? (
              <SortableList
                items={rows}
                getId={(row) => String(row.id)}
                getLabel={(row) => summary(row).primary}
                onReorder={(next) => void reorder(next)}
                disabled={saving || busyId !== null}
                className="divide-y divide-slate-200 dark:divide-white/10"
                renderItem={(row, handle, index) => (
                  <div
                    aria-busy={busyId === row.id || undefined}
                    className={`flex items-center gap-4 py-3.5 pe-5 ps-2 ${editing?.id === row.id ? "bg-red-50/60 dark:bg-red-500/5" : ""}`}
                  >
                    {handle}
                    <span className="-ms-2 w-5 shrink-0 text-right font-mono text-xs text-slate-400 tabular-nums" title="Sıra">
                      {index + 1}
                    </span>
                    {renderRow(row)}
                  </div>
                )}
              />
            ) : (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {rows.map((row) => (
                <li
                  key={row.id}
                  aria-busy={busyId === row.id || undefined}
                  className={`flex items-center gap-4 px-5 py-3.5 ${editing?.id === row.id ? "bg-red-50/60 dark:bg-red-500/5" : ""}`}
                >
                  {renderRow(row)}
                </li>
              ))}
            </ul>
          )}
          {listNote && <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-zinc-400">{listNote}</div>}
        </section>

        <form ref={formRef} onSubmit={handleSubmit} className={`${panelClass} h-fit scroll-mt-[calc(var(--header-height)+1rem)] space-y-4 p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editing ? "Düzenle" : `Yeni ${noun}`}</h2>
            {editing && (
              <button type="button" onClick={startNew} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400">
                <X className="h-3.5 w-3.5" aria-hidden /> Vazgeç
              </button>
            )}
          </div>

          {fields(form, set, editing)}

          {api.uploadImage && (
            <div className="space-y-2">
              {editing ? (
                <>
                  <ImageDropZone
                    label="Görsel yükle"
                    preview={editing.image}
                    busy={busyId === editing.id}
                    onFile={upload}
                    onReject={(text) => setResult({ kind: "error", text })}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Yüklenen görsel, URL alanından önceliklidir.</p>
                    {editing.has_upload && api.removeImage && (
                      <button
                        type="button"
                        onClick={() => void run(editing, () => api.removeImage!(editing.id), "Görsel kaldırılamadı.")}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-300"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden /> Yükleneni kaldır
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-white/15 dark:text-zinc-400">
                  Görsel yüklemek için önce kaydedin (veya yukarıya bir https URL girin).
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {draggable ? (
              <p className="self-end pb-1 text-xs text-slate-500 dark:text-zinc-400">
                Sırayı listede tutamaçtan sürükleyerek değiştirin; yeni kayıt sona eklenir.
              </p>
            ) : (
            <Input
              label="Sıra"
              type="number"
              min={0}
              value={String(form.sort_order)}
              onChange={(e) => set({ sort_order: Math.max(0, Number.parseInt(e.target.value, 10) || 0) } as Partial<Write>)}
              hint="Küçük sayı önce."
            />
            )}
            <div className="flex items-end justify-between gap-3 pb-1">
              <span id="form-active" className="text-sm font-medium">
                Yayında
              </span>
              <Switch checked={form.is_active} onChange={(v) => set({ is_active: v } as Partial<Write>)} labelledBy="form-active" />
            </div>
          </div>

          {result && <Alert variant={result.kind}>{result.text}</Alert>}
          {problem && <p className="text-xs text-slate-500 dark:text-zinc-400">{problem}</p>}
          <Button type="submit" loading={saving} disabled={!!problem}>
            {editing ? "Güncelle" : "Ekle"}
          </Button>
        </form>
      </div>
    </>
  );
}

/** Shared validation helpers for the CMS forms (mirror the backend rules). */
export const isSiteOrHttpsLink = (href: string) => /^(?:\/(?!\/)\S*|https:\/\/\S+)$/.test(href.trim());
export const isImageUrl = (url: string) => /^https?:\/\/[^\s"'()<>\\]+$/.test(url.trim());
