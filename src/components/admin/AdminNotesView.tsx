"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, NotebookPen, Plus, Save, Search, Trash2 } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminCreateNote, adminDeleteNote, adminListNotes, adminUpdateNote } from "@/lib/adminApi";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { htmlToText } from "@/lib/richText";
import type { AdminNote } from "@/types";
import { foldSearch } from "@/lib/searchFold";

// Mirrors the server's bounds (`app/models/note.py`).
const TITLE_MAX = 120;
// The server's limit on a note's stored HTML (app.models.note.NOTE_BODY_MAX).
const BODY_MAX = 100_000;

const fieldClass =
  "block w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/15 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600";
const ghostClass =
  "inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 dark:text-zinc-200 dark:ring-white/15 dark:hover:bg-white/5";

const fold = foldSearch;

/** "Başlıksız not" for a note with only a body: its opening words instead. */
function noteTitle(n: Pick<AdminNote, "title" | "body">): string {
  return n.title.trim() || htmlToText(n.body).slice(0, 80) || "Başlıksız not";
}

interface Draft {
  /** null: a new note, not saved yet. */
  id: number | null;
  title: string;
  body: string;
}

const UNSAVED = "Kaydedilmemiş değişiklikler var. Bunlardan vazgeçilsin mi?";

/**
 * "Not Defteri": the admin's own notes — a list on the left, the one open on
 * the right (one after the other on a phone). Ctrl/⌘ + S saves.
 */
