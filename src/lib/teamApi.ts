import { api } from "@/lib/api";
import type { ChannelMessage } from "@/lib/teamChannel";

/** Ekip Kanalı and Günün Notu (backend app/api/v1/admin_team.py), for admins and staff. */

export interface MessagePage {
  messages: ChannelMessage[];
  /** Withdrawn in the last few minutes: drop them if shown. */
  deleted_ids: number[];
  /** More in the direction asked: newer after `after_id`, older otherwise. */
  has_more: boolean;
}

export interface Unread {
  count: number;
  latest_id: number;
  last_read_id: number;
}

export interface DailyNote {
  text: string | null;
  updated_by_name: string | null;
  updated_at: string | null;
}

export const MESSAGE_MAX = 2000;
export const NOTE_MAX = 500;

export async function teamMessages(
  params: { after_id?: number; before_id?: number; limit?: number },
  signal?: AbortSignal,
): Promise<MessagePage> {
  const { data } = await api.get<MessagePage>("/admin/team/messages", { params, signal });
  return data;
}

export async function postTeamMessage(body: string): Promise<ChannelMessage> {
  const { data } = await api.post<ChannelMessage>("/admin/team/messages", { body });
  return data;
}

export async function deleteTeamMessage(id: number): Promise<void> {
  await api.delete(`/admin/team/messages/${id}`);
}

export async function teamUnread(signal?: AbortSignal): Promise<Unread> {
  const { data } = await api.get<Unread>("/admin/team/unread", { signal });
  return data;
}

export async function markTeamRead(lastReadId: number, signal?: AbortSignal): Promise<Unread> {
  const { data } = await api.post<Unread>("/admin/team/read", { last_read_id: lastReadId }, { signal });
  return data;
}

export async function dailyNote(signal?: AbortSignal): Promise<DailyNote> {
  const { data } = await api.get<DailyNote>("/admin/team/daily-note", { signal });
  return data;
}

export async function saveDailyNote(text: string): Promise<DailyNote> {
  const { data } = await api.put<DailyNote>("/admin/team/daily-note", { text });
  return data;
}
