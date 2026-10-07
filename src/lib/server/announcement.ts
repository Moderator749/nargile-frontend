// Special-day banner, read server-side on every request (never cached), so admin
// edits and expiry show up immediately.

import { API_URL } from "@/lib/config";
import type { Announcement } from "@/types";

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  try {
    const res = await fetch(`${API_URL}/banners/active`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Announcement | null;
    if (!data?.is_active || !data.message) return null;
    // The API already drops expired banners; this guards against clock skew in between.
    if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) return null;
    return data;
  } catch {
    return null; // Never let the banner take the homepage down.
  }
}
