"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Lock, LockOpen, NotebookPen, Plus, Save, Search, Trash2 } from "lucide-react";

import { AdminPageHeader, panelClass } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/ui/RichText";
import {
  adminCreateNote,
  adminDeleteNote,
  adminDeleteNotes,
  adminListNotes,
  adminSetNoteLock,
  adminUpdateNote,
} from "@/lib/adminApi";
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

const checkboxClass =
  "h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20";

const fold = foldSearch;

/** A lock the reader knows of: the icon and the toggle are only theirs (the locker's, the Moderator's). */
const knownLocked = (n: AdminNote | null | undefined) => !!n && n.locked === true;

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
 * the right (one after the other on a phone). Ctrl/⌘ + S saves. Notes are
 * ticked for a bulk delete; a locked one is kept until it is unlocked, by
 * whoever locked it or the Moderator (whose list also has every admin's
 * notes, read-only, to manage their locks).
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
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [locking, setLocking] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

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

  // Only one's own notes can be ticked; a lock one knows of keeps a note out of a bulk delete.
  const selectable = shown.filter((n) => n.own && !knownLocked(n)).map((n) => n.id);
  const selectedHere = selectable.filter((id) => selected.has(id));
  const allSelected = selectable.length > 0 && selectedHere.length === selectable.length;

  const toggleRow = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable));

  async function removeSelected() {
    if (bulkBusy || selectedHere.length === 0) return;
    const names = (notes ?? []).filter((n) => selectedHere.includes(n.id)).map(noteTitle);
    if (!window.confirm(`${names.length} not silinecek:\n\n${names.join("\n")}\n\nBu işlem geri alınamaz.`)) return;
    setBulkBusy(true);
    setNotice(null);
    try {
      const { deleted, refused } = await adminDeleteNotes(selectedHere);
      const gone = new Set(deleted);
      setNotes((list) => (list ?? []).filter((n) => !gone.has(n.id)));
      if (draft?.id != null && gone.has(draft.id)) setDraft(null);
      setSelected(new Set(Object.keys(refused).map(Number)));
      const kept = Object.entries(refused).map(([id, why]) => {
        const note = notes?.find((n) => n.id === Number(id));
        return `“${note ? noteTitle(note) : id}”: ${why}`;
      });
      setNotice({
        kind: kept.length > 0 ? "error" : "success",
        text: kept.length > 0 ? `${deleted.length} not silindi. Silinemeyen: ${kept.join(" · ")}` : `${deleted.length} not silindi.`,
      });
    } catch (err) {
      setNotice({ kind: "error", text: getApiErrorMessage(err, "Notlar silinemedi.") });
    } finally {
      setBulkBusy(false);
    }
  }

  async function toggleLock(note: AdminNote) {
    if (locking) return;
    setLocking(true);
    setError(null);
    try {
      const saved = await adminSetNoteLock(note.id, !note.locked);
      // A lock is not an edit: the note keeps its place, the open draft its text.
      setNotes((list) => (list ?? []).map((n) => (n.id === saved.id ? saved : n)));
      if (saved.locked) {
        setConfirmDelete(false);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(saved.id);
          return next;
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Kilit değiştirilemedi."));
    } finally {
      setLocking(false);
    }
  }

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

  // The lock's toggle, for who may turn it (the admin who locked it, the Moderator).
  const lockButton =
    open && open.can_manage_lock ? (
      <button
        type="button"
        onClick={() => toggleLock(open)}
        disabled={locking}
        aria-pressed={knownLocked(open)}
        className={`${ghostClass} ${knownLocked(open) ? "text-amber-700! ring-amber-300! dark:text-amber-300! dark:ring-amber-500/30!" : ""}`}
      >
        {locking ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : knownLocked(open) ? (
          <LockOpen className="h-4 w-4" aria-hidden />
        ) : (
          <Lock className="h-4 w-4" aria-hidden />
        )}
        {knownLocked(open) ? "Kilidi aç" : "Kilitle"}
      </button>
    ) : null;

  return (
    <>
      <AdminPageHeader
        title="Not Defteri"
        description="Kendinize notlar alın: tedarikçi bilgileri, yapılacaklar, hatırlatmalar. Notlarınızı yalnızca siz görürsünüz. Kilitli bir not, kilidi açılmadan silinemez."
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
              {/* Ticking: all of the shown notes one may delete, and the bulk delete. */}
              <div className="mt-3 flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedHere.length > 0 && !allSelected;
                    }}
                    onChange={toggleAll}
                    disabled={selectable.length === 0}
                    className={checkboxClass}
                  />
                  Tümünü seç
                </label>
                <button
                  type="button"
                  onClick={removeSelected}
                  disabled={selectedHere.length === 0 || bulkBusy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-700 ring-1 ring-red-300 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:ring-red-500/30 dark:hover:bg-red-500/10"
                >
                  {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
                  Seçilenleri Sil{selectedHere.length > 0 ? ` (${selectedHere.length})` : ""}
                </button>
              </div>
              {notice && (
                <div className="mt-3">
                  <Alert variant={notice.kind}>{notice.text}</Alert>
                </div>
              )}
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
                    <li
                      key={n.id}
                      className={`flex items-stretch transition-colors ${
                        active ? "bg-red-50 dark:bg-red-500/10" : selected.has(n.id) ? "bg-red-50/50 dark:bg-red-500/[0.06]" : "hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {/* Another admin's note (the Moderator's list) is not one to tick. */}
                      <span className="flex w-10 shrink-0 items-start justify-center pt-3.5">
                        {n.own && (
                          <input
                            type="checkbox"
                            checked={selected.has(n.id) && !knownLocked(n)}
                            onChange={() => toggleRow(n.id)}
                            disabled={knownLocked(n)}
                            title={knownLocked(n) ? "Kilitli not silinemez" : undefined}
                            aria-label={`“${noteTitle(n)}” notunu seç`}
                            className={checkboxClass}
                          />
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => !active && openNote({ id: n.id, title: n.title, body: n.body })}
                        aria-current={active || undefined}
                        className="block min-w-0 flex-1 py-3 pr-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-500"
                      >
                        <span className={`flex items-center gap-1.5 text-sm font-medium ${active ? "text-red-800 dark:text-red-200" : ""}`}>
                          <span className="truncate">{noteTitle(n)}</span>
                          {knownLocked(n) && (
                            <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-label="Kilitli" />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-zinc-400">
                          {n.author && <span className="font-medium text-slate-700 dark:text-zinc-300">{n.author} · </span>}
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

          {/* The open note: another admin's (the Moderator's list) only to read and lock. */}
          {draft && open && !open.own ? (
            <section aria-labelledby="note-readonly" className={`${panelClass} space-y-4 p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openNote(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 lg:hidden dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Notlar
                </button>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  {open.author} · Son düzenleme: {formatDate(open.updated_at)}
                </span>
              </div>
              <h2 id="note-readonly" className="flex items-center gap-2 text-base font-semibold">
                {noteTitle(open)}
                {knownLocked(open) && <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-label="Kilitli" />}
              </h2>
              <RichText html={open.body} className="text-sm text-slate-700 dark:text-zinc-300" />
              {error && <Alert variant="error">{error}</Alert>}
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-zinc-400">Başka bir adminin notu: yalnızca kilidini yönetebilirsiniz.</p>
                {lockButton}
              </div>
            </section>
          ) : draft ? (
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
                <div className="flex flex-wrap gap-2">
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
                      disabled={knownLocked(open)}
                      title={knownLocked(open) ? "Kilitli not silinemez: önce kilidi açın" : undefined}
                      className={`${ghostClass} text-red-700! disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300!`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> {draft.id === null ? "Vazgeç" : "Sil"}
                    </button>
                  )}
                  {lockButton}
                </div>
                <Button type="button" onClick={save} loading={saving} disabled={empty || !dirty} className="sm:w-auto!">
                  <Save className="h-4 w-4" aria-hidden /> Kaydet
                </Button>
              </div>
              {knownLocked(open) && (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> Bu not kilitli: silmek için önce kilidi açın.
                </p>
              )}
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
