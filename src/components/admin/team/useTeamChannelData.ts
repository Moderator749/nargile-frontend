"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import axios from "axios";

import { getApiErrorMessage } from "@/lib/errors";
import {
  dailyNote,
  deleteTeamMessage,
  markTeamRead,
  postTeamMessage,
  saveDailyNote,
  teamMessages,
  teamUnread,
  type DailyNote,
  type Unread,
} from "@/lib/teamApi";
import { IDLE_AFTER, mergeMessages, pollEvery, untilIdle, type ChannelMessage } from "@/lib/teamChannel";

/** Günün Notu changes rarely: asked again at most this often. */
const NOTE_EVERY = 60_000;
const FIRST_PAGE = 50;

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** Whether the tab is in front: a tab in the background asks nothing. */
function useTabVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => true);
}

const ACTIVITY = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Whether nobody has moved the mouse, typed or touched the page for
 * IDLE_AFTER. The first sign of life ends it; so does the tab coming back.
 */
function useIdle(): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let last = Date.now();
    let away = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      const left = untilIdle(last, Date.now());
      if (left > 0) {
        timer = setTimeout(check, left);
      } else {
        away = true;
        setIdle(true);
      }
    };
    // Only a timestamp on each event: a mouse move costs next to nothing.
    const active = () => {
      last = Date.now();
      if (!away) return;
      away = false;
      setIdle(false);
      timer = setTimeout(check, IDLE_AFTER);
    };
    const shown = () => {
      if (document.visibilityState === "visible") active();
    };
    timer = setTimeout(check, IDLE_AFTER);
    for (const name of ACTIVITY) window.addEventListener(name, active, { capture: true, passive: true });
    document.addEventListener("visibilitychange", shown);
    return () => {
      clearTimeout(timer);
      for (const name of ACTIVITY) window.removeEventListener(name, active, { capture: true });
      document.removeEventListener("visibilitychange", shown);
    };
  }, []);
  return idle;
}

/**
 * Ekip Kanalı's data, kept fresh by polling — no socket. Open: the newer
 * messages (`after_id`) every few seconds, the note now and then, and what
 * has been seen marked read; every half minute once nobody has touched the
 * page for ten minutes, and at once when someone does. Closed: the unread
 * count once a minute. In a background tab: nothing, until it is in front
 * again (then at once). One
 * request at a time; a change of state cancels the one in flight.
 */
export function useTeamChannelData(open: boolean) {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hasEarlier, setHasEarlier] = useState(false);
  const [unread, setUnread] = useState<Unread | null>(null);
  const [note, setNote] = useState<DailyNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visible = useTabVisible();
  const every = pollEvery(open, useIdle());

  // The newest message held (null: nothing asked yet), when the note was last
  // asked, and how far the server has been told this member has read.
  const newest = useRef<number | null>(null);
  const noteAt = useRef(0);
  const readUpTo = useRef(0);

  const syncOpen = useEffectEvent(async (signal: AbortSignal) => {
    if (newest.current === null) {
      const page = await teamMessages({ limit: FIRST_PAGE }, signal);
      setMessages(page.messages);
      setHasEarlier(page.has_more);
      newest.current = page.messages.at(-1)?.id ?? 0;
      setLoaded(true);
    } else {
      // More than a page may have come while the drawer was shut: ask until caught up.
      for (let more = true; more; ) {
        const page = await teamMessages({ after_id: newest.current }, signal);
        setMessages((current) => mergeMessages(current, page.messages, page.deleted_ids));
        newest.current = page.messages.at(-1)?.id ?? newest.current;
        more = page.has_more;
      }
    }
    if (Date.now() - noteAt.current > NOTE_EVERY) {
      setNote(await dailyNote(signal));
      noteAt.current = Date.now();
    }
    // Shown in an open drawer, in a tab in front: seen.
    if (newest.current > readUpTo.current) {
      setUnread(await markTeamRead(newest.current, signal));
      readUpTo.current = newest.current;
    }
    setError(null);
  });

  const syncClosed = useEffectEvent(async (signal: AbortSignal) => {
    const answer = await teamUnread(signal);
    setUnread(answer);
    readUpTo.current = Math.max(readUpTo.current, answer.last_read_id);
    setError(null);
  });

  useEffect(() => {
    if (!visible) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const tick = async () => {
      try {
        await (open ? syncOpen(controller.signal) : syncClosed(controller.signal));
      } catch (err) {
        if (axios.isCancel(err) || stopped) return;
        setError(getApiErrorMessage(err, "Ekip Kanalı'na şu an ulaşılamıyor; yeniden deneniyor."));
      }
      if (!stopped) timer = setTimeout(tick, every);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, visible, every]);

  /** Post; the answer is shown at once, and replying counts as reading. */
  async function send(body: string) {
    const message = await postTeamMessage(body);
    setMessages((current) => mergeMessages(current, [message]));
    newest.current = Math.max(newest.current ?? 0, message.id);
    readUpTo.current = Math.max(readUpTo.current, message.id);
    setUnread((u) => ({ count: 0, latest_id: Math.max(u?.latest_id ?? 0, message.id), last_read_id: message.id }));
  }

  async function remove(id: number) {
    await deleteTeamMessage(id);
    setMessages((current) => mergeMessages(current, [], [id]));
  }

  async function loadEarlier() {
    const first = messages[0]?.id;
    if (first === undefined) return;
    const page = await teamMessages({ before_id: first });
    setMessages((current) => mergeMessages(current, page.messages));
    setHasEarlier(page.has_more);
  }

  async function updateNote(text: string) {
    setNote(await saveDailyNote(text));
    noteAt.current = Date.now();
  }

  return {
    messages,
    loaded,
    hasEarlier,
    // An open drawer has nothing unread.
    unreadCount: open ? 0 : (unread?.count ?? 0),
    note,
    error,
    send,
    remove,
    loadEarlier,
    updateNote,
  };
}