export function AdminNotesView() {
  const [notes, setNotes] = useState<AdminNote[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    adminListNotes(controller.signal)
      .then(setNotes)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(err, "Notlar yüklenemedi."));
      });
    return () => controller.abort();
  }, []);

  const open = draft?.id != null ? (notes?.find((n) => n.id === draft.id) ?? null) : null;
  const dirty = draft !== null && (open ? draft.title !== open.title || draft.body !== open.body : !!(draft.title || draft.body));
  const empty = draft !== null && !draft.title.trim() && !htmlToText(draft.body);

  const shown = useMemo(() => {
    const q = fold(query.trim());
    return (notes ?? []).filter((n) => !q || fold(n.title).includes(q) || fold(htmlToText(n.body)).includes(q));
  }, [notes, query]);

  /** Leaves the open note, asking first when it has unsaved changes. */
  function leave(): boolean {
    return !dirty || window.confirm(UNSAVED);
  }

  function openNote(next: Draft | null) {
    if (!leave()) return;
    setDraft(next);
    setError(null);
    setSavedAt(null);
    setConfirmDelete(false);
  }

  async function save() {
    if (!draft || saving || empty || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const body = { title: draft.title, body: draft.body };
      const saved = draft.id === null ? await adminCreateNote(body) : await adminUpdateNote(draft.id, body);
      // Last edited first, as the server lists them.
      setNotes((list) => [saved, ...(list ?? []).filter((n) => n.id !== saved.id)]);
      setDraft({ id: saved.id, title: saved.title, body: saved.body });
      setSavedAt(saved.updated_at);
    } catch (err) {
      setError(getApiErrorMessage(err, "Not kaydedilemedi."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!draft) return;
    if (draft.id === null) {
      setDraft(null);
      return;
    }
    try {
      await adminDeleteNote(draft.id);
      setNotes((list) => (list ?? []).filter((n) => n.id !== draft.id));
      setDraft(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Not silinemedi."));
    } finally {
      setConfirmDelete(false);
    }
  }

  // Ctrl/⌘ + S saves the open note; leaving the page with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && draft) {
        e.preventDefault();
        void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  });

  return (
    <>
      <AdminPageHeader
        title="Not Defteri"
        description="Kendinize notlar alın: tedarikçi bilgileri, yapılacaklar, hatırlatmalar. Notlarınızı yalnızca siz görürsünüz."
        actions={
          <Button type="button" onClick={() => openNote({ id: null, title: "", body: "" })} className="w-auto!">
            <Plus className="h-4 w-4" aria-hidden /> Yeni not
          </Button>
        }
      />

      {loadError ? (
        <Alert variant="error">{loadError}</Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* The list: hidden on a phone while a note is open. */}
          <section aria-labelledby="notes-list" className={`${panelClass} ${draft ? "hidden lg:block" : ""} self-start overflow-hidden`}>
            <h2 id="notes-list" className="sr-only">
              Notlar
            </h2>
            <div className="border-b border-slate-200 p-3 dark:border-white/10">
              <label htmlFor="notes-search" className="sr-only">
                Notlarda ara
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  id="notes-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Notlarda ara…"
                  className={`${fieldClass} h-10 pl-9`}
                />
              </div>
            </div>
            {notes === null ? (
              <div className="space-y-2 p-3" aria-busy>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-slate-100 motion-safe:animate-pulse dark:bg-white/5" />
                ))}
              </div>
            ) : shown.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-zinc-400">
                {notes.length === 0 ? "Henüz not yok. “Yeni not” ile başlayın." : "Aramayla eşleşen not yok."}
              </p>
            ) : (
              <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
                {shown.map((n) => {
                  const active = draft?.id === n.id;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !active && openNote({ id: n.id, title: n.title, body: n.body })}
                        aria-current={active || undefined}
                        className={`block w-full px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-500 ${
                          active ? "bg-red-50 dark:bg-red-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className={`block truncate text-sm font-medium ${active ? "text-red-800 dark:text-red-200" : ""}`}>
                          {noteTitle(n)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-zinc-400">
                          {formatDate(n.updated_at)}
                          {n.title.trim() && htmlToText(n.body) ? ` · ${htmlToText(n.body).slice(0, 120)}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* The open note. */}
          {draft ? (
            <section aria-labelledby="note-editor" className={`${panelClass} space-y-4 p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openNote(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Notlar
                </button>
                <h2 id="note-editor" className="sr-only text-sm font-semibold text-slate-500 lg:not-sr-only dark:text-zinc-400">
                  {draft.id === null ? "Yeni not" : "Notu düzenle"}
                </h2>
                <span className="text-xs text-slate-500 dark:text-zinc-400" aria-live="polite">
                  {saving ? "Kaydediliyor…" : dirty ? "Kaydedilmedi" : savedAt ? "Kaydedildi" : open ? `Son düzenleme: ${formatDate(open.updated_at)}` : ""}
                </span>
              </div>

              <div>
                <label htmlFor="note-title" className="sr-only">
                  Başlık
                </label>
                <input
                  id="note-title"
                  value={draft.title}
                  maxLength={TITLE_MAX}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Başlık"
                  autoFocus={draft.id === null}
                  className={`${fieldClass} h-12 text-base font-semibold`}
                />
              </div>
              <div>
                <div className="flex justify-end">
                  <span id="note-body-label" className="sr-only">
                    Not
                  </span>
                  <span className="text-xs tabular-nums text-slate-400 dark:text-zinc-500">
                    {draft.body.length.toLocaleString("tr-TR")}/{BODY_MAX.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="mt-1">
                  <RichTextEditor
                    id="note-body"
                    labelledBy="note-body-label"
                    value={draft.body}
                    onChange={(html) => setDraft((d) => (d ? { ...d, body: html } : d))}
                    placeholder="Notunuzu yazın…"
                    minHeight="16rem"
                  />
                </div>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  {confirmDelete ? (
                    <>
                      <button
                        type="button"
                        onClick={remove}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden /> Evet, sil
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className={ghostClass}>
                        Vazgeç
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (draft.id === null ? remove() : setConfirmDelete(true))}
                      className={`${ghostClass} text-red-700! dark:text-red-300!`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> {draft.id === null ? "Vazgeç" : "Sil"}
                    </button>
                  )}
                </div>
                <Button type="button" onClick={save} loading={saving} disabled={empty || !dirty} className="sm:w-auto!">
                  <Save className="h-4 w-4" aria-hidden /> Kaydet
                </Button>
              </div>
              {empty && draft.id === null && (
                <p className="text-xs text-slate-500 dark:text-zinc-400">Kaydetmek için bir başlık ya da metin yazın.</p>
              )}
            </section>
          ) : (
            <div
              className={`${panelClass} hidden flex-col items-center justify-center gap-3 p-10 text-center lg:flex`}
            >
              <NotebookPen className="h-8 w-8 text-slate-300 dark:text-zinc-600" aria-hidden />
              <p className="text-sm text-slate-500 dark:text-zinc-400">Soldan bir not seçin ya da yeni bir not yazın.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
