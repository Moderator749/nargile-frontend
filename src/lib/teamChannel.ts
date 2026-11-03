/**
 * Ekip Kanalı's bookkeeping, kept free of React so it can be tested on its own:
 * folding a poll's answer into what the drawer shows, the day headings, and
 * the unread count in the tab's title.
 */

export interface ChannelMessage {
  id: number;
  sender_id: string | null;
  sender_name: string;
  body: string;
  created_at: string;
  mine: boolean;
  can_delete: boolean;
}

/**
 * `current` with `incoming` added — each id once, the newer copy winning —
 * and `deletedIds` gone, oldest first.
 */
export function mergeMessages(
  current: readonly ChannelMessage[],
  incoming: readonly ChannelMessage[],
  deletedIds: readonly number[] = [],
): ChannelMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  for (const id of deletedIds) byId.delete(id);
  return [...byId.values()].sort((a, b) => a.id - b.id);
}

const TURKEY_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
const LONG_DAY = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" });
const CLOCK = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });

/** The Turkey calendar day an instant falls on: "2026-11-03". */
export const turkeyDay = (iso: string | Date) => TURKEY_DAY.format(typeof iso === "string" ? new Date(iso) : iso);

/** "Bugün", "Dün", or "1 Kasım 2026": the heading over a day's messages. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const day = turkeyDay(iso);
  const today = turkeyDay(now);
  if (day === today) return "Bugün";
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (day === yesterday.toISOString().slice(0, 10)) return "Dün";
  return LONG_DAY.format(new Date(iso));
}

/** "14:05", Turkey time. */
export const clockTime = (iso: string) => CLOCK.format(new Date(iso));

const COUNT_PREFIX = /^\(\d+\+?\) /;

/** The tab's title with the unread count in front ("(3) Siparişler · …"), or without one at 0. */
export function titleWithCount(title: string, count: number): string {
  const bare = title.replace(COUNT_PREFIX, "");
  if (count <= 0) return bare;
  return `(${count > 99 ? "99+" : count}) ${bare}`;
}

/** The badge's figure: "1"–"99", then "99+". */
export const badgeText = (count: number) => (count > 99 ? "99+" : String(count));
