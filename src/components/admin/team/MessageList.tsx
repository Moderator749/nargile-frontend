"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2, Trash2 } from "lucide-react";

import { clockTime, dayLabel, turkeyDay, type ChannelMessage } from "@/lib/teamChannel";

/** A message within this long of the one before it, from the same person, joins it without a name line. */
const RUN_MS = 5 * 60_000;
/** Within this far of the bottom counts as "at the bottom": new messages scroll into view. */
const NEAR_BOTTOM = 80;

/**
 * The channel, oldest at the top: a heading per day, the sender's name and
 * the time over each run of messages, one's own on the other side. New
 * messages scroll into view while the reader is at the bottom; scrolled up
 * reading, they wait behind a "Yeni mesajlar" button instead.
 */
export function MessageList({
  messages,
  loaded,
  hasEarlier,
  open,
  onLoadEarlier,
  onDelete,
}: {
  messages: ChannelMessage[];
  loaded: boolean;
  hasEarlier: boolean;
  open: boolean;
  onLoadEarlier: () => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const lastSeen = useRef<number | null>(null);
  const [behind, setBehind] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const newestId = messages.at(-1)?.id ?? null;
  const newestMine = messages.at(-1)?.mine ?? false;

  const toBottom = () => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // Opening the drawer lands on the latest.
  useLayoutEffect(() => {
    if (open) {
      toBottom();
      atBottom.current = true;
    }
  }, [open, loaded]);

  // A newer message: into view if the reader is at the bottom or wrote it.
  useLayoutEffect(() => {
    if (newestId === null || newestId === lastSeen.current) return;
    const first = lastSeen.current === null;
    lastSeen.current = newestId;
    if (first || atBottom.current || newestMine) toBottom();
  }, [newestId, newestMine]);

  useEffect(() => {
    if (newestId === null || atBottom.current || newestMine) return;
    const timer = setTimeout(() => setBehind(true), 0);
    return () => clearTimeout(timer);
  }, [newestId, newestMine]);

  function onScroll() {
    const el = box.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    if (atBottom.current) setBehind(false);
  }

  async function earlier() {
    const el = box.current;
    const from = el ? el.scrollHeight - el.scrollTop : 0;
    setLoadingEarlier(true);
    try {
      await onLoadEarlier();
      // Keep the reader's place while the older ones are added above.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - from;
      });
    } finally {
      setLoadingEarlier(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Bu mesaj ekipteki herkes için kaldırılsın mı?")) return;
    await onDelete(id);
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={box} onScroll={onScroll} className="h-full overflow-y-auto overscroll-contain px-4 py-3" aria-live="polite" aria-relevant="additions">
        {!loaded && (
          <div className="flex h-full items-center justify-center text-slate-400" aria-busy>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span className="sr-only">Mesajlar yükleniyor</span>
          </div>
        )}
        {loaded && messages.length === 0 && (
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-zinc-400">
            Henüz mesaj yok. Ekibe ilk notu siz yazın.
          </p>
        )}
        {hasEarlier && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={() => void earlier()}
              disabled={loadingEarlier}
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 dark:text-zinc-400 dark:ring-white/10 dark:hover:bg-white/5"
            >
              {loadingEarlier ? "Yükleniyor…" : "Önceki mesajlar"}
            </button>
          </div>
        )}
        <ol className="space-y-1">
          {messages.map((m, i) => {
            const before = messages[i - 1];
            const newDay = !before || turkeyDay(before.created_at) !== turkeyDay(m.created_at);
            const run =
              !newDay &&
              before.sender_id === m.sender_id &&
              before.sender_name === m.sender_name &&
              Date.parse(m.created_at) - Date.parse(before.created_at) < RUN_MS;
            return (
              <li key={m.id}>
                {newDay && (
                  <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    {dayLabel(m.created_at)}
                  </p>
                )}
                <div className={`group flex flex-col ${m.mine ? "items-end" : "items-start"} ${run ? "" : "mt-2"}`}>
                  {!run && (
                    <p className="mb-0.5 px-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-slate-700 dark:text-zinc-200">{m.mine ? "Siz" : m.sender_name}</span>
                      {" · "}
                      <time dateTime={m.created_at}>{clockTime(m.created_at)}</time>
                    </p>
                  )}
                  <div className={`flex max-w-[88%] items-center gap-1 ${m.mine ? "flex-row-reverse" : ""}`}>
                    <p
                      title={run ? clockTime(m.created_at) : undefined}
                      className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        m.mine ? "bg-red-600 text-white dark:bg-red-500" : "bg-slate-100 text-slate-900 dark:bg-white/[0.06] dark:text-zinc-100"
                      }`}
                    >
                      {m.body}
                    </p>
                    {m.can_delete && (
                      <button
                        type="button"
                        onClick={() => void remove(m.id)}
                        aria-label="Mesajı sil"
                        className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition-opacity duration-150 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-red-500 group-hover:opacity-100 dark:text-zinc-500 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {behind && (
        <button
          type="button"
          onClick={() => {
            toBottom();
            setBehind(false);
          }}
          className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden /> Yeni mesajlar
        </button>
      )}
    </div>
  );
}
